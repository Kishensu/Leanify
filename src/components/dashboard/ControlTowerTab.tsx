"use client";

import { useState } from "react";
import TrendLineChart from "@/components/charts/TrendLineChart";
import type { ControlTowerMetricDto, ProcessDetail } from "@/lib/types";
import type { MetricStatus } from "@/lib/status";

const STATUS_DOT: Record<MetricStatus, string> = {
  breach: "bg-coral-500",
  watch: "bg-amber-500",
  in_control: "bg-teal-500",
};

const STATUS_TEXT: Record<MetricStatus, string> = {
  breach: "text-coral-500",
  watch: "text-amber-600",
  in_control: "text-teal-600",
};

type Filter = "all" | MetricStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All Activities" },
  { key: "breach", label: "Breach" },
  { key: "watch", label: "Watch" },
  { key: "in_control", label: "In Control" },
];

function SummaryCard({ label, count, barColor }: { label: string; count: number; barColor: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
      <div className={`h-1 w-full ${barColor}`} />
      <div className="p-4">
        <div className="font-mono text-2xl font-semibold text-ink-900">{count}</div>
        <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</div>
      </div>
    </div>
  );
}

function MetricBlock({ metric }: { metric: ControlTowerMetricDto }) {
  const referenceLines = [
    { value: metric.ucl, color: "#e2513a", label: "UCL" },
    ...(metric.warningUcl !== null ? [{ value: metric.warningUcl, color: "#d97706", dashed: true, label: "warn" }] : []),
    ...(metric.warningLcl !== null ? [{ value: metric.warningLcl, color: "#d97706", dashed: true, label: "warn" }] : []),
    ...(metric.lcl !== null ? [{ value: metric.lcl, color: "#e2513a", label: "LCL" }] : []),
  ];

  return (
    <div className="rounded-lg border border-ink-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[metric.status]}`} />
        <span className="font-medium text-ink-900">
          {metric.activityCode && <span className="mr-1.5 font-mono text-xs text-ink-400">{metric.activityCode} —</span>}
          {metric.metricName}
        </span>
        <span className={`ml-auto text-xs font-medium ${STATUS_TEXT[metric.status]}`}>
          {metric.status === "in_control" ? "In control" : metric.status === "watch" ? "Watch" : "Breach"}
        </span>
      </div>

      <TrendLineChart
        points={metric.readings.map((r) => r.value)}
        labels={metric.readings.map((_, i) => String(i + 1))}
        referenceLines={referenceLines}
        lineColor={metric.status === "breach" ? "#e2513a" : metric.status === "watch" ? "#d97706" : "#0f9488"}
      />

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-ink-100 pt-3 text-xs">
        <div>
          <dt className="text-ink-400">How it&apos;s measured</dt>
          <dd className="text-ink-700">{metric.measurementMethod ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Responsible</dt>
          <dd className="text-ink-700">{metric.responsibleRole ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Review frequency</dt>
          <dd className="text-ink-700">{metric.reviewFrequency ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Trigger</dt>
          <dd className="text-ink-700">{metric.triggerDescription ?? "—"}</dd>
        </div>
      </dl>

      {metric.reactionPlan && (
        <div className="mt-3 rounded-md bg-coral-50/60 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-coral-600">Reaction plan</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-ink-600 ring-1 ring-inset ring-ink-200">
              {metric.reactionPlan.automatedCount} / {metric.reactionPlan.totalSteps} Steps Automated
            </span>
          </div>
          <ol className="ml-1 flex flex-col gap-1 text-sm text-ink-700">
            {metric.reactionPlan.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0" title={step.automated ? "Automated" : "Manual"}>
                  {step.automated ? "⚙️" : "🖐️"}
                </span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
          <div className="mt-2 text-xs text-ink-400">Escalation trigger: {metric.reactionPlan.escalationTrigger}</div>
        </div>
      )}
    </div>
  );
}

export default function ControlTowerTab({ detail }: { detail: ProcessDetail }) {
  const [filter, setFilter] = useState<Filter>("all");

  if (detail.controlTowerMetrics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 px-6 py-10 text-center text-ink-400">
        No control tower metrics defined for this process yet.
      </div>
    );
  }

  const filtered =
    filter === "all" ? detail.controlTowerMetrics : detail.controlTowerMetrics.filter((m) => m.status === filter);

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <SummaryCard label="Breach" count={detail.controlSummary.breach} barColor="bg-coral-500" />
        <SummaryCard label="Watch" count={detail.controlSummary.watch} barColor="bg-amber-500" />
        <SummaryCard label="In Control" count={detail.controlSummary.inControl} barColor="bg-teal-500" />
      </div>

      <div className="mb-4 flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((m) => (
          <MetricBlock key={m.id} metric={m} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-ink-200 px-6 py-8 text-center text-ink-400">
            No metrics match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
