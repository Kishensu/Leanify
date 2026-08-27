"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ActivityEditor, { ActivityDraft, newLocalId } from "@/components/ActivityEditor";

export default function EditProcessActivitiesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [processName, setProcessName] = useState<string | null>(null);
  const [processHierarchyId, setProcessHierarchyId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    type LoadedActivity = {
      id: string;
      name: string;
      apqcHierarchyId: string | null;
      elementType: ActivityDraft["elementType"];
      approverRole: string | null;
      systemRef: string | null;
      decisionRef: string | null;
      branchLabels: string[];
      branchOfId: string | null;
      branchLabel: string | null;
      tasks: { id: string; name: string; apqcHierarchyId: string | null }[];
    };

    fetch(`/api/processes/${params.id}/activities`)
      .then((r) => r.json())
      .then((data) => {
        setProcessName(data.process?.name ?? null);
        setProcessHierarchyId(data.process?.apqcHierarchyId ?? null);
        setActivities(
          (data.activities ?? []).map(
            (a: LoadedActivity): ActivityDraft => ({
              // Existing rows' real db ids double as localIds — branchOfId
              // already points at another row's id, so it Just Works as a
              // branchOfLocalId reference without remapping.
              localId: a.id ?? newLocalId(),
              name: a.name,
              apqcHierarchyId: a.apqcHierarchyId,
              elementType: a.elementType,
              approverRole: a.approverRole ?? undefined,
              systemRef: a.systemRef ?? undefined,
              decisionRef: a.decisionRef ?? undefined,
              branchLabels: a.branchLabels ?? [],
              branchOfLocalId: a.branchOfId,
              branchLabel: a.branchLabel ?? undefined,
              tasks: a.tasks.map((t) => ({ localId: t.id ?? newLocalId(), name: t.name, apqcHierarchyId: t.apqcHierarchyId })),
            }),
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/processes/${params.id}/activities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activities: activities
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
              tasks: a.tasks.filter((t) => t.name.trim()).map((t) => ({ name: t.name, apqcHierarchyId: t.apqcHierarchyId })),
            })),
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="px-8 py-6 text-sm text-ink-400">Loading…</div>;
  }

  if (!processName) {
    return <div className="px-8 py-6 text-sm text-coral-500">Process not found.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <button onClick={() => router.back()} className="mb-4 text-sm text-ink-500 hover:underline">
        ← Back
      </button>
      <h1 className="mb-1 text-lg font-semibold text-ink-900">Activities &amp; tasks</h1>
      <p className="mb-6 text-sm text-ink-600">
        {processName} — build the breakdown used to generate this process's BPMN map.
      </p>

      <ActivityEditor processHierarchyId={processHierarchyId} activities={activities} onChange={setActivities} />

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-teal-600">Saved.</span>}
      </div>
    </div>
  );
}
