import type { SupportedPlatform } from "@/types/domain";

export interface CollectionQuery {
  topic: string;
  platform: SupportedPlatform;
}

export interface CollectionResult {
  platform: SupportedPlatform;
  query: string;
  collectedAt: string;
  items: unknown[];
}

export interface PlatformCollector {
  platform: SupportedPlatform;
  collect(query: CollectionQuery): Promise<CollectionResult>;
}
