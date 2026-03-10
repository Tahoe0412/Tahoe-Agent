import type { SupportedPlatform } from "@/types/platform-data";

type PlatformEnvKey = Record<SupportedPlatform, string>;

const platformEnvKeys: PlatformEnvKey = {
  YOUTUBE: "YOUTUBE_API_KEY",
  X: "X_BEARER_TOKEN",
  TIKTOK: "TIKTOK_ACCESS_TOKEN",
};

export function getPlatformApiKey(platform: SupportedPlatform) {
  const key = process.env[platformEnvKeys[platform]];
  return key && key.trim().length > 0 ? key : null;
}

export function getConnectorMode(forceMock = false): "mock" | "live" {
  if (forceMock) {
    return "mock";
  }

  return process.env.PLATFORM_CONNECTOR_MODE?.toLowerCase() === "live" ? "live" : "mock";
}

export function getConnectorTimeoutMs() {
  const value = Number(process.env.PLATFORM_CONNECTOR_TIMEOUT_MS || 8000);
  return Number.isFinite(value) && value > 0 ? value : 8000;
}

export function getUploadStorageMode(): "local" | "vercel_blob" {
  const value = process.env.UPLOAD_STORAGE_MODE?.trim().toLowerCase();
  return value === "vercel_blob" ? "vercel_blob" : "local";
}

export function getDeploymentTarget() {
  const value = process.env.VERCEL?.toLowerCase();
  return value === "1" || value === "true" ? "vercel" : "local";
}

export function hasEphemeralLocalUploads() {
  return getDeploymentTarget() === "vercel" && getUploadStorageMode() === "local";
}

export function getBlobReadWriteToken() {
  const value = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return value && value.length > 0 ? value : null;
}

export function getEffectiveServerUploadMbLimit() {
  const configuredLimit = getMaxUploadMb();

  if (getDeploymentTarget() === "vercel") {
    return Math.min(configuredLimit, 4.5);
  }

  return configuredLimit;
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
