import { NextResponse } from "next/server";

import { getPrimaryField } from "@/lib/data/fields";
import { fetchEsodaMetrics } from "@/lib/esoda";
import type { FieldAnalysisPayload, IrrigationNeed } from "@/types/agri";

function determineIrrigationNeed(moistureValue: number): IrrigationNeed {
  if (moistureValue < 0.25) return "HIGH";
  return "LOW";
}

function buildAlerts(healthScore: number, moisturePercent: number): string[] {
  const alerts: string[] = [];
  if (healthScore < 55) {
    alerts.push("Vegetation stress detected. Prioritize scouting.");
  }
  if (moisturePercent < 25) {
    alerts.push("Soil moisture is critically low. Plan irrigation within 24h.");
  }
  return alerts;
}

function buildRecommendations(irrigationNeed: IrrigationNeed, alerts: string[]): string[] {
  if (alerts.length === 0 && irrigationNeed === "LOW") {
    return ["Conditions stable. Continue satellite monitoring only."];
  }

  const items = new Set<string>();
  if (irrigationNeed === "HIGH") {
    items.add("Initiate targeted irrigation cycle for low-moisture zones.");
  }
  if (alerts.some((a) => a.includes("Vegetation"))) {
    items.add("Deploy agronomist inspection focusing on stressed polygons.");
  }
  if (alerts.some((a) => a.includes("moisture"))) {
    items.add("Cross-check pump capacity and soil probes before irrigation.");
  }
  return Array.from(items);
}

function buildForecast(ndvi: number, moisturePercent: number): string {
  const vigor = ndvi >= 0.65 ? "healthy canopy" : ndvi >= 0.45 ? "moderate growth" : "weak vigor";
  const moistureState = moisturePercent < 25 ? "dry air mass" : moisturePercent > 45 ? "humid layer" : "balanced humidity";
  return `48h outlook: ${vigor} with ${moistureState}. Stay aligned with irrigation plan.`;
}

export async function GET() {
  try {
    const field = await getPrimaryField();
    const metrics = await fetchEsodaMetrics(field.geometry);

    const moisturePercent = Number((metrics.moisture.latest * 100).toFixed(1));
    const irrigationNeed = determineIrrigationNeed(metrics.moisture.latest);
    const alerts = buildAlerts(metrics.ndvi.healthScore, moisturePercent);
    const recommendations = buildRecommendations(irrigationNeed, alerts);
    const forecast = buildForecast(metrics.ndvi.latest, moisturePercent);

    const payload: FieldAnalysisPayload = {
      field,
      metrics,
      irrigationNeed,
      alerts,
      recommendations,
      forecast,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("/api/analyze-field failed", error);
    return NextResponse.json(
      { message: "Failed to analyze field", error: (error as Error).message },
      { status: 500 }
    );
  }
}
