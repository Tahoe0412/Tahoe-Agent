import { NextResponse } from "next/server";
import { getPlatformConnector } from "@/services/platform-connectors";
import { TrendScoringEngine } from "@/services/trend-scoring";
import { searchLatestNews } from "@/services/news-search";
import { MockNewsSearchProvider } from "@/services/news-search/mock";
import type { SupportedPlatform, ContentItem, Creator, PlatformCollectResult } from "@/types/platform-data";
import type { ScoredTrendTopic } from "@/services/trend-scoring/engine";
import type { NewsSearchResult } from "@/types/news-search";

const ALLOWED_PLATFORMS: SupportedPlatform[] = ["YOUTUBE", "X", "TIKTOK", "XHS", "DOUYIN"];

interface HotTopicsRequest {
  query: string;
  platforms?: SupportedPlatform[];
  limit?: number;
  mockMode?: boolean;
}

interface HotTopicsResponse {
  success: boolean;
  query: string;
  platforms: SupportedPlatform[];
  topics: ScoredTrendTopic[];
  creators: Creator[];
  content_items: ContentItem[];
  news: NewsSearchResult;
  platform_results: PlatformCollectResult[];
  fetched_at: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HotTopicsRequest;

    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or empty 'query' field." },
        { status: 400 }
      );
    }

    const query = body.query.trim();
    const platforms: SupportedPlatform[] = (body.platforms ?? ["YOUTUBE", "X"]).filter((p) =>
      ALLOWED_PLATFORMS.includes(p)
    );
    const limit = Math.min(body.limit ?? 10, 25);
    const mockMode = body.mockMode ?? false;

    // 1. Parallel: platform connectors + news search
    //    In mock mode, bypass AppSettingsService (requires DB) and use mock directly.
    const newsSearchPromise = mockMode
      ? new MockNewsSearchProvider().searchLatest({ topic: query, limit: 5 })
      : searchLatestNews({ topic: query, limit: 5 });

    const [platformResults, newsResult] = await Promise.all([
      Promise.all(
        platforms.map((platform) =>
          getPlatformConnector(platform).collect({
            topic: query,
            limit,
            mock: mockMode,
          })
        )
      ),
      newsSearchPromise,
    ]);

    // 2. Dedupe and aggregate
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

    const creators = [...creatorMap.values()];
    const contentItems = [...contentMap.values()];

    // 3. Score & rank trend topics
    const trendEngine = new TrendScoringEngine();
    const topics = trendEngine.score(contentItems);

    const response: HotTopicsResponse = {
      success: true,
      query,
      platforms,
      topics,
      creators,
      content_items: contentItems,
      news: newsResult,
      platform_results: platformResults,
      fetched_at: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
