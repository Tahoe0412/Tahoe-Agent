import { BasePlatformConnector } from "@/services/platform-connectors/base";
import type { ContentItem, Creator, PlatformCollectInput } from "@/types/platform-data";

export class DouyinConnector extends BasePlatformConnector {
  readonly platform = "DOUYIN" as const;

  protected async fetchLive(input: PlatformCollectInput, apiKey: string): Promise<Record<string, never>> {
    void input;
    void apiKey;
    return {};
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
