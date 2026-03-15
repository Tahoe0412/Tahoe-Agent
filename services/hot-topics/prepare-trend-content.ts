import type { ContentItem, PlatformCollectResult } from "@/types/platform-data";
import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

const GENERIC_TOPIC_TOKENS = new Set([
  "a",
  "an",
  "and",
  "article",
  "breakdown",
  "case",
  "content",
  "demo",
  "for",
  "from",
  "guide",
  "hook",
  "how",
  "latest",
  "news",
  "of",
  "on",
  "or",
  "post",
  "result",
  "results",
  "short",
  "shorts",
  "study",
  "the",
  "today",
  "ugc",
  "video",
  "videos",
  "viral",
  "workflow",
  "youtube",
  "x",
  "xiaohongshu",
  "douyin",
  "tiktok",
]);

function normalizeMetric(value: number | undefined) {
  return Math.max(Number.isFinite(value) ? Number(value) : 0, 0);
}

function normalizeTopicText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join("_");
}

function extractMeaningfulKeywords(...values: string[]) {
  const tokens = values
    .flatMap((value) =>
      value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean),
    )
    .filter((token) => !GENERIC_TOPIC_TOKENS.has(token))
    .filter((token) => token.length >= 2);

  return [...new Set(tokens)].slice(0, 6);
}

function isMockContentItem(item: ContentItem) {
  return Boolean(
    item.raw_payload &&
      typeof item.raw_payload === "object" &&
      "mock" in item.raw_payload &&
      (item.raw_payload as { mock?: unknown }).mock === true,
  );
}

function sanitizeContentItem(item: ContentItem): ContentItem {
  return {
    ...item,
    view_count: normalizeMetric(item.view_count),
    like_count: normalizeMetric(item.like_count),
    comment_count: normalizeMetric(item.comment_count),
    share_count: normalizeMetric(item.share_count),
  };
}

function alignMockItemWithNews(item: ContentItem, newsItem: NewsSearchItem, query: string): ContentItem {
  const keywords = extractMeaningfulKeywords(newsItem.title, newsItem.snippet, query);

  return {
    ...sanitizeContentItem(item),
    title: newsItem.title,
    normalized_title: normalizeTopicText(newsItem.title),
    url: newsItem.url || item.url,
    published_at: newsItem.published_at || item.published_at,
    keyword_set: keywords.length > 0 ? keywords : item.keyword_set,
    topic_hints: keywords.slice(0, 3).length > 0 ? keywords.slice(0, 3) : item.topic_hints,
    raw_payload: {
      ...((item.raw_payload && typeof item.raw_payload === "object") ? item.raw_payload : {}),
      mock: true,
      enriched_from_news: true,
      news_id: newsItem.id,
    },
  };
}

export function prepareTrendContentItems(
  contentItems: ContentItem[],
  newsResult: NewsSearchResult,
  platformResults: PlatformCollectResult[],
  query: string,
) {
  const newsItems = newsResult.success && newsResult.mode === "live" ? newsResult.items : [];
  const mockPlatforms = new Set(
    platformResults.filter((result) => result.mode === "mock").map((result) => result.platform),
  );

  return contentItems.map((item, index) => {
    const sanitized = sanitizeContentItem(item);
    const isMock = isMockContentItem(sanitized) || mockPlatforms.has(sanitized.platform);

    if (!isMock || newsItems.length === 0) {
      return sanitized;
    }

    return alignMockItemWithNews(sanitized, newsItems[index % newsItems.length], query);
  });
}
