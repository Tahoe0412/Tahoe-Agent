import { fail, ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { BrandProfileService } from "@/services/brand-profile.service";

const brandProfileService = new BrandProfileService();

export async function GET() {
  try {
    const profiles = await brandProfileService.list();
    return ok(profiles);
  } catch (error) {
    return fail("读取品牌档案失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await brandProfileService.create(await parseJsonBody(request));
    return ok(profile, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建品牌档案失败。");
  }
}
