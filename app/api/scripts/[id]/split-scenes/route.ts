import { NextResponse } from "next/server";
import { SceneSplitService, IdempotencyError } from "@/services/scene-split.service";

const sceneSplitService = new SceneSplitService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scriptId } = await params;

  let body: { force?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — force defaults to false
  }

  try {
    const result = await sceneSplitService.splitAndSave({
      scriptId,
      force: body.force === true,
    });

    return NextResponse.json({
      success: true,
      data: {
        scriptId,
        sceneCount: result.sceneCount,
      },
    });
  } catch (error) {
    if (error instanceof IdempotencyError) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
          ...(error.existingCount !== undefined
            ? { scene_count: error.existingCount }
            : {}),
        },
        { status: 409 },
      );
    }

    console.error("[split-scenes] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "split_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
