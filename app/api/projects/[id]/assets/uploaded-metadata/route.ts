import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { AssetService } from "@/services/asset.service";

const service = new AssetService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const result = await service.saveUploadedMetadata(id, payload);
    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("保存上传素材元数据失败。", 500, error.message);
    }
    return fail("保存上传素材元数据失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
