import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEffectiveServerUploadMbLimit } from "@/lib/env";
import { saveFileToStorage } from "@/lib/upload-storage";
import { uploadedAssetMetadataSchema } from "@/schemas/asset-dependency";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class AssetService {
  async saveUploadedMetadata(projectId: string, input: unknown) {
    const payload = uploadedAssetMetadataSchema.parse(input);

    return prisma.uploadedAsset.create({
      data: {
        project_id: projectId,
        script_scene_id: payload.script_scene_id,
        asset_type: payload.asset_type,
        continuity_group: payload.continuity_group,
        file_name: payload.file_name,
        file_url: payload.file_url,
        mime_type: payload.mime_type,
        metadata_json: payload.metadata_json ? toJson(payload.metadata_json) : undefined,
      },
    });
  }

  async saveUploadedFile(params: {
    projectId: string;
    scriptSceneId?: string;
    continuityGroup?: string;
    assetType: "CHARACTER_BASE" | "SCENE_BASE" | "CHARACTER_SCENE_COMPOSITE" | "VOICE" | "REFERENCE_IMAGE";
    file: File;
  }) {
    if (!params.file || params.file.size === 0) {
      throw new Error("上传文件不能为空。");
    }

    const maxUploadBytes = getEffectiveServerUploadMbLimit() * 1024 * 1024;
    if (params.file.size > maxUploadBytes) {
      throw new Error(`文件过大，当前服务端上传限制为 ${getEffectiveServerUploadMbLimit()}MB。`);
    }

    const bytes = new Uint8Array(await params.file.arrayBuffer());
    const stored = await saveFileToStorage({
      projectId: params.projectId,
      continuityGroup: params.continuityGroup,
      fileName: params.file.name,
      bytes,
      file: params.file,
    });

    return prisma.uploadedAsset.create({
      data: {
        project_id: params.projectId,
        script_scene_id: params.scriptSceneId,
        asset_type: params.assetType,
        continuity_group: params.continuityGroup,
        file_name: params.file.name,
        file_url: stored.relativePath,
        mime_type: params.file.type || undefined,
        metadata_json: toJson({
          size_bytes: params.file.size,
          storage_mode: stored.storageMode,
          stored_path: stored.storedPath,
        }),
      },
    });
  }
}
