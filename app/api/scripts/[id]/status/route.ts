import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scriptId } = await params;

  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    select: {
      id: true,
      structured_output: true,
      _count: { select: { script_scenes: true } },
    },
  });

  if (!script) {
    return NextResponse.json(
      { error: "script_not_found" },
      { status: 404 },
    );
  }

  const structured = (script.structured_output as Record<string, unknown>) ?? {};

  return NextResponse.json({
    scriptId: script.id,
    scene_split_status: structured.scene_split_status ?? "unknown",
    scene_count: script._count.script_scenes,
    scene_split_error: structured.scene_split_error ?? null,
    scene_split_at: structured.scene_split_at ?? null,
  });
}
