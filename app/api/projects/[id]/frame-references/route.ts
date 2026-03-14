import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { StoryboardService } from "@/services/storyboard.service";

const storyboardService = new StoryboardService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reference = await storyboardService.addFrameReference(id, await parseJsonBody(request));
    return ok(reference, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建 frame reference 失败。");
  }
}
