import type { SupportedPlatform } from "@/types/domain";
import type { PlatformCollector } from "@/services/platform-collectors/base";
import { TikTokCollector } from "@/services/platform-collectors/tiktok";
import { XCollector } from "@/services/platform-collectors/x";
import { YouTubeCollector } from "@/services/platform-collectors/youtube";

const collectors: Record<SupportedPlatform, PlatformCollector> = {
  YOUTUBE: new YouTubeCollector(),
  X: new XCollector(),
  TIKTOK: new TikTokCollector(),
};

export function getCollector(platform: SupportedPlatform) {
  return collectors[platform];
}
