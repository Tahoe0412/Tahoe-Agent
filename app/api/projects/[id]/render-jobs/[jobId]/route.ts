import { fail, ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { RenderJobService } from "@/services/render-job.service";

const renderJobService = new RenderJobService();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; jobId: string }> }) {
  try {
    const { id, jobId } = await params;
    const renderJob = await renderJobService.updateFeedback(id, jobId, await parseJsonBody(request));
    return ok(renderJob);
  } catch (error) {
    if (error instanceof Error && error.message.includes("不存在")) {
      return fail(error.message, 404);
    }
    return toErrorResponse(error, "更新 render job 反馈失败。");
  }
}
