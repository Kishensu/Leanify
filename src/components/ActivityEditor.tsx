"use client";

import { useEffect, useState } from "react";

export type ElementType =
  | "user_task"
  | "system_task"
  | "decision_task"
  | "approval_gateway"
  | "parallel_gateway"
  | "timer_event"
  | "manual_task"
  | "start_event"
  | "end_event";

const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  user_task: "User task",
  system_task: "System task",
  decision_task: "Decision (DMN)",
  approval_gateway: "Approval gateway",
  parallel_gateway: "Parallel gateway",
  timer_event: "Timer / wait",
  manual_task: "Manual task",
  start_event: "Start",
  end_event: "End",
};

export type TaskDraft = { localId: string; name: string; apqcHierarchyId: string | null };
export type ActivityDraft = {
  localId: string;
  name: string;
  apqcHierarchyId: string | null;
  elementType: ElementType;
  approverRole?: string;
  systemRef?: string;
  decisionRef?: string;
  branchLabels?: string[]; // exactly 2, only meaningful when elementType === "approval_gateway"
  branchOfLocalId?: string | null; // references another row's localId
  branchLabel?: string;
  tasks: TaskDraft[];
};

type Candidate = { hierarchyId: string; name: string; description: string };

let localIdCounter = 0;
export function newLocalId() {
  localIdCounter += 1;
  return `local_${localIdCounter}_${Date.now()}`;
}

