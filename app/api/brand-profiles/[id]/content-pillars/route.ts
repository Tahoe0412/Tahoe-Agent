import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { BrandProfileService } from "@/services/brand-profile.service";

const brandProfileService = new BrandProfileService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const pillar = await brandProfileService.createPillar({
      ...body,
      brand_profile_id: id,
    });
    return ok(pillar, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建内容支柱失败。");
  }
}
