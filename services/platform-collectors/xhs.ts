import type { CollectionQuery, CollectionResult, PlatformCollector } from "@/services/platform-collectors/base";

export class XhsCollector implements PlatformCollector {
  platform = "XHS" as const;

  async collect(query: CollectionQuery): Promise<CollectionResult> {
    return {
      platform: this.platform,
      query: query.topic,
      collectedAt: new Date().toISOString(),
      items: [],
    };
  }
}
