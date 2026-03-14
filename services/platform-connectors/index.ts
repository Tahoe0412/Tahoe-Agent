import type { PlatformConnector } from "@/services/platform-connectors/base";
import { DouyinConnector } from "@/services/platform-connectors/douyin";
import { TikTokConnector } from "@/services/platform-connectors/tiktok";
import { XConnector } from "@/services/platform-connectors/x";
import { XhsConnector } from "@/services/platform-connectors/xhs";
import { YouTubeConnector } from "@/services/platform-connectors/youtube";
import type { SupportedPlatform } from "@/types/platform-data";

const connectors: Record<SupportedPlatform, PlatformConnector> = {
  YOUTUBE: new YouTubeConnector(),
  X: new XConnector(),
  TIKTOK: new TikTokConnector(),
  XHS: new XhsConnector(),
  DOUYIN: new DouyinConnector(),
};

export function getPlatformConnector(platform: SupportedPlatform) {
  return connectors[platform];
}
