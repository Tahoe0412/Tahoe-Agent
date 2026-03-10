import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { AssetDependencyAnalyzerService } from "@/services/asset-dependency-analyzer.service";

const service = new AssetDependencyAnalyzerService();

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> },
) {
  try {
    const { id, sceneId } = await params;
    const result = await service.analyzeAndSave({
      projectId: id,
      sceneId,
    });
    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("素材依赖分析失败。", 500, error.message);
    }
    return fail("素材依赖分析失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
