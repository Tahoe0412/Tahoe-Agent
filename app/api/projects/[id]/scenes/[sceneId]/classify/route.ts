import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { sceneClassificationRequestSchema } from "@/schemas/script-production";
import { SceneClassificationService } from "@/services/scene-classification.service";

const service = new SceneClassificationService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> },
) {
  try {
    const { id, sceneId } = await params;
    const body = sceneClassificationRequestSchema.parse(await request.json());

    const result = await service.classifyAndSave({
      projectId: id,
      sceneId,
      rewrittenForAi: body.rewritten_for_ai,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("镜头分类写库失败。", 500, error.message);
    }

    return fail("镜头分类失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
