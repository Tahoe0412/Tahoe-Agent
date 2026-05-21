import { ok } from "@/lib/api-response";
import { toErrorResponse } from "@/lib/http-error";
import { DailyRunQueueService } from "@/services/daily-run/daily-run-queue.service";

const service = new DailyRunQueueService();

function parseRunDate(dateStr: string | null): Date {
  if (!dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  const parsed = new Date(dateStr + "T00:00:00.000Z");
  if (isNaN(parsed.getTime())) {
    throw new Error("date 参数格式无效，请使用 YYYY-MM-DD 格式。");
  }
  return parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runDate = parseRunDate(searchParams.get("date"));
    const stats = await service.getDailyStats(runDate);
    return ok(stats);
  } catch (error) {
    return toErrorResponse(error, "获取每日生产统计失败。");
  }
}
