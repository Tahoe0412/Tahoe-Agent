import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { MarketingOperationsService } from "@/services/marketing-operations.service";

const marketingOperationsService = new MarketingOperationsService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const review = await marketingOperationsService.createOptimizationReview(id, await parseJsonBody(request));
    return ok(review, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建复盘记录失败。");
  }
}
