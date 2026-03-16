"use client";

import { useState, useCallback } from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import { getCached, setCache, makeCacheKey } from "@/lib/search-cache";
import { toTopicRankingItems } from "@/types/trend-discovery";
import type { HotTopicsSearchResult, TopicRankingItem } from "@/types/trend-discovery";
import type { PlatformCollectResult, SupportedPlatform } from "@/types/platform-data";
import type { NewsSearchResult } from "@/types/news-search";

export interface UseHotTopicsResult {
  loading: boolean;
  error: string | null;
  searched: boolean;
  topics: TopicRankingItem[];
  news: NewsSearchResult | null;
  platformResults: PlatformCollectResult[];
  creatorCount: number;
  contentCount: number;
  search: (query: string, platforms?: SupportedPlatform[]) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook to handle hot topics search, caching, and state management.
 * Extracts API logic and data formatting out of UI components.
 */
export function useHotTopics(): UseHotTopicsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [topics, setTopics] = useState<TopicRankingItem[]>([]);
  const [news, setNews] = useState<NewsSearchResult | null>(null);
  const [platformResults, setPlatformResults] = useState<PlatformCollectResult[]>([]);
  const [creatorCount, setCreatorCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);

  const search = useCallback(async (query: string, platforms: SupportedPlatform[] = ["YOUTUBE", "X"]) => {
    if (!query.trim()) return;

    // Check cache first — avoid redundant API calls within 10 minutes
    const cacheKey = makeCacheKey(query, platforms);
    const cached = getCached<HotTopicsSearchResult>(cacheKey);
    
    if (cached) {
      setTopics(toTopicRankingItems(cached.topics));
      setNews(cached.news);
      setPlatformResults(cached.platform_results ?? []);
      setCreatorCount(cached.creators.length);
      setContentCount(cached.content_items.length);
      setSearched(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.post<HotTopicsSearchResult>(
        "/api/research/hot-topics",
        { query, platforms, mockMode: false }
      );

      setCache(cacheKey, result);
      
      setTopics(toTopicRankingItems(result.topics));
      setNews(result.news);
      setPlatformResults(result.platform_results ?? []);
      setCreatorCount(result.creators.length);
      setContentCount(result.content_items.length);
      setSearched(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "搜索失败，请重试");
      setTopics([]);
      setNews(null);
      setPlatformResults([]);
      setCreatorCount(0);
      setContentCount(0);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSearched(false);
    setTopics([]);
    setNews(null);
    setPlatformResults([]);
    setCreatorCount(0);
    setContentCount(0);
  }, []);

  return {
    loading,
    error,
    searched,
    topics,
    news,
    platformResults,
    creatorCount,
    contentCount,
    search,
    reset,
  };
}
