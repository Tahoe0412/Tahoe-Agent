import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { MarketingOperationsService } from "@/services/marketing-operations.service";

const marketingOperationsService = new MarketingOperationsService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sprint = await marketingOperationsService.createCampaignSprint(id, await parseJsonBody(request));
    return ok(sprint, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建执行周期失败。");
  }
}
