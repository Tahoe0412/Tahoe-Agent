import { BasePlatformConnector } from "@/services/platform-connectors/base";
import type { ContentItem, Creator, PlatformCollectInput } from "@/types/platform-data";

export class TikTokConnector extends BasePlatformConnector {
  readonly platform = "TIKTOK" as const;

  protected async fetchLive(input: PlatformCollectInput, apiKey: string) {
    void input;
    void apiKey;
    throw new Error("TikTok live connector is not wired yet. Use mock mode for frontend integration.");
  }

  protected transformCreators(payload: unknown): Creator[] {
    void payload;
    return [];
  }

  protected transformContentItems(payload: unknown): ContentItem[] {
    void payload;
    return [];
  }
}
