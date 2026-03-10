import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { getBlobReadWriteToken, getUploadBasePath, getUploadStorageMode } from "@/lib/env";

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

export async function saveFileToVercelBlob(params: {
  projectId: string;
  continuityGroup?: string | null;
  fileName: string;
  file: File;
}) {
  const token = getBlobReadWriteToken();
  if (!token) {
    throw new Error("未配置 BLOB_READ_WRITE_TOKEN，无法使用 Vercel Blob 上传。");
  }

  const uploadPath = buildUploadPathname(params);
  const uploaded = await put(uploadPath.pathname, params.file, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: params.file.type || undefined,
    token,
  });

  return {
    absolutePath: uploaded.url,
    relativePath: uploaded.url,
    storageMode: "vercel_blob" as const,
    storedPath: uploaded.pathname,
  };
}

export async function saveFileToStorage(params: {
  projectId: string;
  continuityGroup?: string | null;
  fileName: string;
  bytes: Uint8Array;
  file: File;
}) {
  if (getUploadStorageMode() === "vercel_blob") {
    return saveFileToVercelBlob({
      projectId: params.projectId,
      continuityGroup: params.continuityGroup,
      fileName: params.fileName,
      file: params.file,
    });
  }

  return saveFileToLocalStorage({
    projectId: params.projectId,
    continuityGroup: params.continuityGroup,
    fileName: params.fileName,
    bytes: params.bytes,
  });
}
