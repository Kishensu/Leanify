import { prisma } from "@/lib/db";
import type { ElementType } from "@prisma/client";
import type { FlowNode } from "@/lib/bpmn";

export type ActivityInput = {
  /** Client-side temp id, used only to express branchOfLocalId references within this submission. */
  localId?: string;
  name: string;
  apqcHierarchyId?: string | null;
  elementType: ElementType;
  approverRole?: string | null;
  systemRef?: string | null;
  decisionRef?: string | null;
  branchLabels?: string[];
  /** References another top-level activity's localId in this same submission — the gateway this branches off. */
  branchOfLocalId?: string | null;
  branchLabel?: string | null;
  tasks?: { name: string; apqcHierarchyId?: string | null }[];
};

/**
 * Replaces a process's full activity/task breakdown, in the given order. Idempotent.
 * Two passes: create every row first (branchOfId left unset, since gateways may
 * not exist yet at creation time), then wire up branchOfId once all real DB ids
 * are known.
 */
export async function replaceProcessActivities(processId: string, activities: ActivityInput[]) {
  await prisma.processActivity.deleteMany({ where: { processId } });

  const localIdToDbId = new Map<string, string>();
  const pendingBranches: { dbId: string; branchOfLocalId: string }[] = [];

  for (let i = 0; i < activities.length; i++) {
    const input = activities[i];
    if (!input.name?.trim()) continue;

    const activity = await prisma.processActivity.create({
      data: {
        processId,
        sequenceOrder: i,
        name: input.name.trim(),
        apqcHierarchyId: input.apqcHierarchyId || null,
        elementType: input.elementType,
        approverRole: input.approverRole || null,
        systemRef: input.systemRef || null,
        decisionRef: input.decisionRef || null,
        branchLabels: input.branchLabels ?? [],
        branchLabel: input.branchLabel || null,
      },
    });

    if (input.localId) localIdToDbId.set(input.localId, activity.id);
    if (input.branchOfLocalId) pendingBranches.push({ dbId: activity.id, branchOfLocalId: input.branchOfLocalId });

    const tasks = input.tasks ?? [];
    for (let j = 0; j < tasks.length; j++) {
      if (!tasks[j].name?.trim()) continue;
      await prisma.processActivity.create({
        data: {
          processId,
          parentActivityId: activity.id,
          sequenceOrder: j,
          name: tasks[j].name.trim(),
          apqcHierarchyId: tasks[j].apqcHierarchyId || null,
          elementType: "manual_task",
        },
      });
    }
  }

  for (const { dbId, branchOfLocalId } of pendingBranches) {
    const branchOfId = localIdToDbId.get(branchOfLocalId);
    if (!branchOfId) continue; // dangling reference — ignore rather than fail the whole save
    await prisma.processActivity.update({ where: { id: dbId }, data: { branchOfId } });
  }
}

/** Top-level (non-nested) activity rows for a process, shaped for the BPMN generator. */
export async function getFlowNodesForProcess(processId: string): Promise<FlowNode[]> {
  const rows = await prisma.processActivity.findMany({
    where: { processId, parentActivityId: null },
    orderBy: { sequenceOrder: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    elementType: r.elementType,
    sequenceOrder: r.sequenceOrder,
    approverRole: r.approverRole,
    systemRef: r.systemRef,
    decisionRef: r.decisionRef,
    branchLabels: r.branchLabels,
    branchOfId: r.branchOfId,
    branchLabel: r.branchLabel,
  }));
}
