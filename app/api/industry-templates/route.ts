import { fail, ok } from "@/lib/api-response";
import { IndustryTemplateService } from "@/services/industry-template.service";

const industryTemplateService = new IndustryTemplateService();

export async function GET() {
  try {
    const templates = await industryTemplateService.list();
    return ok(templates);
  } catch (error) {
    return fail("读取行业模板失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: Request) {
  try {
    const template = await industryTemplateService.create(await request.json());
    return ok(template, { status: 201 });
  } catch (error) {
    return fail("创建行业模板失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
