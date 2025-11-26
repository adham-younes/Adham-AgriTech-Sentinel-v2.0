import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { FieldMetrics, MetricSet, MetricSeriesPoint, MoistureStatus } from "@/types/agri";

const TOKEN_URL = "https://services.sentinel-hub.com/oauth/token";
const STATS_URL = "https://services.sentinel-hub.com/api/v1/statistics";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

async function getEsodaToken(): Promise<string> {
  const clientId = requireEnv("ESODA_CLIENT_ID");
  const clientSecret = requireEnv("ESODA_CLIENT_SECRET");

  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ESODA auth failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };
  return payload.access_token;
}

const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B02", "B03", "B04", "B08", "B11"], units: "REFLECTANCE" }],
    output: [
      { id: "NDVI", bands: 1, sampleType: "FLOAT32" },
      { id: "MOISTURE", bands: 1, sampleType: "FLOAT32" }
    ],
  };
}

function evaluatePixel(sample) {
  const ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  const moisture = sample.B11 / (sample.B04 + 0.00001);
  return {
    NDVI: [ndvi],
    MOISTURE: [moisture],
  };
}`;

interface StatsEntry {
  interval: { from: string; to: string };
  outputs: {
    NDVI?: { bands: { B0: { stats: { mean?: number | null } } } };
    MOISTURE?: { bands: { B0: { stats: { mean?: number | null } } } };
  };
}

interface StatsResponse {
  data: StatsEntry[];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildSeries(entries: StatsEntry[], key: "NDVI" | "MOISTURE"): MetricSet {
  const series: MetricSeriesPoint[] = entries.map((entry) => {
    const stat = entry.outputs[key]?.bands?.B0?.stats?.mean ?? 0;
    return {
      date: entry.interval.to,
      value: Number.isFinite(stat) ? Number(stat.toFixed(3)) : 0,
    };
  });

  const latest = series.length ? series[series.length - 1].value : 0;
  return { latest, series };
}

function moistureStatus(value: number): MoistureStatus {
  if (value < 0.2) return "LOW";
  if (value > 0.35) return "HIGH";
  return "OPTIMAL";
}

export async function fetchEsodaMetrics(
  geometry: Feature<Polygon | MultiPolygon>,
  lookbackDays = 30
): Promise<FieldMetrics> {
  const instanceId = requireEnv("ESODA_INSTANCE_ID");
  const token = await getEsodaToken();
  const now = new Date();
  const from = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  const payload = {
    input: {
      bounds: { geometry },
      data: [
        {
          type: "S2L2A",
          dataFilter: {
            timeRange: { from: from.toISOString(), to: now.toISOString() },
            mosaickingOrder: "mostRecent",
            maxCloudCoverage: 30,
          },
        },
      ],
    },
    aggregation: {
      timeRange: { from: from.toISOString(), to: now.toISOString() },
      aggregationInterval: { of: "P1D" },
      evalscript: EVALSCRIPT,
    },
  };

  const response = await fetch(`${STATS_URL}/${instanceId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ESODA statistics failed (${response.status}): ${error}`);
  }

  const stats = (await response.json()) as StatsResponse;
  const ndvi = buildSeries(stats.data, "NDVI");
  const moisture = buildSeries(stats.data, "MOISTURE");

  const healthScore = Math.round(clamp(ndvi.latest, 0, 1) * 100);
  const status = moistureStatus(moisture.latest);

  return {
    ndvi: { ...ndvi, healthScore },
    moisture: { ...moisture, status },
  };
}
