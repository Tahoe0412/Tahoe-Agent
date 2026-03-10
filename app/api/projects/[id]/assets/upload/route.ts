import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { getBlobReadWriteToken, getMaxUploadMb, getUploadStorageMode } from "@/lib/env";
import { AssetService } from "@/services/asset.service";

const service = new AssetService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      if (getUploadStorageMode() !== "vercel_blob") {
        return fail("当前未启用 Blob 直传模式。", 400);
      }

      const body = (await request.json()) as HandleUploadBody;
      const jsonResponse = await handleUpload({
        token: getBlobReadWriteToken() || undefined,
        request,
        body,
        onBeforeGenerateToken: async (_pathname, clientPayload) => {
          const payload = clientPayload ? (JSON.parse(clientPayload) as Record<string, unknown>) : {};
          if (payload.project_id !== id) {
            throw new Error("项目上下文不匹配，无法生成上传 token。");
          }

          return {
            maximumSizeInBytes: getMaxUploadMb() * 1024 * 1024,
            allowedContentTypes: ["image/*", "audio/*", "video/*", "text/plain", "application/pdf"],
            addRandomSuffix: false,
            allowOverwrite: false,
            tokenPayload: clientPayload,
            validUntil: Date.now() + 60 * 60 * 1000,
          };
        },
      });

      return Response.json(jsonResponse);
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const assetType = formData.get("asset_type");
    const scriptSceneId = formData.get("script_scene_id");
    const continuityGroup = formData.get("continuity_group");

    if (!(file instanceof File)) {
      return fail("file 是必填项。", 400);
    }

    if (typeof assetType !== "string") {
      return fail("asset_type 是必填项。", 400);
    }

    const result = await service.saveUploadedFile({
      projectId: id,
      file,
      assetType: assetType as "CHARACTER_BASE" | "SCENE_BASE" | "CHARACTER_SCENE_COMPOSITE" | "VOICE" | "REFERENCE_IMAGE",
      scriptSceneId: typeof scriptSceneId === "string" ? scriptSceneId : undefined,
      continuityGroup: typeof continuityGroup === "string" ? continuityGroup : undefined,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("上传素材失败。", 500, error.message);
    }

    return fail("上传素材失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
