import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeProcessStatus, computeMetricStatus, type ReactionStep } from "@/lib/status";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const process = await prisma.process.findUnique({
    where: { id: params.id },
    include: {
      kpiMetrics: { include: { readings: { orderBy: { recordedAt: "asc" } } } },
      controlTowerMetrics: {
        include: {
          readings: { orderBy: { sequenceIndex: "asc" } },
          reactionPlan: true,
          processActivity: { select: { name: true, apqcHierarchyId: true } },
        },
      },
      taxonomy: { select: { hierarchyId: true, name: true, description: true } },
    },
  });

  if (!process) {
    return NextResponse.json({ error: "Process not found" }, { status: 404 });
  }

  const kpiMetrics = process.kpiMetrics.map((m) => ({
    id: m.id,
    metricName: m.metricName,
    value: m.value,
    unit: m.unit,
    targetValue: m.targetValue,
    readings: m.readings.map((r) => ({ periodLabel: r.periodLabel, value: r.value, recordedAt: r.recordedAt })),
  }));

  const controlTowerMetrics = process.controlTowerMetrics.map((m) => {
    const status = computeMetricStatus(m);
    const steps = (m.reactionPlan?.steps as unknown as ReactionStep[] | undefined) ?? [];
    return {
      id: m.id,
      metricName: m.metricName,
      value: m.value,
      ucl: m.ucl,
      lcl: m.lcl,
      warningUcl: m.warningUcl,
      warningLcl: m.warningLcl,
      status,
      activityCode: m.processActivity?.apqcHierarchyId ?? null,
      activityName: m.processActivity?.name ?? null,
      measurementMethod: m.measurementMethod,
      responsibleRole: m.responsibleRole,
      reviewFrequency: m.reviewFrequency,
      triggerDescription: m.triggerDescription,
      readings: m.readings.map((r) => ({ sequenceIndex: r.sequenceIndex, value: r.value, recordedAt: r.recordedAt })),
      reactionPlan: m.reactionPlan
        ? {
            id: m.reactionPlan.id,
            notifyRole: m.reactionPlan.notifyRole,
            escalationTrigger: m.reactionPlan.escalationTrigger,
            steps,
            automatedCount: steps.filter((s) => s.automated).length,
            totalSteps: steps.length,
          }
        : null,
    };
  });

  const controlSummary = {
    breach: controlTowerMetrics.filter((m) => m.status === "breach").length,
    watch: controlTowerMetrics.filter((m) => m.status === "watch").length,
    inControl: controlTowerMetrics.filter((m) => m.status === "in_control").length,
  };

  return NextResponse.json({
    process: {
      id: process.id,
      name: process.name,
      description: process.description,
      ownerTeam: process.ownerTeam,
      apqcHierarchyId: process.apqcHierarchyId,
      taxonomy: process.taxonomy,
      status: computeProcessStatus(process.controlTowerMetrics),
      kpiMetrics,
      controlTowerMetrics,
      controlSummary,
    },
  });
}
