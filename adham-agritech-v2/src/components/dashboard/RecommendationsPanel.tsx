import type { FieldAnalysisPayload } from "@/types/agri";

interface RecommendationsPanelProps {
  data?: FieldAnalysisPayload;
  loading?: boolean;
}

export function RecommendationsPanel({ data, loading }: RecommendationsPanelProps) {
  const recommendations = data?.recommendations ?? [];
  const forecast = data?.forecast;

  return (
    <div className="rounded-2xl border border-primary/30 bg-black/70 p-5 text-sm text-muted backdrop-blur-xl shadow-lg shadow-primary/10">
      <h2 className="text-xl font-semibold text-primary">Recommendations</h2>
      <div className="mt-4 space-y-3">
        {loading && <p className="text-muted">Syncing live telemetry…</p>}
        {!loading && recommendations.length === 0 && (
          <p className="text-muted">No immediate advisories. Monitoring continues.</p>
        )}
        {recommendations.map((item) => (
          <div key={item} className="rounded-xl border border-primary/20 bg-surface/70 px-4 py-3 text-text">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-primary/20 bg-surface/50 px-4 py-4 text-text">
        <p className="text-xs uppercase tracking-wide text-muted">48H Forecast</p>
        <p className="mt-2 text-base text-text">
          {loading ? "Loading forecast…" : forecast ?? "Awaiting ESODA prediction."}
        </p>
      </div>
    </div>
  );
}
