import { fail, ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { RenderJobService } from "@/services/render-job.service";

const renderJobService = new RenderJobService();

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const renderJobs = await renderJobService.listByProject(id);
    return ok(renderJobs);
  } catch (error) {
    return fail("读取 render jobs 失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const renderJob = await renderJobService.create(id, await parseJsonBody(request));
    return ok(renderJob, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建 render job 失败。");
  }
}
