import { NextResponse } from "next/server";

interface AssistantRequest {
  message: string;
  context?: {
    ndvi: number | null;
    moisture: number | null;
  };
}

const HEALTH_BUCKETS = [
  { threshold: 0.65, label: "Healthy" },
  { threshold: 0.45, label: "Moderate" },
  { threshold: -Infinity, label: "Stressed" },
];

function describeHealth(ndvi: number | null) {
  if (ndvi == null) return "NDVI unavailable";
  for (const bucket of HEALTH_BUCKETS) {
    if (ndvi >= bucket.threshold) {
      return `${(ndvi * 100).toFixed(0)}% canopy vigor (${bucket.label})`;
    }
  }
  return "NDVI unavailable";
}

function describeMoisture(value: number | null) {
  if (value == null) return "Moisture telemetry offline";
  const percent = value * 100;
  if (percent < 20) return `${percent.toFixed(1)}% soil moisture (Critical Low)`;
  if (percent < 40) return `${percent.toFixed(1)}% soil moisture (Optimal)`;
  return `${percent.toFixed(1)}% soil moisture (High)`;
}

function craftResponse(message: string, ndvi: number | null, moisture: number | null) {
  const healthSummary = describeHealth(ndvi);
  const moistureSummary = describeMoisture(moisture);
  return `Context: ${healthSummary}, ${moistureSummary}. Response: ${message.includes("irrigation") || message.includes("water")
    ? "Irrigation Plan"
    : "Field Update"
  } -> ${
    ndvi == null || moisture == null
      ? "Awaiting latest ESODA sync; rerun analytics to refresh telemetry."
      : `Canopy currently holds ${healthSummary}. Soil stack sits at ${moistureSummary}. Maintain zero-input monitoring; escalate irrigation only if trend continues.`
  }`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequest;
    const ndvi = body.context?.ndvi ?? null;
    const moisture = body.context?.moisture ?? null;
    const reply = craftResponse(body.message ?? "", ndvi, moisture);
    const context = `Context: Current NDVI is ${ndvi?.toFixed(2) ?? "--"}, Moisture is ${
      moisture != null ? `${(moisture * 100).toFixed(1)}%` : "--"
    }.`;
    return NextResponse.json({ reply, context }, { status: 200 });
  } catch (error) {
    console.error("/api/assistant failed", error);
    return NextResponse.json({ message: "Assistant failure" }, { status: 500 });
  }
}
