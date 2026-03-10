import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { scriptRewriteRequestSchema } from "@/schemas/script-production";
import { ScriptService } from "@/services/script.service";

const service = new ScriptService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = scriptRewriteRequestSchema.parse(await request.json());

    if (!body.script_text) {
      return fail("script_text 是必填项。", 400);
    }

    const result = await service.createUserScript({
      projectId: id,
      title: body.title,
      originalText: body.script_text,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("创建 script 失败。", 500, error.message);
    }
    return fail("创建 script 失败。", 400, error instanceof Error ? error.message : undefined);
  }
}

