import { AppSettingsService } from "@/services/app-settings.service";
import { MockNewsSearchProvider } from "@/services/news-search/mock";
import { SerperNewsSearchProvider } from "@/services/news-search/serper";
import { SerperSearchService } from "@/services/web-search/serper-search.service";
import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

const appSettingsService = new AppSettingsService();

export async function searchLatestNews(input: { topic: string; limit?: number }) {
  const settings = await appSettingsService.getEffectiveSettings();

  if (settings.newsSearchMockMode || settings.newsSearchProvider === "MOCK") {
    return new MockNewsSearchProvider().searchLatest(input);
  }

  if (settings.newsSearchProvider === "GOOGLE") {
    if (!settings.serperApiKey) {
      return {
        provider: "GOOGLE" as const,
        mode: "live" as const,
        success: false,
        items: [],
        errors: [{ code: "CONFIG_MISSING", message: "SERPER_API_KEY is missing. Get one at serper.dev" }],
        fetched_at: new Date().toISOString(),
      };
    }

    try {
      return await new SerperNewsSearchProvider(
        settings.serperApiKey,
      ).searchLatest(input);
    } catch (error) {
      return {
        provider: "GOOGLE" as const,
        mode: "live" as const,
        success: false,
        items: [],
        errors: [{ code: "REQUEST_FAILED", message: error instanceof Error ? error.message : "News search failed." }],
        fetched_at: new Date().toISOString(),
      };
    }
  }

  return new MockNewsSearchProvider().searchLatest({ ...input });
}

/** Weight factor for indexed evidence (lower than native platform data) */
const INDEXED_SCORE_WEIGHT = 0.6;

/**
 * Search for China-focused evidence:
 * 1. CN Google News (gl: "cn", hl: "zh-cn")
 * 2. site:xiaohongshu.com indexed pages
 * 3. site:douyin.com indexed pages
 *
 * Results are tagged with source_type "cn_news" or "indexed" and scores
 * are weighted down to avoid competing equally with native platform data.
 */
export async function searchCnIndexedEvidence(input: {
  topic: string;
  limit?: number;
}): Promise<NewsSearchResult> {
  const settings = await appSettingsService.getEffectiveSettings();

  if (settings.newsSearchMockMode || !settings.serperApiKey) {
    return {
      provider: "GOOGLE",
      mode: settings.newsSearchMockMode ? "mock" : "live",
      success: true,
      items: [],
      errors: settings.serperApiKey
        ? []
        : [{ code: "CONFIG_MISSING", message: "SERPER_API_KEY missing for CN indexed search" }],
      fetched_at: new Date().toISOString(),
    };
  }

  const newsProvider = new SerperNewsSearchProvider(settings.serperApiKey);
  const webProvider = new SerperSearchService(settings.serperApiKey);

  const CN_LOCALE = { gl: "cn", hl: "zh-cn" };
  const perSourceLimit = Math.min(input.limit ?? 5, 8);

  // Fire all 3 searches in parallel
  const [cnNewsResult, xhsResult, douyinResult] = await Promise.allSettled([
    newsProvider.searchLatest({
      topic: input.topic,
      limit: perSourceLimit,
      locale: CN_LOCALE,
      sourceType: "cn_news",
    }),
    webProvider.searchPlatformContent({
      query: input.topic,
      siteDomain: "xiaohongshu.com",
      limit: perSourceLimit,
      locale: CN_LOCALE,
    }),
    webProvider.searchPlatformContent({
      query: input.topic,
      siteDomain: "douyin.com",
      limit: perSourceLimit,
      locale: CN_LOCALE,
    }),
  ]);

  const allItems: NewsSearchItem[] = [];
  const errors: Array<{ code: string; message: string }> = [];

  // Collect CN news
  if (cnNewsResult.status === "fulfilled" && cnNewsResult.value.success) {
    for (const item of cnNewsResult.value.items) {
      allItems.push({ ...item, score: item.score * INDEXED_SCORE_WEIGHT });
    }
  } else if (cnNewsResult.status === "rejected") {
    errors.push({ code: "CN_NEWS_FAILED", message: String(cnNewsResult.reason) });
  }

  // Collect XHS indexed results
  if (xhsResult.status === "fulfilled" && xhsResult.value.success) {
    for (const item of xhsResult.value.items) {
      allItems.push({
        ...item,
        id: `xhs-indexed-${item.id}`,
        source: "小红书 (索引)",
        source_type: "indexed",
        score: item.score * INDEXED_SCORE_WEIGHT,
      });
    }
  } else if (xhsResult.status === "rejected") {
    errors.push({ code: "XHS_INDEXED_FAILED", message: String(xhsResult.reason) });
  }

  // Collect Douyin indexed results
  if (douyinResult.status === "fulfilled" && douyinResult.value.success) {
    for (const item of douyinResult.value.items) {
      allItems.push({
        ...item,
        id: `douyin-indexed-${item.id}`,
        source: "抖音 (索引)",
        source_type: "indexed",
        score: item.score * INDEXED_SCORE_WEIGHT,
      });
    }
  } else if (douyinResult.status === "rejected") {
    errors.push({ code: "DOUYIN_INDEXED_FAILED", message: String(douyinResult.reason) });
  }

  return {
    provider: "GOOGLE",
    mode: "live",
    success: allItems.length > 0 || errors.length === 0,
    items: allItems,
    errors,
    fetched_at: new Date().toISOString(),
  };
}

