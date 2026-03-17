import { AppSettingsService } from "@/services/app-settings.service";
import { MockNewsSearchProvider } from "@/services/news-search/mock";
import { SerperNewsSearchProvider } from "@/services/news-search/serper";
import { SerperSearchService } from "@/services/web-search/serper-search.service";
import { BaiduNewsSearchProvider } from "@/services/news-search/baidu";
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

/** Weight factor for Google-indexed evidence (lower than real-time sources) */
const INDEXED_SCORE_WEIGHT = 0.6;

/**
 * Search for China-focused evidence:
 * 1. **Baidu News** (real-time, via SerpApi) — full weight
 * 2. CN Google News (gl: "cn", hl: "zh-cn") — 0.6× weight
 * 3. site:xiaohongshu.com indexed pages — 0.6× weight
 * 4. site:douyin.com indexed pages — 0.6× weight
 *
 * Baidu results appear first (most timely). Google-indexed results follow.
 */
export async function searchCnIndexedEvidence(input: {
  topic: string;
  limit?: number;
}): Promise<NewsSearchResult> {
  const settings = await appSettingsService.getEffectiveSettings();

  if (settings.newsSearchMockMode) {
    return {
      provider: "GOOGLE",
      mode: "mock",
      success: true,
      items: [],
      errors: [],
      fetched_at: new Date().toISOString(),
    };
  }

  // Build list of parallel search promises
  const searches: Array<{
    key: string;
    promise: Promise<NewsSearchResult>;
    transform: (items: NewsSearchItem[]) => NewsSearchItem[];
  }> = [];

  // 1. Baidu News (real-time, full weight) — only if SerpApi key available
  const serpApiKey = settings.serpApiKey || process.env.SERPAPI_KEY?.trim() || null;
  if (serpApiKey) {
    const baiduProvider = new BaiduNewsSearchProvider(serpApiKey);
    searches.push({
      key: "BAIDU_NEWS",
      promise: baiduProvider.searchLatest({
        topic: input.topic,
        limit: Math.min(input.limit ?? 8, 10),
      }),
      // Baidu results get full score weight — they are real-time
      transform: (items) => items,
    });
  }

  // 2-4. Google-indexed sources (only if Serper key available)
  if (settings.serperApiKey) {
    const newsProvider = new SerperNewsSearchProvider(settings.serperApiKey);
    const webProvider = new SerperSearchService(settings.serperApiKey);
    const CN_LOCALE = { gl: "cn", hl: "zh-cn" };
    const perSourceLimit = Math.min(input.limit ?? 5, 8);

    searches.push({
      key: "CN_NEWS",
      promise: newsProvider.searchLatest({
        topic: input.topic,
        limit: perSourceLimit,
        locale: CN_LOCALE,
        sourceType: "cn_news",
      }),
      transform: (items) =>
        items.map((item) => ({ ...item, score: item.score * INDEXED_SCORE_WEIGHT })),
    });

    searches.push({
      key: "XHS_INDEXED",
      promise: webProvider.searchPlatformContent({
        query: input.topic,
        siteDomain: "xiaohongshu.com",
        limit: perSourceLimit,
        locale: CN_LOCALE,
      }),
      transform: (items) =>
        items.map((item) => ({
          ...item,
          id: `xhs-indexed-${item.id}`,
          source: "小红书 (索引)",
          source_type: "indexed",
          score: item.score * INDEXED_SCORE_WEIGHT,
        })),
    });

    searches.push({
      key: "DOUYIN_INDEXED",
      promise: webProvider.searchPlatformContent({
        query: input.topic,
        siteDomain: "douyin.com",
        limit: perSourceLimit,
        locale: CN_LOCALE,
      }),
      transform: (items) =>
        items.map((item) => ({
          ...item,
          id: `douyin-indexed-${item.id}`,
          source: "抖音 (索引)",
          source_type: "indexed",
          score: item.score * INDEXED_SCORE_WEIGHT,
        })),
    });
  }

  if (searches.length === 0) {
    return {
      provider: "GOOGLE",
      mode: "live",
      success: true,
      items: [],
      errors: [{ code: "CONFIG_MISSING", message: "No search API keys configured for CN evidence" }],
      fetched_at: new Date().toISOString(),
    };
  }

  // Fire all searches in parallel
  const results = await Promise.allSettled(searches.map((s) => s.promise));

  const allItems: NewsSearchItem[] = [];
  const errors: Array<{ code: string; message: string }> = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const search = searches[i];

    if (result.status === "fulfilled" && result.value.success) {
      allItems.push(...search.transform(result.value.items));
    } else if (result.status === "rejected") {
      errors.push({ code: `${search.key}_FAILED`, message: String(result.reason) });
    } else if (result.status === "fulfilled" && !result.value.success) {
      errors.push(...result.value.errors);
    }
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


