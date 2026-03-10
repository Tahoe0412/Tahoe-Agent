import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { scriptRewriteRequestSchema } from "@/schemas/script-production";
import { ScriptRewriterService } from "@/services/script-rewriter.service";

const service = new ScriptRewriterService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = scriptRewriteRequestSchema.parse(await request.json());

    const project = await prisma.project.findUnique({
      where: { id },
      select: { raw_script_text: true, title: true },
    });

    if (!project) {
      return fail("项目不存在。", 404);
    }

    const scriptText = body.script_text || project.raw_script_text;
    if (!scriptText) {
      return fail("项目缺少原始剧本，请传入 script_text。", 400);
    }

    const result = await service.rewriteAndSave({
      projectId: id,
      title: body.title || project.title,
      scriptText,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("脚本重构写库失败。", 500, error.message);
    }

    return fail("脚本重构失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
