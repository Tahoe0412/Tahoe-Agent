"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  FileText,
  Clapperboard,
  ImageIcon,
  ArrowRight,
  Clock,
  Flame,
} from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { toTopicRankingItems } from "@/types/trend-discovery";
import type {
  HotTopicsSearchResult,
  TopicRankingItem,
} from "@/types/trend-discovery";
import type { SupportedPlatform } from "@/types/platform-data";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface BrandKeywordProfile {
  id: string;
  name: string;
  keywords: string[];
}

interface RecentProject {
  id: string;
  title: string;
  topic_query: string;
  status: string;
}

/* ────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────── */

export function TodayWorkbench({
  brandProfiles = [],
  recentProjects = [],
  locale = "zh",
}: {
  brandProfiles?: BrandKeywordProfile[];
  recentProjects?: RecentProject[];
  locale?: "zh" | "en";
}) {
  const router = useRouter();
  const [activeBrandId, setActiveBrandId] = useState(
    brandProfiles[0]?.id ?? ""
  );
  const activeBrand =
    brandProfiles.find((b) => b.id === activeBrandId) ?? null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicRankingItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicRankingItem | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState(
    activeBrand?.keywords.join(" ") ?? ""
  );
  const autoSearchFired = useRef(false);

  /* ── Search handler ── */
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setLoading(true);
      setError(null);
      setSelectedTopic(null);
      try {
        const result = await apiClient.post<HotTopicsSearchResult>(
          "/api/research/hot-topics",
          { query, platforms: ["YOUTUBE", "X"] as SupportedPlatform[], mockMode: true }
        );
        setTopics(toTopicRankingItems(result.topics));
        setSearched(true);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "搜索失败，请重试"
        );
        setSearched(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ── Auto-search on mount ── */
  useEffect(() => {
    if (autoSearchFired.current) return;
    if (!activeBrand || activeBrand.keywords.length === 0) return;
    autoSearchFired.current = true;
    const q = activeBrand.keywords.join(" ");
    setSearchQuery(q);
    void handleSearch(q);
  }, [activeBrand, handleSearch]);

  const t = locale === "zh";

  return (
    <div className="space-y-6">
      {/* ── Block 1: 热点发现 ── */}
      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <Flame className="size-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-1)]">
                {t ? "今日热点" : "Today's Hot Topics"}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--text-3)]">
                {activeBrand
                  ? t
                    ? `从「${activeBrand.name}」关键词池自动搜索`
                    : `Auto-searching from "${activeBrand.name}" keywords`
                  : t
                    ? "输入关键词手动搜索"
                    : "Enter keywords to search"}
              </p>
            </div>
          </div>
          {brandProfiles.length > 0 && (
            <select
              value={activeBrandId}
              onChange={(e) => {
                setActiveBrandId(e.target.value);
                const brand = brandProfiles.find(
                  (b) => b.id === e.target.value
                );
                if (brand && brand.keywords.length > 0) {
                  const q = brand.keywords.join(" ");
                  setSearchQuery(q);
                  void handleSearch(q);
                }
              }}
              className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-2)]"
            >
              {brandProfiles.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.keywords.length}{" "}
                  {t ? "关键词" : "keywords"})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search bar */}
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSearch(searchQuery);
            }}
            placeholder={
              t
                ? "输入关键词搜索热点话题..."
                : "Search trending topics..."
            }
            className="theme-input flex-1 rounded-2xl px-4 py-3 text-sm"
          />
          <button
            onClick={() => void handleSearch(searchQuery)}
            disabled={loading || !searchQuery.trim()}
            className="shrink-0 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? t
                ? "搜索中..."
                : "Searching..."
              : t
                ? "搜索"
                : "Search"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
              />
            ))}
          </div>
        )}

        {/* Topic cards */}
        {searched && !loading && topics.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic, index) => (
              <button
                key={topic.topicKey}
                onClick={() => setSelectedTopic(topic)}
                className={cn(
                  "group relative rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5",
                  selectedTopic?.topicKey === topic.topicKey
                    ? "border-[var(--accent)] bg-[var(--accent)]/8 shadow-lg"
                    : "border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent)]/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-xs font-bold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                    {t ? "热度" : "Heat"} {topic.score}
                  </span>
                </div>
                <div className="mt-3 text-sm font-semibold text-[var(--text-1)]">
                  {topic.label}
                </div>
                <div className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--text-3)]">
                  {topic.topEvidence.map((e) => e.title).join(" · ") || topic.label}
                </div>
                {selectedTopic?.topicKey === topic.topicKey && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                    <Zap className="size-3" />
                    {t ? "已选中 — 见下方快速操作" : "Selected — see quick actions below"}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {searched && !loading && !error && topics.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-center text-sm text-[var(--text-3)]">
            {t
              ? "未找到相关热点话题，换个关键词试试"
              : "No trending topics found. Try different keywords."}
          </div>
        )}
      </section>

      {/* ── Block 2: 快速操作 ── */}
      {selectedTopic && (
        <section className="rounded-[24px] border border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent)]/5 to-transparent p-6">
          <div className="mb-4 flex items-center gap-3">
            <Zap className="size-5 text-[var(--accent)]" />
            <div>
              <h3 className="text-base font-semibold text-[var(--text-1)]">
                {t ? "快速产出" : "Quick Actions"}
              </h3>
              <p className="text-sm text-[var(--text-3)]">
                {t
                  ? `选题：${selectedTopic.label} — 选择产出方式`
                  : `Topic: ${selectedTopic.label} — choose output type`}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Clapperboard,
                label: t ? "生成脚本" : "Generate Script",
                desc: t
                  ? "AI 拆解选题，输出可拍摄的分镜脚本"
                  : "AI breaks down the topic into a shootable script",
                color: "from-blue-500/20 to-cyan-500/20",
                textColor: "text-blue-400",
                action: () => {
                  const params = new URLSearchParams({
                    topic: selectedTopic.label,
                    title: selectedTopic.label,
                  });
                  router.push(`/?prefill=true&${params.toString()}`);
                },
              },
              {
                icon: FileText,
                label: t ? "生成文案" : "Generate Copy",
                desc: t
                  ? "围绕选题生成多平台推广文案"
                  : "Generate multi-platform marketing copy",
                color: "from-purple-500/20 to-pink-500/20",
                textColor: "text-purple-400",
                action: () => {
                  const params = new URLSearchParams({
                    topic: selectedTopic.label,
                    title: selectedTopic.label,
                  });
                  router.push(`/?prefill=true&${params.toString()}`);
                },
              },
              {
                icon: ImageIcon,
                label: t ? "AI 配图" : "AI Images",
                desc: t
                  ? "根据选题自动生成封面和配图"
                  : "Auto-generate cover and illustrations for the topic",
                color: "from-emerald-500/20 to-teal-500/20",
                textColor: "text-emerald-400",
                action: () => {
                  const params = new URLSearchParams({
                    topic: selectedTopic.label,
                    title: selectedTopic.label,
                  });
                  router.push(`/?prefill=true&${params.toString()}`);
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="group flex flex-col items-start rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg"
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br",
                    item.color
                  )}
                >
                  <item.icon className={cn("size-5", item.textColor)} />
                </div>
                <div className="mt-3 text-sm font-semibold text-[var(--text-1)]">
                  {item.label}
                </div>
                <div className="mt-1 text-xs leading-5 text-[var(--text-3)]">
                  {item.desc}
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  {t ? "开始" : "Start"} <ArrowRight className="size-3" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Block 3: 最近项目 ── */}
      {recentProjects.length > 0 && (
        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <Clock className="size-5 text-[var(--text-3)]" />
            <h3 className="text-base font-semibold text-[var(--text-1)]">
              {t ? "最近项目" : "Recent Projects"}
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.slice(0, 6).map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/?projectId=${project.id}`)}
                className="group flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[var(--text-1)]">
                    {project.title}
                  </div>
                  <div className="mt-1 truncate text-xs text-[var(--text-3)]">
                    {project.topic_query}
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    project.status === "DONE"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-blue-500/15 text-blue-400"
                  )}
                >
                  {project.status === "DONE"
                    ? t
                      ? "已完成"
                      : "Done"
                    : t
                      ? "进行中"
                      : "Active"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
