import { z } from "zod";
import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { DailyRunQueueService } from "@/services/daily-run/daily-run-queue.service";

const createItemSchema = z.object({
  accountDirection: z.string().min(1, "accountDirection 不能为空"),
  topic: z.string().min(1, "topic 不能为空"),
  topicSource: z.unknown().optional(),
  metadata: z.unknown().optional(),
});

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
    const items = await service.getRunItems(runDate);
    return ok(items);
  } catch (error) {
    return toErrorResponse(error, "获取每日生产队列失败。");
  }
}

export async function POST(request: Request) {
  try {
    const body = createItemSchema.parse(await parseJsonBody(request));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const item = await service.createItem({
      runDate: today,
      accountDirection: body.accountDirection,
      topic: body.topic,
      topicSource: body.topicSource,
      metadata: body.metadata,
    });
    return ok(item, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建每日生产队列项失败。");
  }
}
