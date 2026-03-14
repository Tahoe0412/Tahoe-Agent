import { fail, ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { StoryboardService } from "@/services/storyboard.service";

const storyboardService = new StoryboardService();

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storyboards = await storyboardService.listByProject(id);
    return ok(storyboards);
  } catch (error) {
    return fail("读取 storyboard 失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storyboard = await storyboardService.create(id, await parseJsonBody(request));
    return ok(storyboard, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建 storyboard 失败。");
  }
}
