import { fail, ok } from "@/lib/api-response";
import { BrandProfileService } from "@/services/brand-profile.service";

const brandProfileService = new BrandProfileService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pillar = await brandProfileService.createPillar({
      ...body,
      brand_profile_id: id,
    });
    return ok(pillar, { status: 201 });
  } catch (error) {
    return fail("创建内容支柱失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
