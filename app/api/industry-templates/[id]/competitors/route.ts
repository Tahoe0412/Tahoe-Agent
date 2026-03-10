import { fail, ok } from "@/lib/api-response";
import { IndustryTemplateService } from "@/services/industry-template.service";

const industryTemplateService = new IndustryTemplateService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const competitor = await industryTemplateService.createCompetitor(id, await request.json());
    return ok(competitor, { status: 201 });
  } catch (error) {
    return fail("创建竞品档案失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
