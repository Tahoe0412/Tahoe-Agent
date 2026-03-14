import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { MarketingOperationsService } from "@/services/marketing-operations.service";

const marketingOperationsService = new MarketingOperationsService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adaptation = await marketingOperationsService.createPlatformAdaptation(id, await parseJsonBody(request));
    return ok(adaptation, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建平台改写失败。");
  }
}
