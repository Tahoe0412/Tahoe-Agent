"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendSearchBar } from "@/components/trend-discovery/trend-search-bar";
import { TopicRankingList } from "@/components/trend-discovery/topic-ranking-list";
import { apiClient, ApiError } from "@/lib/api-client";
import { toTopicRankingItems } from "@/types/trend-discovery";
import type { HotTopicsSearchResult, TopicRankingItem } from "@/types/trend-discovery";
import type { SupportedPlatform } from "@/types/platform-data";
import type { NewsSearchResult } from "@/types/news-search";

interface DiscoveryState {
  loading: boolean;
  error: string | null;
  searched: boolean;
  query: string;
  topics: TopicRankingItem[];
  news: NewsSearchResult | null;
  creatorCount: number;
  contentCount: number;
}

const INITIAL_STATE: DiscoveryState = {
  loading: false,
  error: null,
  searched: false,
  query: "",
  topics: [],
  news: null,
  creatorCount: 0,
  contentCount: 0,
};

export function TrendDiscoveryWorkbench() {
  const router = useRouter();
  const [state, setState] = useState<DiscoveryState>(INITIAL_STATE);

  const handleSearch = useCallback(async (query: string, platforms: SupportedPlatform[]) => {
    setState((prev) => ({ ...prev, loading: true, error: null, query }));

    try {
      const result = await apiClient.post<HotTopicsSearchResult>(
        "/api/research/hot-topics",
        { query, platforms, mockMode: true },
      );

      setState({
        loading: false,
        error: null,
        searched: true,
        query,
        topics: toTopicRankingItems(result.topics),
        news: result.news,
        creatorCount: result.creators.length,
        contentCount: result.content_items.length,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof ApiError ? err.message : "搜索失败，请重试",
        searched: true,
      }));
    }
  }, []);

  const handleCreateProject = useCallback(
    (topicKey: string, label: string) => {
      // Navigate to create-project with pre-filled data
      const params = new URLSearchParams({
        topic: state.query || label,
        title: label,
      });
      router.push(`/?prefill=true&${params.toString()}`);
    },
    [router, state.query],
  );

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-6">
        <div className="mb-4">
          <div className="text-lg font-semibold text-[var(--text-1)]">热点发现</div>
          <div className="mt-1 text-sm text-[var(--text-3)]">
            输入关键词，系统从 YouTube、X 等平台聚合热点话题，30 秒内决定今天发什么
          </div>
        </div>
        <TrendSearchBar
          onSearch={handleSearch}
          loading={state.loading}
        />
      </div>

      {/* Stats summary (after search) */}
      {state.searched && !state.loading && !state.error && state.topics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="热点话题" value={state.topics.length} />
          <StatCard label="相关博主" value={state.creatorCount} />
          <StatCard label="内容样本" value={state.contentCount} />
          <StatCard label="新闻来源" value={state.news?.items.length ?? 0} />
        </div>
      )}

      {/* Ranking list */}
      <TopicRankingList
        items={state.topics}
        loading={state.loading}
        error={state.error}
        searched={state.searched}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-center">
      <div className="text-xl font-bold text-[var(--text-1)]">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--text-3)]">{label}</div>
    </div>
  );
}
