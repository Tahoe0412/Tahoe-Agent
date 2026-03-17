import type { SupportedPlatform, ContentItem, Creator, PlatformCollectResult } from "@/types/platform-data";
import type { NewsSearchResult } from "@/types/news-search";
import type { ScoredTrendTopic } from "@/services/trend-scoring/engine";

// ── Request ──

export interface HotTopicsSearchInput {
  query: string;
  platforms: SupportedPlatform[];
  limit?: number;
  mockMode?: boolean;
}

// ── Response ──

export interface HotTopicsSearchResult {
  success: boolean;
  query: string;
  platforms: SupportedPlatform[];
  topics: ScoredTrendTopic[];
  creators: Creator[];
  content_items: ContentItem[];
  news: NewsSearchResult;
  cn_indexed?: NewsSearchResult;
  platform_results: PlatformCollectResult[];
  fetched_at: string;
}

// ── Derived view-model types (used by UI components) ──

export type TopicHeatLevel = "HOT" | "RISING" | "STABLE";

export interface TopicRankingItem {
  rank: number;
  topicKey: string;
  label: string;
  score: number;
  heatLevel: TopicHeatLevel;
  sourcePlatforms: SupportedPlatform[];
  evidenceCount: number;
  topEvidence: Array<{
    title: string;
    url: string;
    platform: SupportedPlatform;
    viewCount: number;
  }>;
}

// ── Transform helpers ──

export function toTopicRankingItems(topics: ScoredTrendTopic[]): TopicRankingItem[] {
  return topics.map((topic, index) => ({
    rank: index + 1,
    topicKey: topic.topic_key,
    label: topic.topic_label,
    score: topic.scores.total_score,
    heatLevel: resolveHeatLevel(topic.scores.total_score),
    sourcePlatforms: topic.source_platforms,
    evidenceCount: topic.evidence.length,
    topEvidence: topic.evidence.slice(0, 3).map((e) => ({
      title: e.title,
      url: e.url,
      platform: e.platform,
      viewCount: e.view_count,
    })),
  }));
}

function resolveHeatLevel(score: number): TopicHeatLevel {
  if (score >= 75) return "HOT";
  if (score >= 55) return "RISING";
  return "STABLE";
}
