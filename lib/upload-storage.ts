import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import COS from "cos-nodejs-sdk-v5";
import { getTencentCosConfig, getUploadBasePath, getUploadStorageMode } from "@/lib/env";

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getExtension(fileName: string) {
  const extension = path.extname(fileName);
  return extension.length > 0 ? extension : "";
}

export function buildUploadPathname(params: {
  projectId: string;
  continuityGroup?: string | null;
  fileName: string;
}) {
  const relativeDir = path.posix.join(
    sanitizeSegment(params.projectId),
    sanitizeSegment(params.continuityGroup || "unscoped"),
  );
  const safeBaseName = sanitizeSegment(path.basename(params.fileName, getExtension(params.fileName)));
  const fileName = `${Date.now()}-${safeBaseName || "asset"}-${randomUUID().slice(0, 8)}${getExtension(params.fileName)}`;

  return {
    relativeDir,
    fileName,
    pathname: path.posix.join(relativeDir, fileName),
  };
}

export async function saveFileToLocalStorage(params: {
  projectId: string;
  continuityGroup?: string | null;
  fileName: string;
  bytes: Uint8Array;
}) {
  const basePath = getUploadBasePath();
  const uploadPath = buildUploadPathname(params);
  const relativeDir = uploadPath.relativeDir.split("/").join(path.sep);
  const targetDir = path.join(process.cwd(), basePath, relativeDir);
  await mkdir(targetDir, { recursive: true });

  const absolutePath = path.join(targetDir, uploadPath.fileName);
  await writeFile(absolutePath, params.bytes);

  return {
    absolutePath,
    relativePath: path.posix.join("/uploads", uploadPath.pathname),
    storageMode: "local" as const,
    storedPath: path.posix.join("/uploads", uploadPath.pathname),
  };
}

function buildTencentCosFileUrl(pathname: string, baseUrl: string | null, bucket: string, region: string) {
  if (baseUrl) {
    return `${baseUrl}/${pathname}`;
  }

  return `https://${bucket}.cos.${region}.myqcloud.com/${pathname}`;
}

export async function saveFileToTencentCos(params: {
  projectId: string;
  continuityGroup?: string | null;
  fileName: string;
  bytes: Uint8Array;
  mimeType?: string;
}) {
  const config = getTencentCosConfig();
  if (!config) {
    throw new Error("未配置腾讯云对象存储参数，无法使用 tencent_cos 上传。");
  }

  const uploadPath = buildUploadPathname(params);
  const client = new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
  });
  const body = Buffer.from(params.bytes);

  await new Promise<void>((resolve, reject) => {
    client.putObject(
      {
        Bucket: config.bucket,
        Region: config.region,
        Key: uploadPath.pathname,
        Body: body,
        ContentLength: body.byteLength,
        ContentType: params.mimeType || undefined,
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      },
    );
  });

  return {
    absolutePath: buildTencentCosFileUrl(uploadPath.pathname, config.baseUrl, config.bucket, config.region),
    relativePath: buildTencentCosFileUrl(uploadPath.pathname, config.baseUrl, config.bucket, config.region),
    storageMode: "tencent_cos" as const,
    storedPath: uploadPath.pathname,
  };
}

export async function saveFileToStorage(params: {
  projectId: string;
  continuityGroup?: string | null;
  fileName: string;
  bytes: Uint8Array;
  mimeType?: string;
}) {
  if (getUploadStorageMode() === "tencent_cos") {
    return saveFileToTencentCos({
      projectId: params.projectId,
      continuityGroup: params.continuityGroup,
      fileName: params.fileName,
      bytes: params.bytes,
      mimeType: params.mimeType,
    });
  }

  return saveFileToLocalStorage({
    projectId: params.projectId,
    continuityGroup: params.continuityGroup,
    fileName: params.fileName,
    bytes: params.bytes,
  });
}
