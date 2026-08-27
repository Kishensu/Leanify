import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { compareHierarchyIds } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/** Real APQC activity/task nodes under a given parent hierarchy ID, for the Activities & tasks autocomplete. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parent = searchParams.get("parent");
  const level = searchParams.get("level"); // "activity" | "task"

  if (!parent || (level !== "activity" && level !== "task")) {
    return NextResponse.json({ error: "parent and level=activity|task are required" }, { status: 400 });
  }

  const children = await prisma.taxonomy.findMany({
    where: { parentHierarchyId: parent, level },
  });
  children.sort((a, b) => compareHierarchyIds(a.hierarchyId, b.hierarchyId));

  return NextResponse.json({
    children: children.map((c) => ({ hierarchyId: c.hierarchyId, name: c.name, description: c.description })),
  });
}
