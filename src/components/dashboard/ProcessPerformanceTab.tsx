"use client";

import { useState } from "react";
import TrendLineChart from "@/components/charts/TrendLineChart";
import KpiTargetBars from "@/components/charts/KpiTargetBars";
import type { ProcessDetail } from "@/lib/types";

export default function ProcessPerformanceTab({ detail }: { detail: ProcessDetail }) {
  const [selectedMetric, setSelectedMetric] = useState(detail.kpiMetrics[0]?.metricName ?? "");

  if (detail.kpiMetrics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 px-6 py-10 text-center text-ink-400">
        No KPI metrics defined for this process yet.
      </div>
    );
  }

  const trendMetric = detail.kpiMetrics.find((m) => m.metricName === selectedMetric) ?? detail.kpiMetrics[0];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {detail.kpiMetrics.map((m) => {
          const isPercent = m.unit === "%";
          const onTarget = isPercent ? m.value >= m.targetValue : m.value <= m.targetValue;
          return (
            <div key={m.id} className="rounded-lg border border-ink-100 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{m.metricName}</div>
              <div className="mt-2 font-mono text-2xl font-semibold text-ink-900">
                {m.value}
                <span className="ml-1 text-sm font-normal text-ink-400">{m.unit}</span>
              </div>
              <div className={`mt-1 font-mono text-xs ${onTarget ? "text-teal-600" : "text-coral-500"}`}>
                target {m.targetValue}
                {m.unit === "%" ? "%" : ` ${m.unit}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-ink-100 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Trend</span>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="rounded-md border border-ink-200 px-2 py-1 text-xs outline-none focus:border-teal-500"
          >
            {detail.kpiMetrics.map((m) => (
              <option key={m.metricName} value={m.metricName}>
                {m.metricName}
              </option>
            ))}
          </select>
        </div>
        {trendMetric && (
          <TrendLineChart
            points={trendMetric.readings.map((r) => r.value)}
            labels={trendMetric.readings.map((r) => r.periodLabel)}
            referenceLines={[{ value: trendMetric.targetValue, color: "#0f9488", dashed: true, label: "target" }]}
            unit={trendMetric.unit === "%" ? "%" : ` ${trendMetric.unit}`}
          />
        )}
      </div>

      <div className="mt-6 rounded-lg border border-ink-100 bg-white p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">KPIs vs. target</div>
        <KpiTargetBars metrics={detail.kpiMetrics} />
      </div>
    </div>
  );
}
