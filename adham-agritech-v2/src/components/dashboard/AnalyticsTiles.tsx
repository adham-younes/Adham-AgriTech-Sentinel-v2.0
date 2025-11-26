import type { FieldAnalysisPayload } from "@/types/agri";

interface AnalyticsTilesProps {
  data?: FieldAnalysisPayload;
  loading?: boolean;
}

const tileBase =
  "rounded-2xl border border-primary/30 bg-surface/70 p-5 shadow-lg shadow-primary/10 flex flex-col gap-3";

function formatPercent(value?: number | null) {
  if (value == null) return "--";
  return `${(value * 100).toFixed(1)}%`;
}

function soilTone(value?: number | null) {
  if (value == null) return "text-muted";
  const percent = value * 100;
  if (percent < 20) return "text-[#FF1744]";
  if (percent > 40) return "text-primary";
  return "text-muted";
}

export function AnalyticsTiles({ data, loading }: AnalyticsTilesProps) {
  const stats = data?.metrics;
  const alertsCount = data?.alerts.length ?? 0;

  return (
    <section className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      <div className={tileBase}>
        <p className="text-sm uppercase tracking-wide text-muted">Soil</p>
        <p className={`text-3xl font-semibold ${soilTone(stats?.moisture.latest)}`}>
          {loading ? "…" : formatPercent(stats?.moisture.latest)}
        </p>
        <p className="text-xs text-muted">Moisture saturation (ESODA)</p>
      </div>
      <div className={tileBase}>
        <p className="text-sm uppercase tracking-wide text-muted">Water</p>
        <p className="text-3xl font-semibold text-primary">
          {loading ? "…" : data?.irrigationNeed ?? "--"}
        </p>
        <p className="text-xs text-muted">Irrigation Need</p>
      </div>
      <div className={tileBase}>
        <p className="text-sm uppercase tracking-wide text-muted">Health</p>
        <div>
          <p className="text-3xl font-semibold text-primary">
            {loading ? "…" : stats ? stats.ndvi.latest.toFixed(2) : "--"}
          </p>
          <p className="text-xs text-muted">
            Health Score: {loading ? "…" : stats ? `${stats.ndvi.healthScore}/100` : "--"}
          </p>
        </div>
      </div>
      <div className={tileBase}>
        <p className="text-sm uppercase tracking-wide text-muted">Alerts</p>
        <p className="text-3xl font-semibold text-primary">{loading ? "…" : alertsCount}</p>
        <p className="text-xs text-muted">Realtime satellite advisories</p>
      </div>
    </section>
  );
}
