"use client";

import { useState, useCallback, useRef } from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import { getCached, setCache, makeCacheKey } from "@/lib/search-cache";
import { toTopicRankingItems } from "@/types/trend-discovery";
import type { HotTopicsSearchResult, TopicRankingItem } from "@/types/trend-discovery";
import type { PlatformCollectResult, SupportedPlatform } from "@/types/platform-data";
import type { NewsSearchResult, NewsSearchItem } from "@/types/news-search";

// ---------------------------------------------------------------------------
// Batch helpers
// ---------------------------------------------------------------------------

const BATCH_SIZE = 3;
const MAX_BATCHES = 4;

/** Split keywords into batches of up to BATCH_SIZE */
function splitIntoBatches(keywords: string[]): string[][] {
  if (keywords.length <= BATCH_SIZE) return [keywords];
  const batches: string[][] = [];
  for (let i = 0; i < keywords.length && batches.length < MAX_BATCHES; i += BATCH_SIZE) {
    batches.push(keywords.slice(i, i + BATCH_SIZE));
  }
  // If we hit MAX_BATCHES but have remaining keywords, tack them onto the last batch
  const covered = MAX_BATCHES * BATCH_SIZE;
  if (keywords.length > covered && batches.length === MAX_BATCHES) {
    batches[batches.length - 1].push(...keywords.slice(covered));
  }
  return batches;
}

function batchToQuery(batch: string[]): string {
  return batch.join(" OR ");
}

/** Dedupe news items by URL, tracking hitCount */
function mergeNewsItems(
  allResults: (NewsSearchResult | null | undefined)[],
): NewsSearchItem[] {
  const map = new Map<string, NewsSearchItem & { hitCount: number }>();
  for (const result of allResults) {
    if (!result?.items) continue;
    for (const item of result.items) {
      const key = item.url;
      if (map.has(key)) {
        map.get(key)!.hitCount += 1;
      } else {
        map.set(key, { ...item, hitCount: 1 });
      }
    }
  }
  // Sort: hitCount desc → published_at desc
  return [...map.values()]
    .sort((a, b) => {
      if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    })
    .slice(0, 20);
}

/** Merge topics, dedup by normalized title, hitCount boosted */
function mergeTopics(
  allResults: HotTopicsSearchResult[],
): HotTopicsSearchResult["topics"] {
  const map = new Map<string, HotTopicsSearchResult["topics"][number] & { hitCount: number }>();
  for (const result of allResults) {
    for (const topic of result.topics) {
      const key = topic.topic_key?.toLowerCase().trim() ?? "";
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.hitCount += 1;
        if (topic.scores.total_score > existing.scores.total_score) {
          Object.assign(existing, topic, { hitCount: existing.hitCount });
        }
      } else {
        map.set(key, { ...topic, hitCount: 1 });
      }
    }
  }
  return [...map.values()]
    .sort((a, b) => {
      if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
      return b.scores.total_score - a.scores.total_score;
    })
    .slice(0, 15);
}

