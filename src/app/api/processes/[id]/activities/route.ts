import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { replaceProcessActivities, type ActivityInput } from "@/lib/activities";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const process = await prisma.process.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, apqcHierarchyId: true },
  });
  if (!process) {
    return NextResponse.json({ error: "Process not found" }, { status: 404 });
  }

  const rows = await prisma.processActivity.findMany({
    where: { processId: params.id },
    orderBy: [{ sequenceOrder: "asc" }],
  });

  const topLevel = rows
    .filter((r) => r.parentActivityId === null)
    .map((a) => ({
      id: a.id,
      name: a.name,
      apqcHierarchyId: a.apqcHierarchyId,
      elementType: a.elementType,
      approverRole: a.approverRole,
      systemRef: a.systemRef,
      decisionRef: a.decisionRef,
      branchLabels: a.branchLabels,
      branchOfId: a.branchOfId,
      branchLabel: a.branchLabel,
      tasks: rows
        .filter((t) => t.parentActivityId === a.id)
        .map((t) => ({ id: t.id, name: t.name, apqcHierarchyId: t.apqcHierarchyId })),
    }));

  return NextResponse.json({ process, activities: topLevel });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const process = await prisma.process.findUnique({ where: { id: params.id } });
  if (!process) {
    return NextResponse.json({ error: "Process not found" }, { status: 404 });
  }

  const { activities } = (await req.json()) as { activities: ActivityInput[] };
  await replaceProcessActivities(params.id, activities ?? []);

  return NextResponse.json({ success: true });
}