function TaxonomyAutocompleteInput({
  parentHierarchyId,
  level,
  value,
  onChange,
  placeholder,
}: {
  parentHierarchyId: string | null;
  level: "activity" | "task";
  value: { name: string; apqcHierarchyId: string | null };
  onChange: (next: { name: string; apqcHierarchyId: string | null }) => void;
  placeholder: string;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!parentHierarchyId) {
      setCandidates([]);
      return;
    }
    fetch(`/api/taxonomy/children?parent=${encodeURIComponent(parentHierarchyId)}&level=${level}`)
      .then((r) => r.json())
      .then((data) => setCandidates(data.children ?? []));
  }, [parentHierarchyId, level]);

  const filtered = candidates.filter((c) =>
    c.name.toLowerCase().includes(value.name.toLowerCase()),
  );

  return (
    <div className="relative flex-1">
      <input
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value, apqcHierarchyId: null })}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-md border border-ink-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
      />
      {value.apqcHierarchyId && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-teal-600">
          {value.apqcHierarchyId}
        </span>
      )}
      {open && candidates.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-ink-200 bg-white shadow-lg">
          {filtered.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-ink-400">No APQC match — using custom text</div>
          )}
          {filtered.map((c) => (
            <button
              key={c.hierarchyId}
              type="button"
              onMouseDown={() => onChange({ name: c.name, apqcHierarchyId: c.hierarchyId })}
              className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-xs hover:bg-teal-50"
            >
              <span className="truncate text-ink-700">{c.name}</span>
              <span className="shrink-0 font-mono text-[10px] text-ink-400">{c.hierarchyId}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TypeSpecificFields({
  activity,
  onPatch,
}: {
  activity: ActivityDraft;
  onPatch: (patch: Partial<ActivityDraft>) => void;
}) {
  switch (activity.elementType) {
    case "user_task":
      return (
        <input
          value={activity.approverRole ?? ""}
          onChange={(e) => onPatch({ approverRole: e.target.value })}
          placeholder="Approver role (e.g. Treasury manager)"
          className="w-full rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
        />
      );
    case "system_task":
      return (
        <input
          value={activity.systemRef ?? ""}
          onChange={(e) => onPatch({ systemRef: e.target.value })}
          placeholder="System (e.g. Salesforce, SAP)"
          className="w-full rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
        />
      );
    case "decision_task":
      return (
        <input
          value={activity.decisionRef ?? ""}
          onChange={(e) => onPatch({ decisionRef: e.target.value })}
          placeholder="DMN decision table name"
          className="w-full rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
        />
      );
    case "approval_gateway":
      return (
        <div className="flex gap-2">
          <input
            value={activity.branchLabels?.[0] ?? ""}
            onChange={(e) =>
              onPatch({ branchLabels: [e.target.value, activity.branchLabels?.[1] ?? ""] })
            }
            placeholder="Branch 1 label (e.g. Approved)"
            className="w-full rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
          />
          <input
            value={activity.branchLabels?.[1] ?? ""}
            onChange={(e) =>
              onPatch({ branchLabels: [activity.branchLabels?.[0] ?? "", e.target.value] })
            }
            placeholder="Branch 2 label (e.g. Rejected)"
            className="w-full rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
          />
        </div>
      );
    default:
      return null;
  }
}

function BranchSettings({
  activity,
  index,
  activities,
  onPatch,
}: {
  activity: ActivityDraft;
  index: number;
  activities: ActivityDraft[];
  onPatch: (patch: Partial<ActivityDraft>) => void;
}) {
  const priorGateways = activities
    .slice(0, index)
    .filter((a) => a.elementType === "approval_gateway");

  if (priorGateways.length === 0) return null;

  const selectedGateway = activities.find((a) => a.localId === activity.branchOfLocalId);

  return (
    <div className="flex items-center gap-2 text-xs text-ink-500">
      <span className="shrink-0">Branch:</span>
      <select
        value={activity.branchOfLocalId ?? ""}
        onChange={(e) =>
          onPatch({ branchOfLocalId: e.target.value || null, branchLabel: undefined })
        }
        className="rounded-md border border-ink-200 px-1.5 py-1 text-xs outline-none focus:border-teal-500"
      >
        <option value="">— sequential —</option>
        {priorGateways.map((g) => (
          <option key={g.localId} value={g.localId}>
            after &quot;{g.name || "gateway"}&quot;
          </option>
        ))}
      </select>
      {selectedGateway && (
        <select
          value={activity.branchLabel ?? ""}
          onChange={(e) => onPatch({ branchLabel: e.target.value })}
          className="rounded-md border border-ink-200 px-1.5 py-1 text-xs outline-none focus:border-teal-500"
        >
          <option value="">select label…</option>
          {(selectedGateway.branchLabels ?? []).map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default function ActivityEditor({
  processHierarchyId,
  activities,
  onChange,
}: {
  processHierarchyId: string | null;
  activities: ActivityDraft[];
  onChange: (activities: ActivityDraft[]) => void;
}) {
  function addActivity() {
    onChange([
      ...activities,
      { localId: newLocalId(), name: "", apqcHierarchyId: null, elementType: "user_task", tasks: [] },
    ]);
  }

  function updateActivity(index: number, patch: Partial<ActivityDraft>) {
    const next = [...activities];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeActivity(index: number) {
    onChange(activities.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= activities.length) return;
    const next = [...activities];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addTask(activityIndex: number) {
    const next = [...activities];
    next[activityIndex] = {
      ...next[activityIndex],
      tasks: [...next[activityIndex].tasks, { localId: newLocalId(), name: "", apqcHierarchyId: null }],
    };
    onChange(next);
  }

  function updateTask(activityIndex: number, taskIndex: number, patch: Partial<TaskDraft>) {
    const next = [...activities];
    const tasks = [...next[activityIndex].tasks];
    tasks[taskIndex] = { ...tasks[taskIndex], ...patch };
    next[activityIndex] = { ...next[activityIndex], tasks };
    onChange(next);
  }

  function removeTask(activityIndex: number, taskIndex: number) {
    const next = [...activities];
    next[activityIndex] = {
      ...next[activityIndex],
      tasks: next[activityIndex].tasks.filter((_, i) => i !== taskIndex),
    };
    onChange(next);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-700">Activities &amp; tasks</span>
        <button onClick={addActivity} className="text-xs font-medium text-teal-700 hover:underline">
          + Add activity
        </button>
      </div>

      {activities.length === 0 && (
        <div className="text-xs text-ink-400">
          None added — this process will map to a generic start → end when a process map is generated.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {activities.map((activity, i) => (
          <div key={activity.localId} className="rounded-lg border border-ink-100 p-3">
            <div className="flex items-center gap-2">
              <span className="w-5 shrink-0 font-mono text-xs text-ink-400">{i + 1}.</span>
              <TaxonomyAutocompleteInput
                parentHierarchyId={processHierarchyId}
                level="activity"
                value={{ name: activity.name, apqcHierarchyId: activity.apqcHierarchyId }}
                onChange={(v) => updateActivity(i, v)}
                placeholder="Activity name"
              />
              <select
                value={activity.elementType}
                onChange={(e) => updateActivity(i, { elementType: e.target.value as ElementType })}
                className="shrink-0 rounded-md border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
              >
                {(Object.keys(ELEMENT_TYPE_LABELS) as ElementType[])
                  .filter((t) => t !== "start_event" && t !== "end_event")
                  .map((t) => (
                    <option key={t} value={t}>
                      {ELEMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                <option value="start_event">{ELEMENT_TYPE_LABELS.start_event}</option>
                <option value="end_event">{ELEMENT_TYPE_LABELS.end_event}</option>
              </select>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => move(i, -1)} className="px-1 text-ink-400 hover:text-ink-700">
                  ↑
                </button>
                <button onClick={() => move(i, 1)} className="px-1 text-ink-400 hover:text-ink-700">
                  ↓
                </button>
                <button onClick={() => removeActivity(i)} className="px-1 text-coral-500 hover:text-coral-600">
                  ×
                </button>
              </div>
            </div>

            <div className="ml-7 mt-2 flex flex-col gap-2">
              <TypeSpecificFields activity={activity} onPatch={(patch) => updateActivity(i, patch)} />
              <BranchSettings
                activity={activity}
                index={i}
                activities={activities}
                onPatch={(patch) => updateActivity(i, patch)}
              />

              {activity.tasks.map((task, j) => (
                <div key={task.localId} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-xs text-ink-300">task</span>
                  <TaxonomyAutocompleteInput
                    parentHierarchyId={activity.apqcHierarchyId}
                    level="task"
                    value={{ name: task.name, apqcHierarchyId: task.apqcHierarchyId }}
                    onChange={(v) => updateTask(i, j, v)}
                    placeholder="Task name"
                  />
                  <button
                    onClick={() => removeTask(i, j)}
                    className="shrink-0 px-1 text-coral-500 hover:text-coral-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => addTask(i)}
                className="self-start text-xs font-medium text-ink-500 hover:text-teal-700 hover:underline"
              >
                + Add task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
