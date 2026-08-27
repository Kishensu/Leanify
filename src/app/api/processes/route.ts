import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeProcessStatus } from "@/lib/status";
import { compareHierarchyIds } from "@/lib/hierarchy";
import { replaceProcessActivities, type ActivityInput } from "@/lib/activities";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const limit = Math.min(200, Number(searchParams.get("limit") ?? 50));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  const where = {
    AND: [
      query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { apqcHierarchyId: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {},
      category ? { apqcHierarchyId: { startsWith: `${category.split(".")[0]}.` } } : {},
    ],
  };

  // Fetched dataset is small (hundreds of rows), so sort numerically by hierarchy ID
  // in JS rather than lexicographically in SQL — "10.1.1" must sort after "2.1.1",
  // which a plain string ORDER BY gets wrong.
  const matching = await prisma.process.findMany({
    where,
    include: {
      kpiMetrics: true,
      controlTowerMetrics: { select: { value: true, ucl: true, lcl: true } },
    },
  });
  matching.sort((a, b) => compareHierarchyIds(a.apqcHierarchyId, b.apqcHierarchyId));

  const total = matching.length;
  const rows = matching.slice(offset, offset + limit);

  const items = rows.map((p) => {
    const cycleTime = p.kpiMetrics.find((k) => k.metricName === "Cycle time");
    const sla = p.kpiMetrics.find((k) => k.metricName === "SLA compliance");
    const fpy = p.kpiMetrics.find((k) => k.metricName === "First-pass yield");
    return {
      id: p.id,
      name: p.name,
      apqcHierarchyId: p.apqcHierarchyId,
      ownerTeam: p.ownerTeam,
      status: computeProcessStatus(p.controlTowerMetrics),
      cycleTime: cycleTime ? { value: cycleTime.value, unit: cycleTime.unit } : null,
      sla: sla ? { value: sla.value, unit: sla.unit } : null,
      fpy: fpy ? { value: fpy.value, unit: fpy.unit } : null,
    };
  });

  return NextResponse.json({ items, total, limit, offset });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, ownerTeam, apqcHierarchyId, kpiMetrics, controlTowerMetrics, activities } = body as {
    name: string;
    description: string;
    ownerTeam: string;
    apqcHierarchyId: string;
    kpiMetrics?: { metricName: string; value: number; unit: string; targetValue: number }[];
    controlTowerMetrics?: { metricName: string; value: number; ucl: number; lcl?: number }[];
    activities?: ActivityInput[];
  };

  if (!name || !description || !ownerTeam || !apqcHierarchyId) {
    return NextResponse.json(
      { error: "name, description, ownerTeam, and apqcHierarchyId are required" },
      { status: 400 },
    );
  }

  const target = await prisma.taxonomy.findUnique({ where: { hierarchyId: apqcHierarchyId } });
  if (!target) {
    return NextResponse.json({ error: "Unknown apqcHierarchyId" }, { status: 400 });
  }

  const process = await prisma.process.create({
    data: {
      name,
      description,
      ownerTeam,
      apqcHierarchyId,
      kpiMetrics: kpiMetrics?.length
        ? {
            create: kpiMetrics.map((k: { metricName: string; value: number; unit: string; targetValue: number }) => ({
              metricName: k.metricName,
              value: k.value,
              unit: k.unit,
              targetValue: k.targetValue,
            })),
          }
        : undefined,
      controlTowerMetrics: controlTowerMetrics?.length
        ? {
            create: controlTowerMetrics.map((c: { metricName: string; value: number; ucl: number; lcl?: number }) => ({
              metricName: c.metricName,
              value: c.value,
              ucl: c.ucl,
              lcl: c.lcl ?? null,
            })),
          }
        : undefined,
    },
    include: { kpiMetrics: true, controlTowerMetrics: true },
  });

  if (activities?.length) {
    await replaceProcessActivities(process.id, activities);
  }

  return NextResponse.json({ process }, { status: 201 });
}