/** Merge platform results, dedup content_items by external_content_id */
function mergePlatformResults(
  allResults: HotTopicsSearchResult[],
): PlatformCollectResult[] {
  const platformMap = new Map<string, PlatformCollectResult>();
  for (const result of allResults) {
    for (const pr of result.platform_results ?? []) {
      const key = pr.platform;
      if (!platformMap.has(key)) {
        platformMap.set(key, { ...pr });
      } else {
        const existing = platformMap.get(key)!;
        // Merge content items
        const contentIds = new Set(existing.content_items.map((c) => `${c.platform}:${c.external_content_id}`));
        for (const item of pr.content_items) {
          const id = `${item.platform}:${item.external_content_id}`;
          if (!contentIds.has(id)) {
            existing.content_items.push(item);
            contentIds.add(id);
          }
        }
        // Merge creators
        const creatorIds = new Set(existing.creators.map((c) => `${c.platform}:${c.external_creator_id}`));
        for (const creator of pr.creators) {
          const id = `${creator.platform}:${creator.external_creator_id}`;
          if (!creatorIds.has(id)) {
            existing.creators.push(creator);
            creatorIds.add(id);
          }
        }
        // Merge errors
        existing.errors.push(...pr.errors);
      }
    }
  }
  return [...platformMap.values()];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseHotTopicsResult {
  loading: boolean;
  error: string | null;
  searched: boolean;
  topics: TopicRankingItem[];
  news: NewsSearchResult | null;
  cnIndexed: NewsSearchResult | null;
  platformResults: PlatformCollectResult[];
  creatorCount: number;
  contentCount: number;
  /** Progress: { completed, total } during batch search */
  batchProgress: { completed: number; total: number } | null;
  search: (query: string, platforms?: SupportedPlatform[]) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook to handle hot topics search with batch splitting,
 * parallel requests, merge/dedup, and state management.
 */
export function useHotTopics(): UseHotTopicsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [topics, setTopics] = useState<TopicRankingItem[]>([]);
  const [news, setNews] = useState<NewsSearchResult | null>(null);
  const [cnIndexed, setCnIndexed] = useState<NewsSearchResult | null>(null);
  const [platformResults, setPlatformResults] = useState<PlatformCollectResult[]>([]);
  const [creatorCount, setCreatorCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);
  const abortRef = useRef(false);

  const search = useCallback(async (query: string, platforms: SupportedPlatform[] = ["YOUTUBE", "X"]) => {
    if (!query.trim()) return;

    // Split OR query into individual keywords, then batch
    const keywords = query
      .split(/\s+OR\s+/i)
      .map((k) => k.trim())
      .filter(Boolean);

    // Check cache first (using sorted keywords as key)
    const cacheKey = makeCacheKey([...keywords].sort().join(" OR "), platforms);
    const cached = getCached<HotTopicsSearchResult>(cacheKey);

    if (cached) {
      setTopics(toTopicRankingItems(cached.topics));
      setNews(cached.news);
      setCnIndexed(cached.cn_indexed ?? null);
      setPlatformResults(cached.platform_results ?? []);
      setCreatorCount(cached.creators.length);
      setContentCount(cached.content_items.length);
      setSearched(true);
      setError(null);
      setBatchProgress(null);
      return;
    }

    const batches = splitIntoBatches(keywords);
    setLoading(true);
    setError(null);
    abortRef.current = false;
    setBatchProgress({ completed: 0, total: batches.length });

    try {
      // Fire all batches in parallel using allSettled
      const batchPromises = batches.map(async (batch, idx) => {
        const batchQuery = batchToQuery(batch);
        const result = await apiClient.post<HotTopicsSearchResult>(
          "/api/research/hot-topics",
          { query: batchQuery, platforms, mockMode: false },
        );
        // Update progress
        if (!abortRef.current) {
          setBatchProgress((prev) =>
            prev ? { ...prev, completed: prev.completed + 1 } : { completed: idx + 1, total: batches.length },
          );
        }
        return result;
      });

      const settled = await Promise.allSettled(batchPromises);
      if (abortRef.current) return;

      const successResults: HotTopicsSearchResult[] = [];
      const batchErrors: string[] = [];

      for (let i = 0; i < settled.length; i++) {
        const s = settled[i];
        if (s.status === "fulfilled") {
          successResults.push(s.value);
        } else {
          const msg = s.reason instanceof ApiError ? s.reason.message : `批次 ${i + 1} 搜索失败`;
          batchErrors.push(msg);
        }
      }

      if (successResults.length === 0) {
        throw new Error(batchErrors.join("; ") || "所有批次搜索均失败");
      }

      // Merge results
      const mergedNewsItems = mergeNewsItems(successResults.map((r) => r.news));
      const mergedCnItems = mergeNewsItems(successResults.map((r) => r.cn_indexed));
      const mergedTopics = mergeTopics(successResults);
      const mergedPlatforms = mergePlatformResults(successResults);

      // Build merged NewsSearchResult wrappers
      const mergedNews: NewsSearchResult = {
        provider: successResults[0].news.provider,
        mode: successResults[0].news.mode,
        success: true,
        items: mergedNewsItems,
        errors: successResults.flatMap((r) => r.news.errors ?? []),
        fetched_at: new Date().toISOString(),
      };

      const mergedCnIndexed: NewsSearchResult = {
        provider: successResults[0].cn_indexed?.provider ?? "GOOGLE",
        mode: successResults[0].cn_indexed?.mode ?? "live",
        success: true,
        items: mergedCnItems,
        errors: successResults.flatMap((r) => r.cn_indexed?.errors ?? []),
        fetched_at: new Date().toISOString(),
      };

      // Merge creators/content for counts
      const creatorMap = new Map<string, unknown>();
      const contentMap = new Map<string, unknown>();
      for (const r of successResults) {
        for (const c of r.creators) creatorMap.set(`${c.platform}:${c.external_creator_id}`, c);
        for (const c of r.content_items) contentMap.set(`${c.platform}:${c.external_content_id}`, c);
      }

      // Build a merged result for caching
      const merged: HotTopicsSearchResult = {
        success: true,
        query,
        platforms,
        topics: mergedTopics,
        creators: [...creatorMap.values()] as HotTopicsSearchResult["creators"],
        content_items: [...contentMap.values()] as HotTopicsSearchResult["content_items"],
        news: mergedNews,
        cn_indexed: mergedCnIndexed,
        platform_results: mergedPlatforms,
        fetched_at: new Date().toISOString(),
      };

      setCache(cacheKey, merged);

      setTopics(toTopicRankingItems(mergedTopics));
      setNews(mergedNews);
      setCnIndexed(mergedCnIndexed);
      setPlatformResults(mergedPlatforms);
      setCreatorCount(creatorMap.size);
      setContentCount(contentMap.size);
      setSearched(true);

      if (batchErrors.length > 0) {
        setError(`部分批次失败: ${batchErrors.join("; ")}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "搜索失败，请重试");
      setTopics([]);
      setNews(null);
      setCnIndexed(null);
      setPlatformResults([]);
      setCreatorCount(0);
      setContentCount(0);
      setSearched(true);
    } finally {
      setLoading(false);
      setBatchProgress(null);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setLoading(false);
    setError(null);
    setSearched(false);
    setTopics([]);
    setNews(null);
    setCnIndexed(null);
    setPlatformResults([]);
    setCreatorCount(0);
    setContentCount(0);
    setBatchProgress(null);
  }, []);

  return {
    loading,
    error,
    searched,
    topics,
    news,
    cnIndexed,
    platformResults,
    creatorCount,
    contentCount,
    batchProgress,
    search,
    reset,
  };
}
