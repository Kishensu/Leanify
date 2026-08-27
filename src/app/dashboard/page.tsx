"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProcessCombobox, { LiteProcess } from "@/components/ProcessCombobox";
import StatusPill from "@/components/StatusPill";
import ProcessPerformanceTab from "@/components/dashboard/ProcessPerformanceTab";
import ControlTowerTab from "@/components/dashboard/ControlTowerTab";
import type { ProcessDetail } from "@/lib/types";

type Tab = "performance" | "control-tower";

const TABS: { key: Tab; label: string }[] = [
  { key: "performance", label: "Process Performance" },
  { key: "control-tower", label: "Control Tower" },
];

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProcessId = searchParams.get("process");
  const tab: Tab = searchParams.get("tab") === "control-tower" ? "control-tower" : "performance";

  const [selected, setSelected] = useState<LiteProcess | null>(null);
  const [detail, setDetail] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialProcessId) return;
    fetch(`/api/processes/${initialProcessId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.process) {
          setDetail(data.process);
          setSelected({ id: data.process.id, name: data.process.name, apqcHierarchyId: data.process.apqcHierarchyId });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProcessId]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`/api/processes/${selected.id}`)
      .then((r) => r.json())
      .then((data) => setDetail(data.process ?? null))
      .finally(() => setLoading(false));
  }, [selected]);

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    if (selected) params.set("process", selected.id);
    router.replace(`/dashboard?${params.toString()}`);
  }

  function onSelectProcess(p: LiteProcess) {
    setSelected(p);
    const params = new URLSearchParams(searchParams.toString());
    params.set("process", p.id);
    params.set("tab", tab);
    router.replace(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="px-8 py-6">
      <h1 className="mb-1 text-lg font-semibold text-ink-900">Dashboard</h1>
      <p className="mb-4 text-sm text-ink-600">Pick a process to see its performance and control tower.</p>

      <ProcessCombobox value={selected} onChange={onSelectProcess} />

      {!selected && (
        <div className="mt-10 rounded-lg border border-dashed border-ink-200 px-6 py-12 text-center text-ink-400">
          Search for a process above to view its dashboard.
        </div>
      )}

      {selected && loading && <div className="mt-8 text-sm text-ink-400">Loading…</div>}

      {selected && detail && !loading && (
        <div className="mt-6">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-base font-semibold text-ink-900">{detail.name}</h2>
            <StatusPill status={detail.status} />
            <span className="font-mono text-xs text-ink-400">
              {detail.apqcHierarchyId} · {detail.ownerTeam}
            </span>
          </div>

          <div className="mb-5 flex gap-1 border-b border-ink-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "border-teal-500 text-teal-700"
                    : "border-transparent text-ink-500 hover:text-ink-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "performance" ? <ProcessPerformanceTab detail={detail} /> : <ControlTowerTab detail={detail} />}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="px-8 py-6 text-sm text-ink-400">Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
