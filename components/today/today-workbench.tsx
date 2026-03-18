"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Flame,
  AlertTriangle,
  Check,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import { useHotTopics } from "@/hooks/use-hot-topics";
import { useGenerateScript } from "@/hooks/use-generate-script";
import { TodayQuickActions } from "./today-quick-actions";
import { TodayRecentProjects, type RecentProject } from "./today-recent-projects";
import type { TopicRankingItem } from "@/types/trend-discovery";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────
   Selectable news item shape
   ──────────────────────────────────────────── */

interface SelectableNewsItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  source_type: string;
  published_at: string;
}

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface BrandKeywordProfile {
  id: string;
  name: string;
  keywords: string[];
}

/* ────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────── */

export function TodayWorkbench({
  brandProfiles = [],
  recentProjects = [],
  locale = "zh",
  workspaceDataUnavailable = false,
}: {
  brandProfiles?: BrandKeywordProfile[];
  recentProjects?: RecentProject[];
  locale?: "zh" | "en";
  workspaceDataUnavailable?: boolean;
}) {
  const router = useRouter();
  const [activeBrandId, setActiveBrandId] = useState(
    brandProfiles[0]?.id ?? ""
  );
  const activeBrand =
    brandProfiles.find((b) => b.id === activeBrandId) ?? null;

  const {
    loading,
    error,
    searched,
    topics,
    news: newsResult,
    cnIndexed,
    platformResults,
    batchProgress,
    search: handleSearch,
  } = useHotTopics();

  const [selectedTopic, setSelectedTopic] = useState<TopicRankingItem | null>(null);

  /* ── Keyword pool state ── */
  interface KeywordItem { text: string; selected: boolean }
  const [keywords, setKeywords] = useState<KeywordItem[]>(
    () => (activeBrand?.keywords ?? []).map((k) => ({ text: k, selected: true }))
  );
  const selectedKeywords = keywords.filter((k) => k.selected);
  const searchQuery = selectedKeywords.map((k) => k.text).join(" OR ");

  /* ── News selection state ── */
  const [selectedNews, setSelectedNews] = useState<Map<string, SelectableNewsItem>>(new Map());
  const { generate: generateScript, loading: generatingScript, error: generateError } = useGenerateScript();

  const toggleNewsItem = useCallback((item: SelectableNewsItem) => {
    setSelectedNews((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNews(new Map());
  }, []);

  const handleGenerateScript = useCallback(async () => {
    if (selectedNews.size === 0) return;
    const items = Array.from(selectedNews.values());
    const query = selectedKeywords.map((k) => k.text).join(" OR ") || "热点新闻";
    const result = await generateScript(query, items);
    if (result?.projectId) {
      router.push(`/script-lab?projectId=${result.projectId}`);
    }
  }, [selectedNews, selectedKeywords, generateScript, router]);

  // No auto-search — user clicks "搜索" to start
  const t = locale === "zh";
  const mockPlatforms = platformResults
    .filter((item) => item.mode === "mock")
    .map((item) => item.platform);
  const failedPlatforms = platformResults.filter((item) => !item.success);
  const newsErrors = newsResult?.errors ?? [];
  const newsFailed = newsResult ? !newsResult.success : false;
  const sourceFailureMessages = [
    ...newsErrors.map((item) =>
      t ? `Google 新闻：${item.message}` : `Google News: ${item.message}`
    ),
    ...failedPlatforms.flatMap((item) =>
      item.errors.map((err) =>
        t ? `${item.platform}：${err.message}` : `${item.platform}: ${err.message}`
      )
    ),
  ];
  const hasSourceFailures = newsFailed || failedPlatforms.length > 0;
  const emptyDueToSourceFailure =
    searched &&
    !loading &&
    !error &&
    topics.length === 0 &&
    hasSourceFailures;

  return (
    <div className="space-y-6">
      {/* ── Block 1: 热点发现 ── */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
              <Flame className="size-5 text-[var(--accent-strong)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-1)] tracking-tight">
                {t ? "今日热点" : "Today's Hot Topics"}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--text-2)]">
                {t
                  ? "看热点、选题、产出 — 一页搞定。"
                  : "Discover trends, define topics, and generate content — all in one page."}
              </p>
            </div>
          </div>
        </div>

        {workspaceDataUnavailable ? (
          <div className="mb-5 rounded-xl border border-[color:color-mix(in_srgb,var(--warn-text)_28%,transparent)] bg-[var(--warn-bg)] px-4 py-3 text-sm leading-6 text-[var(--warn-text)]">
            {t
              ? "当前品牌关键词池和最近项目列表暂时没有从数据库成功读取，但你仍然可以手动输入关键词搜索热点。"
              : "Brand keyword pools and recent projects could not be loaded from the database right now, but you can still search with manual keywords."}
          </div>
        ) : brandProfiles.length === 0 ? (
          <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-2)]">
            {t
              ? "还没有可用的品牌关键词池。你可以先手动输入关键词搜索，或稍后去品牌档案里补充关键词池。"
              : "No brand keyword pool is available yet. You can search manually now, or add one later in Brand Profiles."}
          </div>
        ) : null}

        {/* ── Command Center: 3-layer keyword pool ── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] shadow-[0_2px_4px_rgba(15,23,32,0.02)]">
          {/* Layer 1: Pool control + count */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border)]">
            {brandProfiles.length > 0 ? (
              <div className="relative flex shrink-0 items-center">
                <select
                  value={activeBrandId}
                  onChange={(e) => {
                    setActiveBrandId(e.target.value);
                    const brand = brandProfiles.find((b) => b.id === e.target.value);
                    if (brand) {
                      setKeywords(brand.keywords.map((k) => ({ text: k, selected: true })));
                    }
                  }}
                  className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] py-1.5 pl-2.5 pr-7 text-xs font-medium text-[var(--text-1)] outline-none cursor-pointer transition-colors hover:border-[var(--accent)]/40"
                >
                  {brandProfiles.map((b) => (
                    <option key={b.id} value={b.id}>
                      {t ? "词池:" : "Pool:"} {b.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 flex items-center text-[var(--text-3)]">
                  <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-3)]">
                {t ? "手动添加关键词" : "Add keywords manually"}
              </span>
            )}
            <span className="text-xs text-[var(--text-3)] tabular-nums">
              {keywords.length > 0
                ? t
                  ? `已选 ${selectedKeywords.length} / ${keywords.length} 个关键词`
                  : `${selectedKeywords.length} / ${keywords.length} selected`
                : t
                  ? "暂无关键词"
                  : "No keywords"}
            </span>
          </div>

          {/* Layer 2: Keyword tags + inline add */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            {keywords.map((kw, i) => (
              <span
                key={`${kw.text}-${i}`}
                className={cn(
                  "group inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none",
                  kw.selected
                    ? "border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--text-1)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "border-[var(--border)] bg-transparent text-[var(--text-3)]"
                )}
                onClick={() => {
                  setKeywords((prev) =>
                    prev.map((k, j) =>
                      j === i ? { ...k, selected: !k.selected } : k
                    )
                  );
                }}
                title={kw.selected ? (t ? "点击取消选中" : "Click to deselect") : (t ? "点击选中" : "Click to select")}
              >
                {kw.text}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setKeywords((prev) => prev.filter((_, j) => j !== i));
                  }}
                  className="ml-1.5 opacity-0 group-hover:opacity-100 text-[var(--text-3)] hover:text-[var(--danger-text)] transition-all"
                  aria-label={`Delete ${kw.text}`}
                >
                  ×
                </button>
              </span>
            ))}

            {/* Inline add input */}
            <input
              type="text"
              onKeyDown={(e) => {
                const input = e.currentTarget;
                const val = input.value.trim();
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (val) {
                    // Deduplicate
                    if (!keywords.some((k) => k.text === val)) {
                      setKeywords((prev) => [...prev, { text: val, selected: true }]);
                    }
                    input.value = "";
                  } else if (selectedKeywords.length > 0) {
                    // Enter on empty → trigger search
                    void handleSearch(selectedKeywords.map((k) => k.text).join(" OR "));
                  }
                }
              }}
              placeholder={
                keywords.length > 0
                  ? t ? "输入新关键词，回车添加" : "Type and press Enter"
                  : t ? "输入关键词，回车添加…" : "Type keyword and press Enter…"
              }
              className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none"
              spellCheck={false}
            />
          </div>

          {/* Layer 3: Search action */}
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
            <span className="text-xs text-[var(--text-3)] truncate max-w-[70%]">
              {loading && batchProgress
                ? t
                  ? `正在搜索… (${batchProgress.completed}/${batchProgress.total} 批完成)`
                  : `Searching… (${batchProgress.completed}/${batchProgress.total} batches)`
                : selectedKeywords.length === 0
                  ? t ? "请选中至少一个关键词" : "Select at least one keyword"
                  : selectedKeywords.length <= 3
                    ? `${t ? "搜索" : "Search"}: ${selectedKeywords.map((k) => k.text).join("、")}`
                    : t
                      ? `搜索 ${selectedKeywords.length} 个关键词 · 分 ${Math.ceil(selectedKeywords.length / 3)} 批执行`
                      : `${selectedKeywords.length} keywords · ${Math.ceil(selectedKeywords.length / 3)} batches`}
            </span>
            <button
              onClick={() => {
                const q = selectedKeywords.map((k) => k.text).join(" OR ");
                void handleSearch(q);
              }}
              disabled={loading || selectedKeywords.length === 0}
              className="flex items-center justify-center rounded-lg bg-[var(--text-1)] px-5 py-1.5 text-sm font-medium tracking-wide text-[var(--surface-solid)] transition-colors hover:bg-[var(--text-2)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? (
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )
                : t
                  ? "搜索"
                  : "Search"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
            {error}
          </div>
        )}

        {searched && !loading && (platformResults.length > 0 || newsResult) ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-3)]">
                {t ? "数据源状态" : "Source Status"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {platformResults.map((item) => (
                  <span
                    key={item.platform}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium",
                      item.success && item.mode === "live"
                        ? "bg-[var(--ok-bg)] text-[var(--ok-text)]"
                        : item.mode === "mock"
                          ? "bg-[var(--warn-bg)] text-[var(--warn-text)]"
                          : "bg-[var(--danger-bg)] text-[var(--danger-text)]"
                    )}
                  >
                    {item.platform} · {item.mode}
                  </span>
                ))}
                {newsResult ? (
                  <span
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium",
                      newsResult.success && newsResult.mode === "live"
                        ? "bg-[var(--ok-bg)] text-[var(--ok-text)]"
                        : newsResult.mode === "mock"
                          ? "bg-[var(--warn-bg)] text-[var(--warn-text)]"
                          : "bg-[var(--danger-bg)] text-[var(--danger-text)]"
                    )}
                  >
                    Google News · {newsResult.mode}
                  </span>
                ) : null}
              </div>
              {mockPlatforms.length > 0 ? (
                <div className="mt-3 text-xs leading-6 text-[var(--warn-text)]">
                  {t
                    ? `当前 ${mockPlatforms.join(" / ")} 仍在返回 mock 数据，热点卡片会受影响。`
                    : `${mockPlatforms.join(" / ")} is still returning mock data, so topic quality will be affected.`}
                </div>
              ) : null}
              {failedPlatforms.length > 0 ? (
                <div className="mt-2 text-xs leading-6 text-[var(--danger-text)]">
                  {t
                    ? `以下平台请求失败：${failedPlatforms.map((item) => item.platform).join(" / ")}`
                    : `These platforms failed: ${failedPlatforms.map((item) => item.platform).join(" / ")}`}
                </div>
              ) : null}
            </div>

            {newsResult ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-3)]">
                  {t ? "Google 新闻样本" : "Google News Samples"}
                </div>
                <div className="mt-3 space-y-2">
                  {newsResult.items.slice(0, 5).map((item) => {
                    const selectable: SelectableNewsItem = {
                      id: item.id,
                      title: item.title,
                      url: item.url,
                      snippet: item.snippet ?? "",
                      source: item.source ?? "Google News",
                      source_type: item.source_type ?? "google_news",
                      published_at: item.published_at ?? "",
                    };
                    const isSelected = selectedNews.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group flex items-start gap-3 rounded-xl border bg-[var(--surface-solid)] px-3 py-3 transition cursor-pointer",
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm"
                            : "border-[var(--border)] hover:border-[var(--accent)]/40",
                        )}
                        onClick={() => toggleNewsItem(selectable)}
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                              : "border-[var(--text-3)]/30 group-hover:border-[var(--accent)]/50",
                          )}
                        >
                          {isSelected && <Check className="size-3" strokeWidth={3} />}
                        </div>
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[var(--text-1)]">{item.title}</div>
                          <div className="mt-1 text-xs leading-5 text-[var(--text-3)]">{item.snippet}</div>
                        </div>
                        {/* External link */}
                        <a href={item.url} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] text-[var(--text-3)] hover:text-[var(--accent)] transition" onClick={(e) => e.stopPropagation()}>↗</a>
                      </div>
                    );
                  })}
                  {newsResult.items.length === 0 ? (
                    <div className="text-xs leading-6 text-[var(--text-3)]">
                      {t ? "当前没有拿到新闻结果。" : "No news results were returned."}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* CN indexed evidence: 中文新闻 + 抖音/小红书索引 */}
            {cnIndexed && cnIndexed.items.length > 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-3)]">
                  {t ? "国内热点证据" : "China Indexed Evidence"}
                  <span className="ml-2 rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-normal text-[var(--accent)]">
                    {cnIndexed.items.length} 条
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {cnIndexed.items.slice(0, 12).map((item) => {
                    const selectable: SelectableNewsItem = {
                      id: item.id,
                      title: item.title,
                      url: item.url,
                      snippet: item.snippet ?? "",
                      source: item.source ?? "未知来源",
                      source_type: item.source_type ?? "cn_news",
                      published_at: item.published_at ?? "",
                    };
                    const isSelected = selectedNews.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group flex items-start gap-3 rounded-xl border bg-[var(--surface-solid)] px-3 py-3 transition cursor-pointer",
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm"
                            : "border-[var(--border)] hover:border-[var(--accent)]/40",
                        )}
                        onClick={() => toggleNewsItem(selectable)}
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                              : "border-[var(--text-3)]/30 group-hover:border-[var(--accent)]/50",
                          )}
                        >
                          {isSelected && <Check className="size-3" strokeWidth={3} />}
                        </div>
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-medium text-[var(--text-1)]">{item.title}</div>
                            <span className="shrink-0 rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)]">
                              {item.source}
                            </span>
                          </div>
                          {item.snippet ? (
                            <div className="mt-1 text-xs leading-5 text-[var(--text-3)]">{item.snippet}</div>
                          ) : null}
                        </div>
                        {/* External link */}
                        <a href={item.url} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] text-[var(--text-3)] hover:text-[var(--accent)] transition" onClick={(e) => e.stopPropagation()}>↗</a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

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
                  <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
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
        {emptyDueToSourceFailure ? (
          <div className="mt-5 rounded-xl border border-[var(--warn-text)]/20 bg-[var(--warn-bg)] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--warn-text)]/15 text-[var(--warn-text)]">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--warn-text)]">
                  {t ? "数据源需要处理" : "Source Attention Needed"}
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--text-1)]">
                  {t ? "今日热点暂时没有可用结果" : "No usable topic results right now"}
                </div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                  {t
                    ? "当前不是关键词没有命中，而是搜索源本身没有成功返回数据。先修复下面这些来源，再重新搜索。"
                    : "This is not just a weak keyword match. The connected sources did not return usable data, so fix them first and search again."}
                </div>
                <div className="mt-4 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                  {sourceFailureMessages.map((message) => (
                    <div key={message} className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.36)] px-3 py-2">
                      {message}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[rgba(255,255,255,0.3)] px-4 py-3 text-xs leading-6 text-[var(--text-3)]">
                  {t
                    ? "建议先去设置页补齐 X 凭据，确认服务器外网可访问 Google News，并适当放宽 YouTube 连接超时。"
                    : "Recommended next step: add X credentials in Settings, confirm the server can reach Google News, and relax the YouTube connector timeout if needed."}
                </div>
              </div>
            </div>
          </div>
        ) : searched && !loading && !error && topics.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-center text-sm text-[var(--text-3)]">
            {t
              ? "未找到相关热点话题，换个关键词试试"
              : "No trending topics found. Try different keywords."}
          </div>
        ) : null}
      </section>

      {/* ── Block 2: 快速操作 ── */}
      {selectedTopic && (
        <TodayQuickActions
          selectedTopic={selectedTopic}
          locale={locale}
          onAction={(topicLabel, _type) => {
            const params = new URLSearchParams({
              topic: topicLabel,
              title: topicLabel,
            });
            router.push(`/?prefill=true&${params.toString()}`);
          }}
        />
      )}

      {/* ── Block 3: 最近项目 ── */}
      <TodayRecentProjects
        projects={recentProjects}
        locale={locale}
        onProjectClick={(id) => router.push(`/?projectId=${id}`)}
      />

      {/* ── Floating Selection Bar ── */}
      {selectedNews.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center pb-5 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-solid)] px-5 py-3.5 shadow-[0_-6px_36px_rgba(0,0,0,0.12)] backdrop-blur-lg">
            {/* Selected count */}
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-1)]">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-xs font-bold">
                {selectedNews.size}
              </div>
              {t ? "条新闻已选" : "news selected"}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-[var(--border)]" />

            {/* Clear */}
            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-1)]"
            >
              <X className="size-3.5" />
              {t ? "清空" : "Clear"}
            </button>

            {/* Generate Script */}
            <button
              onClick={handleGenerateScript}
              disabled={generatingScript}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
                generatingScript
                  ? "bg-[var(--accent)]/60 cursor-wait"
                  : "bg-[var(--accent)] hover:bg-[var(--accent-strong)] shadow-md hover:shadow-lg",
              )}
            >
              {generatingScript ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              {generatingScript
                ? (t ? "正在生成…" : "Generating…")
                : (t ? "生成脚本" : "Generate Script")}
            </button>
          </div>

          {/* Error toast */}
          {generateError && (
            <div className="pointer-events-auto absolute bottom-20 rounded-xl border border-[var(--danger-text)]/20 bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger-text)] shadow-lg">
              {generateError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
