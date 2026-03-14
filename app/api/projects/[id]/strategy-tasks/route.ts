import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { MarketingOperationsService } from "@/services/marketing-operations.service";

const marketingOperationsService = new MarketingOperationsService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await marketingOperationsService.createStrategyTask(id, await parseJsonBody(request));
    return ok(task, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建策略任务失败。");
  }
}
