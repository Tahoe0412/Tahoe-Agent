import { fail, ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { BrandProfileService } from "@/services/brand-profile.service";

const brandProfileService = new BrandProfileService();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const updated = await brandProfileService.update(id, body);
    return ok(updated);
  } catch (error) {
    return toErrorResponse(error, "更新品牌档案失败。");
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const profiles = await brandProfileService.list();
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return fail("找不到该品牌档案。", 404);
    return ok(profile);
  } catch (error) {
    return fail("读取品牌档案失败。", 500, error instanceof Error ? error.message : undefined);
  }
}
