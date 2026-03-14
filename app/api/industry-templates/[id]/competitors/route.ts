import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { IndustryTemplateService } from "@/services/industry-template.service";

const industryTemplateService = new IndustryTemplateService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const competitor = await industryTemplateService.createCompetitor(id, await parseJsonBody(request));
    return ok(competitor, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建竞品档案失败。");
  }
}
