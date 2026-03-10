import type { CollectionQuery, CollectionResult, PlatformCollector } from "@/services/platform-collectors/base";

export class XCollector implements PlatformCollector {
  platform = "X" as const;

  async collect(query: CollectionQuery): Promise<CollectionResult> {
    return {
      platform: this.platform,
      query: query.topic,
      collectedAt: new Date().toISOString(),
      items: [],
    };
  }
}
