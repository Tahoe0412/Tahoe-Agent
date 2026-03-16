"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendSearchBar } from "@/components/trend-discovery/trend-search-bar";
import { TopicRankingList } from "@/components/trend-discovery/topic-ranking-list";
import { useHotTopics } from "@/hooks/use-hot-topics";

interface BrandKeywordProfile {
  id: string;
  name: string;
  keywords: string[];
}

export function TrendDiscoveryWorkbench({
  brandProfiles = [],
}: {
  brandProfiles?: BrandKeywordProfile[];
}) {
  const router = useRouter();
  const [activeBrandId, setActiveBrandId] = useState(brandProfiles[0]?.id ?? "");
  const activeBrand = brandProfiles.find((b) => b.id === activeBrandId) ?? null;
  
  const {
    loading,
    error,
    searched,
    topics,
    news,
    creatorCount,
    contentCount,
    search: handleSearch,
  } = useHotTopics();

  // No auto-search — user clicks "搜索热点" to start

  const handleCreateProject = useCallback(
    (topicKey: string, label: string) => {
      // Find the query used for this search by joining the active brand keywords 
      // or looking at the current search bar state (which we don't have direct access to here,
      // but we can pass 'label' as a fallback)
      const params = new URLSearchParams({
        topic: label, // We use label as the topic query now since we removed local search query tracking
        title: label,
      });
      router.push(`/?prefill=true&${params.toString()}`);
    },
    [router],
  );

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-[var(--text-1)]">热点发现</div>
            <div className="mt-1 text-sm text-[var(--text-3)]">
              {activeBrand
                ? `已加载「${activeBrand.name}」的关键词池，点击搜索热点开始`
                : "输入关键词，系统从 YouTube、X 等平台聚合热点话题"}
            </div>
          </div>
          {/* Brand selector */}
          {brandProfiles.length > 0 && (
            <select
              value={activeBrandId}
              onChange={(e) => {
                setActiveBrandId(e.target.value);
                const brand = brandProfiles.find((b) => b.id === e.target.value);
                if (brand && brand.keywords.length > 0) {
                  void handleSearch(brand.keywords.join(" "), ["YOUTUBE", "X"]);
                }
              }}
              className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-2)]"
            >
              {brandProfiles.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.keywords.length} 词)
                </option>
              ))}
            </select>
          )}
        </div>
        <TrendSearchBar
          onSearch={handleSearch}
          loading={loading}
          defaultQuery={activeBrand?.keywords.join(" ") ?? ""}
        />
      </div>

      {/* Stats summary (after search) */}
      {searched && !loading && !error && topics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="热点话题" value={topics.length} />
          <StatCard label="相关博主" value={creatorCount} />
          <StatCard label="内容样本" value={contentCount} />
          <StatCard label="新闻来源" value={news?.items.length ?? 0} />
        </div>
      )}

      {/* Ranking list */}
      <TopicRankingList
        items={topics}
        loading={loading}
        error={error}
        searched={searched}
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
