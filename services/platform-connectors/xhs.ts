import { BasePlatformConnector } from "@/services/platform-connectors/base";
import type { ContentItem, Creator, PlatformCollectInput } from "@/types/platform-data";

export class XhsConnector extends BasePlatformConnector {
  readonly platform = "XHS" as const;

  protected async fetchLive(_input: PlatformCollectInput, _apiKey: string): Promise<Record<string, never>> {
    return {};
  }

  protected transformCreators(_payload: unknown): Creator[] {
    return [];
  }

  protected transformContentItems(_payload: unknown): ContentItem[] {
    return [];
  }
}
