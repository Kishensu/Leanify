import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBpmnXml, hashActivities } from "@/lib/bpmn";
import { getFlowNodesForProcess } from "@/lib/activities";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { processId, force } = await req.json();

  if (!processId) {
    return NextResponse.json({ error: "processId is required" }, { status: 400 });
  }

  const process = await prisma.process.findUnique({ where: { id: processId } });
  if (!process) {
    return NextResponse.json({ error: "Process not found" }, { status: 404 });
  }

  const flowNodes = await getFlowNodesForProcess(processId);

  if (flowNodes.length === 0) {
    return NextResponse.json(
      {
        error: "no_activities",
        message: `${process.name} has no activity/task breakdown yet. Add one in the Add Process → Activities & tasks step before generating a map.`,
        processId,
      },
      { status: 422 },
    );
  }

  const currentHash = hashActivities(flowNodes);

  if (!force) {
    const cached = await prisma.processDiagram.findFirst({
      where: { processId, generatedFrom: currentHash },
      orderBy: { generatedAt: "desc" },
    });
    if (cached) {
      return NextResponse.json({ bpmnXml: cached.bpmnXml, cached: true, generatedAt: cached.generatedAt });
    }
  }

  // The activity set has changed (or there's no diagram yet). Before regenerating,
  // check whether the existing diagram was hand-edited — a regenerate must not
  // silently clobber a manual edit without confirmation.
  const existing = await prisma.processDiagram.findFirst({
    where: { processId },
    orderBy: { generatedAt: "desc" },
  });
  if (existing?.editedByUser && !force) {
    return NextResponse.json(
      {
        error: "manual_edit_conflict",
        message: `${process.name}'s process map was hand-edited, and its activities have changed since. Regenerating would overwrite your edit — pass force to confirm.`,
        bpmnXml: existing.bpmnXml,
      },
      { status: 409 },
    );
  }

  let bpmnXml: string;
  try {
    bpmnXml = await generateBpmnXml(process.name, flowNodes);
  } catch (err) {
    console.error(`BPMN generation failed for process ${processId}:`, err);
    return NextResponse.json(
      {
        error: "generation_failed",
        message: `Couldn't generate a process map for ${process.name} — the diagram builder hit a validation error rather than producing a broken one.`,
      },
      { status: 500 },
    );
  }

  await prisma.processDiagram.deleteMany({ where: { processId } });
  const diagram = await prisma.processDiagram.create({
    data: { processId, bpmnXml, generatedFrom: currentHash },
  });

  return NextResponse.json({ bpmnXml: diagram.bpmnXml, cached: false, generatedAt: diagram.generatedAt });
}

/** Persists a hand-edited diagram (from the Modeler) back to process_diagrams. */
export async function PUT(req: NextRequest) {
  const { processId, bpmnXml } = await req.json();

  if (!processId || !bpmnXml) {
    return NextResponse.json({ error: "processId and bpmnXml are required" }, { status: 400 });
  }

  const process = await prisma.process.findUnique({ where: { id: processId } });
  if (!process) {
    return NextResponse.json({ error: "Process not found" }, { status: 404 });
  }

  const flowNodes = await getFlowNodesForProcess(processId);

  await prisma.processDiagram.deleteMany({ where: { processId } });
  const diagram = await prisma.processDiagram.create({
    data: {
      processId,
      bpmnXml,
      // Keep the hash matched to the process's *current* activities, so this
      // edit is served as-is next time rather than treated as stale immediately.
      generatedFrom: hashActivities(flowNodes),
      editedByUser: true,
    },
  });

  return NextResponse.json({ bpmnXml: diagram.bpmnXml, generatedAt: diagram.generatedAt });
}
