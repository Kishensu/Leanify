import { NextResponse } from "next/server";
import { getTaxonomyTree } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function GET() {
  const tree = await getTaxonomyTree();
  return NextResponse.json({ tree });
}
