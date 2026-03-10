import { fail, ok } from "@/lib/api-response";
import { CreativeBriefService } from "@/services/creative-brief.service";

const creativeBriefService = new CreativeBriefService();

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const briefs = await creativeBriefService.listByProject(id);
    return ok(briefs);
  } catch (error) {
    return fail("读取 creative briefs 失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const brief = await creativeBriefService.create(id, await request.json());
    return ok(brief, { status: 201 });
  } catch (error) {
    return fail("创建 creative brief 失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
