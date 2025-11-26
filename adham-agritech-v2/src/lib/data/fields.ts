import "server-only";

import { Pool } from "pg";
import type { Feature, MultiPolygon, Polygon } from "geojson";

import type { FieldRecord } from "@/types/agri";

let pool: Pool | null = null;

declare global {
  // eslint-disable-next-line no-var
  var __agri_pool__: Pool | undefined;
}

const FIELD_QUERY = `
  SELECT id,
         name,
         ST_AsGeoJSON(geometry)::json AS geometry,
         ST_AsGeoJSON(ST_Centroid(geometry))::json AS centroid
  FROM fields
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1
`;

const FALLBACK_FIELD: FieldRecord = {
  id: "fallback-field",
  name: "Sentinel Field",
  geometry: {
    type: "Feature",
    properties: { id: "fallback-field", name: "Sentinel Field" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [31.197357, 30.007408],
          [31.22139, 30.007408],
          [31.22139, 30.027639],
          [31.197357, 30.027639],
          [31.197357, 30.007408],
        ],
      ],
    },
  } as Feature<Polygon>,
  centroid: [30.017523, 31.209374],
};

type PointGeometry = { type: "Point"; coordinates: [number, number] };

function getPool(): Pool {
  if (globalThis.__agri_pool__) {
    return globalThis.__agri_pool__;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Set it or provide DEFAULT_FIELD_GEOJSON for local development."
    );
  }

  pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  globalThis.__agri_pool__ = pool;
  return pool;
}

function normalizeGeometry(
  feature: Feature<Polygon | MultiPolygon>,
  centroid: Feature<PointGeometry>
): FieldRecord {
  const centroidCoords = centroid.geometry.coordinates;
  return {
    id: feature.properties?.id?.toString() ?? "unknown-field",
    name: feature.properties?.name ?? "Active Field",
    geometry: feature,
    centroid: [centroidCoords[1], centroidCoords[0]],
  };
}

function parseFallbackFromEnv(): FieldRecord | null {
  const raw = process.env.DEFAULT_FIELD_GEOJSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FieldRecord;
    if (!parsed.geometry) {
      throw new Error("DEFAULT_FIELD_GEOJSON must include a GeoJSON geometry.");
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse DEFAULT_FIELD_GEOJSON", error);
    return null;
  }
}

export async function getPrimaryField(): Promise<FieldRecord> {
  if (!process.env.DATABASE_URL) {
    return parseFallbackFromEnv() ?? FALLBACK_FIELD;
  }

  const pgPool = getPool();
  const client = await pgPool.connect();
  try {
    const result = await client.query(FIELD_QUERY);
    if (!result.rows.length) {
      return parseFallbackFromEnv() ?? FALLBACK_FIELD;
    }

    const row = result.rows[0];
    return normalizeGeometry(
      row.geometry as Feature<Polygon | MultiPolygon>,
      row.centroid as Feature<PointGeometry>
    );
  } finally {
    client.release();
  }
}
