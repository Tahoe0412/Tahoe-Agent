"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Flame, Loader2, X, Zap, AlertTriangle, Radar } from "lucide-react";
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

  /* ── Material basket computed groups ── */
  const allSelected = Array.from(selectedNews.values());
  const factItems = allSelected.filter((i) => i.source_type !== "trend_signal");
  const trendItems = allSelected.filter((i) => i.source_type === "trend_signal");
  const hasFactItems = factItems.length > 0;

  const handleGenerateScript = useCallback(async () => {
    if (!hasFactItems) return;
    const items = Array.from(selectedNews.values());
    const query = selectedKeywords.map((k) => k.text).join(" OR ") || "热点新闻";
    const result = await generateScript(query, items);
    if (result?.projectId) {
      router.push(`/script-lab?projectId=${result.projectId}`);
    }
  }, [selectedNews, selectedKeywords, hasFactItems, generateScript, router]);

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
                  ? t ? "点击关键词可勾选 · 请选中至少一个" : "Click keywords to select · At least one required"
                  : selectedKeywords.length <= 3
                    ? `${t ? "搜索" : "Search"}: ${selectedKeywords.map((k) => k.text).join("、")}`
                    : t
                      ? `点击关键词可勾选 · 搜索 ${selectedKeywords.length} 个关键词 · 分 ${Math.ceil(selectedKeywords.length / 3)} 批执行`
                      : `Click to toggle · ${selectedKeywords.length} keywords · ${Math.ceil(selectedKeywords.length / 3)} batches`}
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
          <>
            {/* Compact source warnings (if any) */}
            {(mockPlatforms.length > 0 || failedPlatforms.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {mockPlatforms.length > 0 && (
                  <span className="rounded-full bg-[var(--warn-bg)] px-3 py-1 text-[var(--warn-text)]">
                    {t ? `${mockPlatforms.join(" / ")} 返回 mock 数据` : `${mockPlatforms.join(" / ")} mock data`}
                  </span>
                )}
                {failedPlatforms.length > 0 && (
                  <span className="rounded-full bg-[var(--danger-bg)] px-3 py-1 text-[var(--danger-text)]">
                    {t ? `${failedPlatforms.map((p) => p.platform).join(" / ")} 请求失败` : `${failedPlatforms.map((p) => p.platform).join(" / ")} failed`}
                  </span>
                )}
              </div>
            )}

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {newsResult ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-3)]">
                    {t ? "Google 新闻样本" : "Google News Samples"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      newsResult.success && newsResult.mode === "live"
                        ? "bg-[var(--ok-bg)] text-[var(--ok-text)]"
                        : newsResult.mode === "mock"
                          ? "bg-[var(--warn-bg)] text-[var(--warn-text)]"
                          : "bg-[var(--danger-bg)] text-[var(--danger-text)]",
                    )}
                  >
                    {newsResult.mode === "live" ? "live" : newsResult.mode} · {newsResult.items.length}
                  </span>
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

            {/* CN indexed evidence */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-3)]">
                  {t ? "国内热点证据" : "China Indexed Evidence"}
                </span>
                {cnIndexed ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      cnIndexed.success && cnIndexed.mode === "live"
                        ? "bg-[var(--ok-bg)] text-[var(--ok-text)]"
                        : cnIndexed.mode === "mock"
                          ? "bg-[var(--warn-bg)] text-[var(--warn-text)]"
                          : "bg-[var(--danger-bg)] text-[var(--danger-text)]",
                    )}
                  >
                    {cnIndexed.mode === "live" ? "live" : cnIndexed.mode} · {cnIndexed.items.length}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {cnIndexed && cnIndexed.items.length > 0 ? (
                  cnIndexed.items.slice(0, 12).map((item) => {
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
                  })
                ) : (
                  <div className="text-xs leading-6 text-[var(--text-3)]">
                    {t ? "暂无国内热点证据。" : "No China indexed results."}
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
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
                {/* + 选题参考 button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNewsItem({
                      id: `trend_${topic.topicKey}`,
                      title: topic.label,
                      url: topic.topEvidence[0]?.url ?? "",
                      snippet: `趋势信号: ${topic.sourcePlatforms.join(" / ")} 热度 ${topic.score} · ${topic.topEvidence.slice(0, 3).map((e) => e.title).join(" / ")}`,
                      source: topic.sourcePlatforms.join(" / "),
                      source_type: "trend_signal",
                      published_at: "",
                    });
                  }}
                  className={cn(
                    "mt-3 w-full rounded-lg py-1.5 text-xs font-medium transition",
                    selectedNews.has(`trend_${topic.topicKey}`)
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30"
                      : "bg-[var(--surface-solid)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]",
                  )}
                >
                  {selectedNews.has(`trend_${topic.topicKey}`)
                    ? (t ? "✓ 已加入选题参考" : "✓ Added")
                    : (t ? "+ 选题参考" : "+ Add as reference")}
                </button>
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

      {/* ── Material Basket ── */}
      {selectedNews.size > 0 && (
        <section className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--surface-solid)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                <FileText className="size-4 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-1)]">
                  {t ? "🧰 本次素材" : "🧰 Materials"}
                </h3>
                <p className="text-xs text-[var(--text-3)]">
                  {t
                    ? `${factItems.length} 条事实素材 · ${trendItems.length} 条选题参考`
                    : `${factItems.length} facts · ${trendItems.length} trends`}
                </p>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-[var(--text-3)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-1)]"
            >
              <X className="size-3" />
              {t ? "清空" : "Clear"}
            </button>
          </div>

          {/* Fact items */}
          {factItems.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-2)]">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600">
                  <FileText className="size-3" />
                  {t ? "事实素材" : "Facts"}
                </span>
                <span className="text-[var(--text-3)]">{t ? "— 作为脚本主体内容" : "— script body content"}</span>
              </div>
              <div className="space-y-1.5">
                {factItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-1)]">{item.title}</span>
                    <span className="shrink-0 rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)]">{item.source}</span>
                    <button
                      onClick={() => toggleNewsItem(item)}
                      className="shrink-0 rounded p-0.5 text-[var(--text-3)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--danger-text)]"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend items */}
          {trendItems.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-2)]">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-600">
                  <Radar className="size-3" />
                  {t ? "选题参考" : "Trends"}
                </span>
                <span className="text-[var(--text-3)]">{t ? "— 影响角度和叙事框架，不作事实引用" : "— framing only, not cited as fact"}</span>
              </div>
              <div className="space-y-1.5">
                {trendItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg bg-violet-500/5 border border-violet-500/10 px-3 py-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-violet-500" />
                    <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-1)]">{item.title}</span>
                    <span className="shrink-0 rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)]">{item.source}</span>
                    <button
                      onClick={() => toggleNewsItem(item)}
                      className="shrink-0 rounded p-0.5 text-[var(--text-3)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--danger-text)]"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate CTA */}
          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
            {!hasFactItems && trendItems.length > 0 ? (
              <span className="text-xs text-[var(--warn-text)]">
                {t ? "至少添加 1 条事实素材后才能生成脚本" : "Add at least 1 fact item to generate"}
              </span>
            ) : (
              <span className="text-xs text-[var(--text-3)]">
                {t ? "将基于事实素材撰写脚本，参考选题方向调整角度" : "Script based on facts, informed by trend signals"}
              </span>
            )}
            <button
              onClick={handleGenerateScript}
              disabled={generatingScript || !hasFactItems}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
                generatingScript
                  ? "bg-[var(--accent)]/60 cursor-wait"
                  : !hasFactItems
                    ? "bg-[var(--text-3)]/30 cursor-not-allowed"
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
            <div className="mt-3 rounded-xl border border-[var(--danger-text)]/20 bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger-text)]">
              {generateError}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
