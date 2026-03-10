import type { PlatformConnector } from "@/services/platform-connectors/base";
import { TikTokConnector } from "@/services/platform-connectors/tiktok";
import { XConnector } from "@/services/platform-connectors/x";
import { YouTubeConnector } from "@/services/platform-connectors/youtube";
import type { SupportedPlatform } from "@/types/platform-data";

const connectors: Record<SupportedPlatform, PlatformConnector> = {
  YOUTUBE: new YouTubeConnector(),
  X: new XConnector(),
  TIKTOK: new TikTokConnector(),
};

export function getPlatformConnector(platform: SupportedPlatform) {
  return connectors[platform];
}
