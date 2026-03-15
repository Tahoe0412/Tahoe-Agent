import { Loader2, SearchX } from "lucide-react";
import { TopicRankingCard } from "@/components/trend-discovery/topic-ranking-card";
import type { TopicRankingItem } from "@/types/trend-discovery";

interface TopicRankingListProps {
  items: TopicRankingItem[];
  loading?: boolean;
  error?: string | null;
  searched?: boolean;
  onCreateProject?: (topicKey: string, label: string) => void;
}

export function TopicRankingList({
  items,
  loading = false,
  error = null,
  searched = false,
  onCreateProject,
}: TopicRankingListProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="size-6 animate-spin text-[var(--accent)]" />
        <div className="text-sm text-[var(--text-3)]">正在搜索多个平台，请稍候...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-[22px] border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
        <div className="text-sm font-medium text-red-600 dark:text-red-400">搜索出错</div>
        <div className="mt-1 text-xs text-red-500/80 dark:text-red-400/60">{error}</div>
      </div>
    );
  }

  // Empty state (after search)
  if (searched && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <SearchX className="size-8 text-[var(--text-3)]" />
        <div className="text-sm text-[var(--text-2)]">没有找到相关热点话题</div>
        <div className="text-xs text-[var(--text-3)]">试试换个关键词，或者增加搜索平台</div>
      </div>
    );
  }

  // Initial state (not searched yet)
  if (!searched) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="text-sm text-[var(--text-2)]">输入关键词开始搜索</div>
        <div className="text-xs text-[var(--text-3)]">系统将从多个平台聚合热点话题，帮你快速选题</div>
      </div>
    );
  }

  // Results
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <TopicRankingCard
          key={item.topicKey}
          item={item}
          onCreateProject={onCreateProject}
        />
      ))}
    </div>
  );
}
