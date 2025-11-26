"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { AnalyticsTiles } from "@/components/dashboard/AnalyticsTiles";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { AgriChat } from "@/components/ai/AgriChat";
import { useFieldAnalytics } from "@/hooks/useFieldAnalytics";

const SentinelCore = dynamic(
  () => import("@/components/map/SentinelCore").then((module) => module.SentinelCore),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-muted">
        Initializing SentinelCore…
      </div>
    ),
  }
);

export function CommandCenter() {
  const { data, error, isLoading } = useFieldAnalytics();

  const mapMetrics = useMemo(() => {
    if (!data?.metrics) return { ndvi: null, moisture: null };
    return {
      ndvi: data.metrics.ndvi.latest,
      moisture: data.metrics.moisture.latest,
    };
  }, [data?.metrics]);

  const lastSync = useMemo(() => {
    const series = data?.metrics?.ndvi.series;
    if (!series || series.length === 0) return "--";
    const latestPoint = series[series.length - 1];
    return new Date(latestPoint.date).toLocaleString();
  }, [data?.metrics?.ndvi.series]);

  return (
    <div className="space-y-10">
      <AnalyticsTiles data={data} loading={isLoading} />
      {error && (
        <div className="rounded-2xl border border-danger/40 bg-black/80 p-4 text-danger">
          فشل جلب بيانات ESODA: {(error as Error).message}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-primary/30 bg-black/60 p-6 shadow-2xl shadow-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">Sentinel Core</p>
              <h2 className="text-2xl font-semibold text-primary">Map Intelligence</h2>
            </div>
            <span className="text-xs text-muted">آخر تحديث: {lastSync}</span>
          </div>
          <div className="mt-4 h-[60vh] rounded-3xl border border-primary/20 bg-surface/40">
            <SentinelCore
              fieldGeometry={data?.field.geometry}
              ndvi={mapMetrics.ndvi}
              moisture={mapMetrics.moisture}
            />
          </div>
        </div>
        <div className="space-y-6">
          <RecommendationsPanel data={data} loading={isLoading} />
          <AgriChat />
        </div>
      </div>
    </div>
  );
}
