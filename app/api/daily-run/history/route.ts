import { ok } from "@/lib/api-response";
import { toErrorResponse } from "@/lib/http-error";
import { DailyRunQueueService } from "@/services/daily-run/daily-run-queue.service";

const service = new DailyRunQueueService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365) : 30;

    const items = await service.getRunHistory(days);
    return ok(items);
  } catch (error) {
    return toErrorResponse(error, "获取生产历史失败。");
  }
}
