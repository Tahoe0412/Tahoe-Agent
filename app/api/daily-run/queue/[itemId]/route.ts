import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { DailyRunQueueService } from "@/services/daily-run/daily-run-queue.service";

const patchSchema = z.object({
  action: z.enum(["retry", "mark_published", "mark_best_pick", "update_status"]),
  status: z
    .enum([
      "TOPIC_SELECTED",
      "DRAFTING",
      "DRAFT_READY",
      "PACKAGING",
      "PACKAGE_READY",
      "REVIEW_PASS",
      "PUBLISHED",
      "FAILED",
    ])
    .optional(),
  projectId: z.string().min(1).optional(),
  errorMessage: z.string().optional(),
  qualityScore: z.number().optional(),
  metadata: z.unknown().optional(),
});

const service = new DailyRunQueueService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const item = await service.getItem(itemId);
    if (!item) {
      return fail("队列项不存在。", 404, undefined, { code: "NOT_FOUND" });
    }
    return ok(item);
  } catch (error) {
    return toErrorResponse(error, "获取队列项详情失败。");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const body = patchSchema.parse(await parseJsonBody(request));

    let result;
    switch (body.action) {
      case "retry":
        result = await service.retryItem(itemId);
        break;
      case "mark_published":
        result = await service.markPublished(itemId);
        break;
      case "mark_best_pick":
        result = await service.markBestPick(itemId);
        break;
      case "update_status": {
        if (!body.status) {
          return fail("update_status 操作需要提供 status 字段。", 400, undefined, {
            code: "VALIDATION_ERROR",
          });
        }
        result = await service.updateStatus(itemId, body.status, {
          projectId: body.projectId,
          errorMessage: body.errorMessage,
          qualityScore: body.qualityScore,
          metadata: body.metadata,
        });
        break;
      }
    }

    return ok(result);
  } catch (error) {
    return toErrorResponse(error, "更新队列项失败。");
  }
}
