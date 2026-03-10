import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { ScriptService } from "@/services/script.service";

const service = new ScriptService();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> },
) {
  try {
    const { id, sceneId } = await params;
    const body = await request.json();
    const result = await service.updateScene(id, sceneId, body);
    return ok(result);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("更新 scene 失败。", 500, error.message);
    }
    return fail("更新 scene 失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
