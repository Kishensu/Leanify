"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TaxonomyTree from "@/components/TaxonomyTree";
import StatusPill from "@/components/StatusPill";
import ActivityEditor, { ActivityDraft } from "@/components/ActivityEditor";
import type { TaxonomyTreeNode } from "@/lib/taxonomy";

type Match = {
  groupHierarchyId: string;
  groupName: string;
  categoryHierarchyId: string;
  categoryName: string;
  confidence: number;
};

type KpiDraft = { metricName: string; value: string; unit: string; targetValue: string };
type ControlDraft = { metricName: string; value: string; ucl: string; lcl: string };

const STEPS = ["Describe", "Classify", "Configure", "Activities & tasks", "Review"] as const;

export default function AddProcessPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerTeam, setOwnerTeam] = useState("");

  // Step 2
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Match | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [tree, setTree] = useState<TaxonomyTreeNode[]>([]);

  // Step 3
  const [kpiDrafts, setKpiDrafts] = useState<KpiDraft[]>([]);
  const [controlDrafts, setControlDrafts] = useState<ControlDraft[]>([]);

  // Step 4
  const [activityDrafts, setActivityDrafts] = useState<ActivityDraft[]>([]);

  // Step 5
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runClassification() {
    setClassifying(true);
    setError(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      setMatches(data.matches ?? []);
      setSelectedGroup(data.matches?.[0] ?? null);
    } catch {
      setError("Classification failed. You can still browse the taxonomy manually.");
    } finally {
      setClassifying(false);
    }
  }

  async function loadTreeForBrowsing() {
    if (tree.length === 0) {
      const res = await fetch("/api/taxonomy/tree");
      const data = await res.json();
      setTree(data.tree ?? []);
    }
    setBrowsing(true);
  }

  function goToStep1() {
    setStep(0);
  }

  function goToClassify() {
    setStep(1);
    if (!matches) runClassification();
  }

  async function submit() {
    if (!selectedGroup) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          ownerTeam,
          apqcHierarchyId: selectedGroup.groupHierarchyId,
          kpiMetrics: kpiDrafts
            .filter((k) => k.metricName && k.value && k.unit)
            .map((k) => ({
              metricName: k.metricName,
              value: Number(k.value),
              unit: k.unit,
              targetValue: Number(k.targetValue || k.value),
            })),
          controlTowerMetrics: controlDrafts
            .filter((c) => c.metricName && c.value && c.ucl)
            .map((c) => ({
              metricName: c.metricName,
              value: Number(c.value),
              ucl: Number(c.ucl),
              lcl: c.lcl ? Number(c.lcl) : undefined,
            })),
          activities: activityDrafts
            .filter((a) => a.name.trim())
            .map((a) => ({
              localId: a.localId,
              name: a.name,
              apqcHierarchyId: a.apqcHierarchyId,
              elementType: a.elementType,
              approverRole: a.approverRole,
              systemRef: a.systemRef,
              decisionRef: a.decisionRef,
              branchLabels: a.branchLabels,
              branchOfLocalId: a.branchOfLocalId,
              branchLabel: a.branchLabel,
              tasks: a.tasks
                .filter((t) => t.name.trim())
                .map((t) => ({ name: t.name, apqcHierarchyId: t.apqcHierarchyId })),
            })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create process");
      }
      const data = await res.json();
      router.push(`/dashboard?process=${data.process.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create process");
    } finally {
      setSubmitting(false);
    }
  }

  const status = controlDrafts.some((c) => c.metricName && c.value && c.ucl)
    ? "in_control"
    : "not_yet_monitored";

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <h1 className="mb-1 text-lg font-semibold text-ink-900">Add process</h1>
      <p className="mb-6 text-sm text-ink-600">
        File a new, org-specific process under the APQC framework.
      </p>

      <ol className="mb-8 flex items-center gap-2 text-xs font-medium">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                i === step
                  ? "bg-teal-500 text-white"
                  : i < step
                    ? "bg-teal-100 text-teal-700"
                    : "bg-ink-100 text-ink-400"
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? "text-ink-900" : "text-ink-400"}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-1 text-ink-300">—</span>}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mb-4 rounded-md bg-coral-50 px-3 py-2 text-sm text-coral-600">{error}</div>
      )}

      {/* Step 1 — Describe */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Process name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vendor onboarding exception review"
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Plain-language description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what this process does, in plain language — no taxonomy knowledge needed."
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Owner</label>
            <input
              value={ownerTeam}
              onChange={(e) => setOwnerTeam(e.target.value)}
              placeholder="e.g. Procurement Ops"
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={goToClassify}
              disabled={!name || !description || !ownerTeam}
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            >
              Next: Classify
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Classify */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          {classifying && <div className="text-sm text-ink-400">Classifying against the APQC taxonomy…</div>}

          {!classifying && matches && !browsing && (
            <div className="flex flex-col gap-2">
              {matches.map((m, i) => (
                <button
                  key={m.groupHierarchyId}
                  onClick={() => setSelectedGroup(m)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    selectedGroup?.groupHierarchyId === m.groupHierarchyId
                      ? "border-teal-500 bg-teal-50"
                      : "border-ink-200 bg-white hover:border-ink-300"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      {i === 0 ? "Suggested match" : "Alternate"}
                    </span>
                    <span className="font-mono text-xs text-ink-500">
                      {Math.round(m.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="font-mono text-xs text-ink-400">
                    {m.categoryHierarchyId} {m.categoryName} → {m.groupHierarchyId}
                  </div>
                  <div className="font-medium text-ink-900">{m.groupName}</div>
                </button>
              ))}

              <button
                onClick={loadTreeForBrowsing}
                className="mt-1 self-start text-sm font-medium text-teal-700 hover:underline"
              >
                Or browse/search the taxonomy manually
              </button>
            </div>
          )}

          {browsing && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-700">Browse the APQC taxonomy</span>
                <button onClick={() => setBrowsing(false)} className="text-xs text-ink-500 hover:underline">
                  Back to suggestions
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-ink-100 p-2">
                <TaxonomyTree
                  nodes={tree}
                  selectedHierarchyId={selectedGroup?.groupHierarchyId}
                  onSelectGroup={(node) => {
                    const parentCategory = tree.find((c) =>
                      c.children.some((g) => g.hierarchyId === node.hierarchyId),
                    );
                    setSelectedGroup({
                      groupHierarchyId: node.hierarchyId,
                      groupName: node.name,
                      categoryHierarchyId: parentCategory?.hierarchyId ?? "",
                      categoryName: parentCategory?.name ?? "",
                      confidence: 1,
                    });
                  }}
                />
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-between">
            <button onClick={goToStep1} className="text-sm font-medium text-ink-600 hover:underline">
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedGroup}
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            >
              Next: Configure
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Configure (optional) */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-ink-600">
            Optionally seed initial metrics now, or skip — the process will show as “not yet monitored.”
          </p>

          <MetricEditor
            title="KPI metrics"
            rows={kpiDrafts}
            onAdd={() => setKpiDrafts((d) => [...d, { metricName: "", value: "", unit: "", targetValue: "" }])}
            onChange={setKpiDrafts}
            fields={["metricName", "value", "unit", "targetValue"]}
          />

          <ControlMetricEditor rows={controlDrafts} onChange={setControlDrafts} />

          <div className="mt-2 flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-ink-600 hover:underline">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
            >
              Next: Activities &amp; tasks
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Activities & tasks (optional) */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-ink-600">
            Optionally break this process into activities (and nested tasks) — this is what powers the
            &quot;Generate process map&quot; tool in the LSS expert chat. Skip it and the map falls back to a
            generic start → end.
          </p>

          <ActivityEditor
            processHierarchyId={selectedGroup?.groupHierarchyId ?? null}
            activities={activityDrafts}
            onChange={setActivityDrafts}
          />

          <div className="mt-2 flex justify-between">
            <button onClick={() => setStep(2)} className="text-sm font-medium text-ink-600 hover:underline">
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — Review */}
      {step === 4 && selectedGroup && (
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-ink-100 bg-white p-4 text-sm">
            <div className="mb-2 font-semibold text-ink-900">{name}</div>
            <div className="mb-1 text-ink-600">{description}</div>
            <div className="mb-1 text-ink-500">Owner: {ownerTeam}</div>
            <div className="font-mono text-xs text-ink-400">
              Filed under {selectedGroup.groupHierarchyId} — {selectedGroup.groupName} (
              {selectedGroup.categoryName})
            </div>
            <div className="mt-2 text-ink-500">
              {kpiDrafts.filter((k) => k.metricName).length} KPI metric(s),{" "}
              {controlDrafts.filter((c) => c.metricName).length} control tower metric(s),{" "}
              {activityDrafts.filter((a) => a.name.trim()).length} activit{activityDrafts.filter((a) => a.name.trim()).length === 1 ? "y" : "ies"}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Library preview
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-2">Process</th>
                    <th className="px-4 py-2">Hierarchy ID</th>
                    <th className="px-4 py-2">Owner</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-ink-900">{name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-500">
                      {selectedGroup.groupHierarchyId}
                    </td>
                    <td className="px-4 py-2.5 text-ink-600">{ownerTeam}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={status} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="text-sm font-medium text-ink-600 hover:underline">
              Back
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Confirm and create"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricEditor({
  title,
  rows,
  onAdd,
  onChange,
  fields,
}: {
  title: string;
  rows: KpiDraft[];
  onAdd: () => void;
  onChange: (rows: KpiDraft[]) => void;
  fields: (keyof KpiDraft)[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-700">{title}</span>
        <button onClick={onAdd} className="text-xs font-medium text-teal-700 hover:underline">
          + Add metric
        </button>
      </div>
      {rows.length === 0 && <div className="text-xs text-ink-400">None added.</div>}
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            {fields.map((field) => (
              <input
                key={field}
                value={row[field]}
                placeholder={field}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...next[i], [field]: e.target.value };
                  onChange(next);
                }}
                className="rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ControlMetricEditor({
  rows,
  onChange,
}: {
  rows: ControlDraft[];
  onChange: (rows: ControlDraft[]) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-700">Control tower metrics</span>
        <button
          onClick={() => onChange([...rows, { metricName: "", value: "", ucl: "", lcl: "" }])}
          className="text-xs font-medium text-teal-700 hover:underline"
        >
          + Add metric
        </button>
      </div>
      {rows.length === 0 && <div className="text-xs text-ink-400">None added.</div>}
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            <input
              value={row.metricName}
              placeholder="metric name"
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], metricName: e.target.value };
                onChange(next);
              }}
              className="rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
            <input
              value={row.value}
              placeholder="value"
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], value: e.target.value };
                onChange(next);
              }}
              className="rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
            <input
              value={row.ucl}
              placeholder="UCL"
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], ucl: e.target.value };
                onChange(next);
              }}
              className="rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
            <input
              value={row.lcl}
              placeholder="LCL (optional)"
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], lcl: e.target.value };
                onChange(next);
              }}
              className="rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
