import { fail, ok } from "@/lib/api-response";
import { MarketingOperationsService } from "@/services/marketing-operations.service";

const marketingOperationsService = new MarketingOperationsService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await marketingOperationsService.createStrategyTask(id, await request.json());
    return ok(task, { status: 201 });
  } catch (error) {
    return fail("创建策略任务失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
