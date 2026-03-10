import { fail, ok } from "@/lib/api-response";
import { MarketingOperationsService } from "@/services/marketing-operations.service";

const marketingOperationsService = new MarketingOperationsService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sprint = await marketingOperationsService.createCampaignSprint(id, await request.json());
    return ok(sprint, { status: 201 });
  } catch (error) {
    return fail("创建执行周期失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
