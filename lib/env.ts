import type { SupportedPlatform } from "@/types/platform-data";

type PlatformEnvKey = Record<SupportedPlatform, string>;

const platformEnvKeys: PlatformEnvKey = {
  YOUTUBE: "YOUTUBE_API_KEY",
  X: "X_BEARER_TOKEN",
  TIKTOK: "SERPER_API_KEY",
  XHS: "SERPER_API_KEY",
  DOUYIN: "SERPER_API_KEY",
};

export function getPlatformApiKey(platform: SupportedPlatform) {
  const key = process.env[platformEnvKeys[platform]];
  return key && key.trim().length > 0 ? key : null;
}

export function getConnectorMode(forceMock = false): "mock" | "live" {
  if (forceMock) {
    return "mock";
  }

  return process.env.PLATFORM_CONNECTOR_MODE?.toLowerCase() === "mock" ? "mock" : "live";
}

export function getConnectorTimeoutMs() {
  const value = Number(process.env.PLATFORM_CONNECTOR_TIMEOUT_MS || 8000);
  return Number.isFinite(value) && value > 0 ? value : 8000;
}

export type UploadStorageMode = "local" | "tencent_cos";

export function getUploadStorageMode(): UploadStorageMode {
  const value = process.env.UPLOAD_STORAGE_MODE?.trim().toLowerCase();
  return value === "tencent_cos" ? "tencent_cos" : "local";
}

export function usesLocalUploadStorage() {
  return getUploadStorageMode() === "local";
}

export function getTencentCosConfig() {
  const secretId = process.env.TENCENT_COS_SECRET_ID?.trim();
  const secretKey = process.env.TENCENT_COS_SECRET_KEY?.trim();
  const bucket = process.env.TENCENT_COS_BUCKET?.trim();
  const region = process.env.TENCENT_COS_REGION?.trim();
  const baseUrl = process.env.TENCENT_COS_BASE_URL?.trim();

  if (!secretId || !secretKey || !bucket || !region) {
    return null;
  }

  return {
    secretId,
    secretKey,
    bucket,
    region,
    baseUrl: baseUrl && baseUrl.length > 0 ? baseUrl.replace(/\/+$/, "") : null,
  };
}

export function getEffectiveServerUploadMbLimit() {
  return getMaxUploadMb();
}

export function getUploadBasePath() {
  const value = process.env.UPLOAD_BASE_PATH?.trim();
  return value && value.length > 0 ? value : "public/uploads";
}

export function getMaxUploadMb() {
  const value = Number(process.env.MAX_UPLOAD_MB || 20);
  return Number.isFinite(value) && value > 0 ? value : 20;
}

export function getPreviewAccessEnabled() {
  return process.env.PREVIEW_ACCESS_ENABLED?.toLowerCase() === "true";
}

export function getPreviewAccessPassword() {
  const value = process.env.PREVIEW_ACCESS_PASSWORD?.trim();
  return value && value.length > 0 ? value : null;
}

export function getAppBaseUrl() {
  const value = process.env.APP_BASE_URL?.trim();
  return value && value.length > 0 ? value : "http://localhost:3000";
}
