import { NextRequest, NextResponse } from "next/server";
import { classifyDescription } from "@/lib/classify";

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();

  if (!name || !description) {
    return NextResponse.json({ error: "name and description are required" }, { status: 400 });
  }

  const matches = await classifyDescription(name, description);
  return NextResponse.json({ matches });
}
