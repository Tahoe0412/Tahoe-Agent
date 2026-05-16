import { getPlatformConnector } from "@/services/platform-connectors";
import { TrendScoringEngine } from "@/services/trend-scoring";
import { searchLatestNews, searchCnIndexedEvidence } from "@/services/news-search";
import { MockNewsSearchProvider } from "@/services/news-search/mock";
import { prepareTrendContentItems } from "@/services/hot-topics/prepare-trend-content";
import type { ScoredTrendTopic } from "@/services/trend-scoring/engine";
import type { NewsSearchResult } from "@/types/news-search";
import type { ContentItem, Creator, PlatformCollectResult, SupportedPlatform } from "@/types/platform-data";

export const HOT_TOPICS_ALLOWED_PLATFORMS: SupportedPlatform[] = ["YOUTUBE", "X", "TIKTOK", "XHS", "DOUYIN"];

export interface HotTopicsRequest {
  query: string;
  platforms?: SupportedPlatform[];
  limit?: number;
  mockMode?: boolean;
}

export interface HotTopicsResponse {
  success: boolean;
  query: string;
  platforms: SupportedPlatform[];
  topics: ScoredTrendTopic[];
  creators: Creator[];
  content_items: ContentItem[];
  news: NewsSearchResult;
  cn_indexed: NewsSearchResult;
  platform_results: PlatformCollectResult[];
  fetched_at: string;
}

export function normalizeHotTopicsRequest(input: HotTopicsRequest) {
  const query = input.query.trim();
  const platforms = (input.platforms ?? ["YOUTUBE", "X"]).filter((platform) =>
    HOT_TOPICS_ALLOWED_PLATFORMS.includes(platform),
  );

  return {
    query,
    platforms,
    limit: Math.min(input.limit ?? 10, 25),
    mockMode: input.mockMode ?? false,
  };
}

function buildMockCnIndexedResult(): NewsSearchResult {
  return {
    provider: "GOOGLE",
    mode: "mock",
    success: true,
    items: [],
    errors: [],
    fetched_at: new Date().toISOString(),
  };
}

function dedupePlatformResults(platformResults: PlatformCollectResult[]) {
  const creatorMap = new Map<string, Creator>();
  const contentMap = new Map<string, ContentItem>();

  for (const result of platformResults) {
    for (const creator of result.creators) {
      creatorMap.set(`${creator.platform}:${creator.external_creator_id}`, creator);
    }

    for (const item of result.content_items) {
      contentMap.set(`${item.platform}:${item.external_content_id}`, item);
    }
  }

  return {
    creators: [...creatorMap.values()],
    contentItems: [...contentMap.values()],
  };
}

export async function runHotTopicsResearch(input: HotTopicsRequest): Promise<HotTopicsResponse> {
  const { query, platforms, limit, mockMode } = normalizeHotTopicsRequest(input);

  const newsSearchPromise = mockMode
    ? new MockNewsSearchProvider().searchLatest({ topic: query, limit: 5 })
    : searchLatestNews({ topic: query, limit: 5 });

  const cnIndexedPromise = mockMode ? Promise.resolve(buildMockCnIndexedResult()) : searchCnIndexedEvidence({ topic: query, limit: 5 });

  const [platformResults, newsResult, cnIndexedResult] = await Promise.all([
    Promise.all(
      platforms.map((platform) =>
        getPlatformConnector(platform).collect({
          topic: query,
          limit,
          mock: mockMode,
        }),
      ),
    ),
    newsSearchPromise,
    cnIndexedPromise,
  ]);

  const { creators, contentItems } = dedupePlatformResults(platformResults);
  const trendContentItems = prepareTrendContentItems(contentItems, newsResult, platformResults, query);
  const topics = new TrendScoringEngine().score(trendContentItems);

  return {
    success: true,
    query,
    platforms,
    topics,
    creators,
    content_items: contentItems,
    news: newsResult,
    cn_indexed: cnIndexedResult,
    platform_results: platformResults,
    fetched_at: new Date().toISOString(),
  };
}
