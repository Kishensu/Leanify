"use client";

/** Horizontal bar-per-metric comparing current value against target — simplest
 * consistent way to bar-chart four metrics that share no common unit. */
export default function KpiTargetBars({
  metrics,
}: {
  metrics: { metricName: string; value: number; targetValue: number; unit: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {metrics.map((m) => {
        const isPercent = m.unit === "%";
        const onTarget = isPercent ? m.value >= m.targetValue : m.value <= m.targetValue;
        const ratio = m.targetValue > 0 ? m.value / m.targetValue : 1;
        const widthPct = Math.min(150, Math.max(4, ratio * 100));

        return (
          <div key={m.metricName}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-ink-600">{m.metricName}</span>
              <span className="font-mono text-ink-500">
                {m.value}
                {m.unit === "%" ? "%" : ` ${m.unit}`} vs target {m.targetValue}
                {m.unit === "%" ? "%" : ` ${m.unit}`}
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className={`h-full rounded-full ${onTarget ? "bg-teal-500" : "bg-coral-500"}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
