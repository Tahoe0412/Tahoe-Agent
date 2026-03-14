import type { SupportedPlatform } from "@/types/domain";
import type { PlatformCollector } from "@/services/platform-collectors/base";
import { DouyinCollector } from "@/services/platform-collectors/douyin";
import { TikTokCollector } from "@/services/platform-collectors/tiktok";
import { XCollector } from "@/services/platform-collectors/x";
import { XhsCollector } from "@/services/platform-collectors/xhs";
import { YouTubeCollector } from "@/services/platform-collectors/youtube";

const collectors: Record<SupportedPlatform, PlatformCollector> = {
  YOUTUBE: new YouTubeCollector(),
  X: new XCollector(),
  TIKTOK: new TikTokCollector(),
  XHS: new XhsCollector(),
  DOUYIN: new DouyinCollector(),
};

export function getCollector(platform: SupportedPlatform) {
  return collectors[platform];
}
