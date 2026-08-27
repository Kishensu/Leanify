import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Lightweight process list for the searchable comboboxes (KPI dashboard, Control tower, LSS expert). */
export async function GET() {
  const processes = await prisma.process.findMany({
    select: {
      id: true,
      name: true,
      apqcHierarchyId: true,
      _count: { select: { activities: { where: { parentActivityId: null } } } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    processes: processes.map((p) => ({
      id: p.id,
      name: p.name,
      apqcHierarchyId: p.apqcHierarchyId,
      hasActivities: p._count.activities > 0,
    })),
  });
}
