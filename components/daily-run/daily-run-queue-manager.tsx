"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ExternalLink, 
  Star, 
  Loader2, 
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import { DailyRunSignalPanel } from "@/components/daily-run/daily-run-signal-panel";

interface DailyRunItem {
  id: string;
  run_date: string;
  account_direction: string;
  topic: string;
  status: string;
  project_id: string | null;
  error_message: string | null;
  retry_count: number;
  quality_score: number | null;
  is_best_pick: boolean;
  metadata: unknown;
  created_at: string;
  project?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface DailyRunStats {
  total: number;
  byStatus: Record<string, number>;
  byDirection: Record<string, { total: number; bestPick: boolean; avgQuality: number | null }>;
}

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

export function DailyRunQueueManager({
  initialItems,
  initialStats,
  locale = "zh",
}: {
  initialItems: DailyRunItem[];
  initialStats: DailyRunStats;
  locale?: "zh" | "en";
}) {
  const [items, setItems] = useState<DailyRunItem[]>(initialItems);
  const [stats, setStats] = useState<DailyRunStats>(initialStats);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll state
  const pollIntervalRef = useRef<number | null>(null);

  const fetchQueueAndStats = useCallback(async () => {
    try {
      const dateStr = getLocalDateString();
      const [queueRes, statsRes] = await Promise.all([
        fetch(`/api/daily-run/queue?date=${dateStr}`),
        fetch(`/api/daily-run/stats?date=${dateStr}`),
      ]);

      if (queueRes.ok && statsRes.ok) {
        const queueData = await queueRes.json();
        const statsData = await statsRes.json();
        if (queueData.success && Array.isArray(queueData.data)) {
          setItems(queueData.data);
        }
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch daily run queue data:", err);
    }
  }, []);

  // Check if any items are in progress
  const hasInProgressItems = items.some(
    (item) => item.status === "DRAFTING" || item.status === "PACKAGING" || item.status === "DRAFT_READY"
  );

  // Setup polling
  useEffect(() => {
    if (hasInProgressItems) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = window.setInterval(() => {
          void fetchQueueAndStats();
        }, 4000);
      }
    } else {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [hasInProgressItems, fetchQueueAndStats]);

  const handleToggleBestPick = async (itemId: string) => {
    setActionPending(itemId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/daily-run/queue/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_best_pick" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchQueueAndStats();
      } else {
        throw new Error(data.error?.message || "Failed to mark best pick");
      }
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "设置今日首选失败");
    } finally {
      setActionPending(null);
    }
  };

