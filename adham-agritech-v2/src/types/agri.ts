import type { Feature, MultiPolygon, Polygon } from "geojson";

export interface FieldRecord {
  id: string;
  name: string;
  geometry: Feature<Polygon | MultiPolygon>;
  centroid: [number, number];
}

export interface MetricSeriesPoint {
  date: string;
  value: number;
}

export interface MetricSet {
  latest: number;
  series: MetricSeriesPoint[];
}

export type MoistureStatus = "LOW" | "OPTIMAL" | "HIGH";
export type IrrigationNeed = "LOW" | "HIGH";

export interface FieldMetrics {
  ndvi: MetricSet & { healthScore: number };
  moisture: MetricSet & { status: MoistureStatus };
}

export interface FieldAnalysisPayload {
  field: FieldRecord;
  metrics: FieldMetrics;
  irrigationNeed: IrrigationNeed;
  alerts: string[];
  recommendations: string[];
  forecast: string;
}