  const handleStartGeneration = async (item: DailyRunItem) => {
    setActionPending(item.id);
    setErrorMessage(null);
    try {
      const metadata = (item.metadata as { materials?: unknown[]; worthiness?: unknown }) || {};
      const materials = metadata.materials || [];
      const worthiness = metadata.worthiness || null;

      if (!materials.length) {
        throw new Error("缺少素材信息，无法开始生成文章。");
      }

      // Transition queue item to DRAFTING status
      await fetch(`/api/daily-run/queue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "update_status", 
          status: "DRAFTING" 
        }),
      });

      // Call fast-package
      const res = await fetch("/api/daily-run/fast-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: item.topic,
          contentLine: "OWNED_MEDIA",
          editorialDirection: item.account_direction,
          platforms: ["TOUTIAO"],
          materials,
          generateStoryboard: true,
          deferPackaging: true,
          worthiness,
          dailyRunItemId: item.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchQueueAndStats();
      } else {
        throw new Error(data.error?.message || "启动生成失败");
      }
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "启动长文生成任务失败");
      // Set status back to failed
      await fetch(`/api/daily-run/queue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "update_status", 
          status: "FAILED",
          errorMessage: error.message || "启动生成任务时出错"
        }),
      });
      await fetchQueueAndStats();
    } finally {
      setActionPending(null);
    }
  };

  const handleRetry = async (itemId: string) => {
    setActionPending(itemId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/daily-run/queue/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedItem = data.data;
        // Trigger generation immediately on retry
        await handleStartGeneration(updatedItem);
      } else {
        throw new Error(data.error?.message || "重试请求失败");
      }
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "重试操作失败");
      setActionPending(null);
    }
  };

  // Group items by account direction
  const directions = ["AI快讯", "全球股市", "消费时尚"];
  const groupedItems = directions.reduce((acc, dir) => {
    acc[dir] = items.filter((item) => item.account_direction === dir);
    return acc;
  }, {} as Record<string, DailyRunItem[]>);

  const getStatusText = (status: string) => {
    switch (status) {
      case "TOPIC_SELECTED": return "选题就绪";
      case "DRAFTING": return "正文生成中";
      case "DRAFT_READY": return "正文就绪";
      case "PACKAGING": return "发布包生成中";
      case "PACKAGE_READY": return "发布包就绪";
      case "REVIEW_PASS": return "复核通过";
      case "PUBLISHED": return "已发布";
      case "FAILED": return "生成失败";
      default: return status;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-[var(--sage-soft)] text-[var(--ok-text)] border-[color:color-mix(in_srgb,var(--ok-text)_20%,transparent)]";
      case "PACKAGE_READY":
      case "REVIEW_PASS": return "bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[color:color-mix(in_srgb,var(--accent)_20%,transparent)]";
      case "FAILED": return "bg-[var(--danger-bg)] text-[var(--danger-text)] border-[color:color-mix(in_srgb,var(--danger-text)_20%,transparent)]";
      case "DRAFTING":
      case "PACKAGING": return "bg-[var(--surface-muted)] text-[var(--text-2)] border-[var(--border-soft)] animate-pulse";
      default: return "bg-[var(--surface-muted)] text-[var(--text-2)] border-[var(--border-soft)]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Hot Topics Panel */}
      <DailyRunSignalPanel locale={locale} onQueueUpdated={() => void fetchQueueAndStats()} />

      {errorMessage && (
        <div className="rounded-lg bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)] flex items-start gap-2 border border-[color:color-mix(in_srgb,var(--danger-text)_24%,transparent)]">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Daily Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-[var(--surface-solid)] border border-[var(--border-soft)] rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-[0.12em]">今日生成总数</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[var(--text-1)]">{items.length}</span>
            <span className="text-xs text-[var(--text-3)]">个选题包</span>
          </div>
        </div>
        {directions.map((dir) => {
          const dirStats = stats?.byDirection?.[dir] || { total: 0, bestPick: false, avgQuality: null };
          return (
            <div key={dir} className="bg-[var(--surface-solid)] border border-[var(--border-soft)] rounded-xl p-4 flex flex-col justify-between">
              <div className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-[0.12em]">{dir}</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[var(--text-1)]">{dirStats.total}</span>
                  <span className="text-xs text-[var(--text-3)]">稿件</span>
                </div>
                {dirStats.bestPick && (
                  <span className="inline-flex items-center gap-1 text-[var(--ok-text)] text-xs font-semibold">
                    <CheckCircle2 className="size-3.5" />
                    首选已选定
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Queue Grid Lanes */}
      <div className="grid gap-6 xl:grid-cols-3">
        {directions.map((dir) => {
          const dirItems = groupedItems[dir] || [];
          return (
            <PanelCard 
              key={dir} 
              title={dir} 
              description={`今日累计生成 ${dirItems.length} 个候选，选择最优的一篇打磨并导出。`}
            >
              <div className="space-y-3">
                {dirItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-3)] border border-dashed border-[var(--border-soft)] rounded-xl">
                    今天还没有在这个方向下生成任何选题
                  </div>
                ) : (
                  dirItems.map((item) => {
                    const isPending = actionPending === item.id;
                    const isInProgress = item.status === "DRAFTING" || item.status === "PACKAGING" || item.status === "DRAFT_READY";

                    return (
                      <div 
                        key={item.id} 
                        className={`border rounded-xl p-4 transition-all duration-150 relative ${
                          item.is_best_pick 
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]" 
                            : "border-[var(--border-soft)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                        }`}
                      >
                        {/* Best Pick Tag */}
                        {item.is_best_pick && (
                          <div className="absolute top-3.5 right-4 flex items-center gap-1 text-xs font-bold text-[var(--accent)]">
                            <Star className="size-3.5 fill-[var(--accent)]" />
                            今日首选
                          </div>
                        )}

                        <div className="pr-16">
                          <h4 className="font-semibold text-sm text-[var(--text-1)] line-clamp-2 leading-5">
                            {item.topic}
                          </h4>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(item.status)}`}>
                              {isInProgress && <Loader2 className="size-3 animate-spin shrink-0" />}
                              {getStatusText(item.status)}
                            </span>
                            {item.quality_score && (
                              <span className="text-xs text-[var(--text-3)]">
                                质量分: <span className="font-bold text-[var(--text-1)]">{item.quality_score}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Error Message if Failed */}
                        {item.status === "FAILED" && item.error_message && (
                          <div className="mt-3 p-2 bg-[var(--danger-bg)] rounded-lg text-xs text-[var(--danger-text)] leading-5">
                            {item.error_message}
                          </div>
                        )}

                        {/* Actions block */}
                        <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex flex-wrap items-center justify-between gap-2">
                          <div className="flex gap-2">
                            {/* Best Pick toggle button */}
                            {item.status !== "DRAFTING" && item.status !== "PACKAGING" && (
                              <button
                                onClick={() => void handleToggleBestPick(item.id)}
                                disabled={isPending}
                                className={`p-1.5 rounded-lg border transition ${
                                  item.is_best_pick 
                                    ? "bg-[var(--surface-solid)] text-[var(--accent)] border-[var(--border)] hover:bg-[var(--surface-muted)]" 
                                    : "bg-transparent text-[var(--text-3)] border-transparent hover:text-[var(--text-1)]"
                                }`}
                                title={item.is_best_pick ? "取消首选" : "设为首选"}
                              >
                                <Star className={`size-4 ${item.is_best_pick ? "fill-[var(--accent)]" : ""}`} />
                              </button>
                            )}

                            {/* Link to Script Lab final edit */}
                            {item.project_id && (
                              <a
                                href={`/script-lab?projectId=${item.project_id}`}
                                className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline border border-transparent px-2 py-1.5"
                              >
                                打磨文案
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {/* TOPIC_SELECTED: Start generation */}
                            {item.status === "TOPIC_SELECTED" && (
                              <Button
                                onClick={() => void handleStartGeneration(item)}
                                disabled={isPending}
                                variant="secondary"
                                className="h-8 text-xs px-2.5 rounded-lg flex items-center gap-1"
                              >
                                {isPending ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Play className="size-3 fill-current" />
                                )}
                                开始起稿
                              </Button>
                            )}

                            {/* FAILED: Retry */}
                            {item.status === "FAILED" && (
                              <Button
                                onClick={() => void handleRetry(item.id)}
                                disabled={isPending}
                                variant="secondary"
                                className="h-8 text-xs px-2.5 rounded-lg flex items-center gap-1"
                              >
                                {isPending ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="size-3" />
                                )}
                                重试
                              </Button>
                            )}

                            {/* PUBLISHED state indicator */}
                            {item.status === "PUBLISHED" && (
                              <span className="inline-flex items-center gap-1 text-xs text-[var(--ok-text)] font-semibold px-2 py-1">
                                <CheckCircle2 className="size-3.5" />
                                已分发
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </PanelCard>
          );
        })}
      </div>
    </div>
  );
}
