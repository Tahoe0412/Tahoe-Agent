"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Loader2, Search, Sparkles, TrendingUp } from "lucide-react";
import { useHotTopics } from "@/hooks/use-hot-topics";
import { getEditorialDirectionPresets } from "@/lib/editorial-direction-presets";
import { apiRequest, explainClientError } from "@/lib/client-api";
import { scoreTopicForLongForm } from "@/lib/long-form-worthiness";
import type { OwnedMediaEditorialDirection } from "@/lib/owned-media-directions";
import type { NewsSearchItem } from "@/types/news-search";
import type { TopicRankingItem } from "@/types/trend-discovery";

type FastPackageResult = {
  projectId: string;
  scriptId: string;
  completed: number;
  failed: number;
  readiness: {
    status: "READY" | "NEEDS_REVIEW";
    score: number;
    message: string;
  };
  nextHref: string;
  packagingDeferred?: boolean;
};

type ScriptSourceItem = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  source_type: string;
  published_at: string;
};

function directionFromPresetId(presetId: "AI_GROWTH" | "MONEY_NEVER_SLEEPS" | "EASTERN_VITALITY"): OwnedMediaEditorialDirection {
  if (presetId === "MONEY_NEVER_SLEEPS") return "全球股市";
  if (presetId === "EASTERN_VITALITY") return "消费时尚";
  return "AI快讯";
}

function normalizeKeywordFragments(label: string) {
  return label
    .split(/[\s/、，,·\-–—:：()（）]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length >= 2);
}

function buildSourceItems(topic: TopicRankingItem, newsItems: NewsSearchItem[]): ScriptSourceItem[] {
  const fragments = normalizeKeywordFragments(topic.label);
  const matchedFacts = newsItems
    .filter((item) => {
      const haystack = `${item.title} ${item.snippet}`.toLowerCase();
      if (haystack.includes(topic.label.toLowerCase())) {
        return true;
      }
      return fragments.some((fragment) => haystack.includes(fragment));
    })
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      snippet: item.snippet,
      source: item.source,
      source_type: item.source_type ?? "news",
      published_at: item.published_at,
    }));

  const fallbackFacts = matchedFacts.length > 0
    ? matchedFacts
    : newsItems.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        source: item.source,
        source_type: item.source_type ?? "news",
        published_at: item.published_at,
      }));

  const trendSignals = topic.topEvidence.slice(0, 3).map((evidence, index) => ({
    id: `trend_${topic.topicKey}_${index + 1}`,
    title: evidence.title,
    url: evidence.url,
    snippet: `${evidence.platform} · ${evidence.viewCount.toLocaleString()} views`,
    source: evidence.platform,
    source_type: "trend_signal",
    published_at: "",
  }));

  return [...fallbackFacts, ...trendSignals];
}

export function DailyRunSignalPanel({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const router = useRouter();
  const presets = useMemo(() => getEditorialDirectionPresets(locale), [locale]);
  const [query, setQuery] = useState("");
  const { loading, error, searched, topics, news, search } = useHotTopics();
  const [submittingTopic, setSubmittingTopic] = useState<string | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [generationNow, setGenerationNow] = useState<number>(() => Date.now());
  const [actionError, setActionError] = useState<string | null>(null);
  const [candidateIndexes, setCandidateIndexes] = useState<Record<string, number>>({});
  const [openReasons, setOpenReasons] = useState<Record<string, boolean>>({});
  const [showSources, setShowSources] = useState(false);
  const [showAlternates, setShowAlternates] = useState(false);
  const isEn = locale === "en";
  const isGenerating = submittingTopic !== null;
  const generationElapsedSec = generationStartedAt ? Math.max(0, Math.floor((generationNow - generationStartedAt) / 1000)) : 0;
  const generationProgress = generationStartedAt ? Math.min(88, 12 + Math.floor((generationElapsedSec / 180) * 76)) : 0;

  const topNews = news?.items.slice(0, 5) ?? [];
  const laneCandidates = useMemo(() => {
    const usedTopicKeys = new Set<string>();
    return presets.map((preset) => {
      const direction = directionFromPresetId(preset.id);
      const candidates = topics
        .map((topic) => ({
          topic,
          worthiness: scoreTopicForLongForm(topic, news?.items ?? [], direction),
        }))
        .sort((a, b) => b.worthiness.score - a.worthiness.score)
        .filter((candidate) => !usedTopicKeys.has(candidate.topic.topicKey))
        .slice(0, 5);
      if (candidates[0]) {
        usedTopicKeys.add(candidates[0].topic.topicKey);
      }
      return { preset, direction, candidates };
    });
  }, [news?.items, presets, topics]);

  useEffect(() => {
    try {
      window.sessionStorage.removeItem("daily-run-triage-v1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!generationStartedAt) {
      return;
    }

    setGenerationNow(Date.now());
    const interval = window.setInterval(() => setGenerationNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [generationStartedAt]);

  async function handleSearch() {
    if (!query.trim()) return;
    await search(query.trim());
  }

  async function createLaneProject(topic: TopicRankingItem, ownedMediaPreset: "AI_GROWTH" | "MONEY_NEVER_SLEEPS" | "EASTERN_VITALITY") {
    const sourceItems = buildSourceItems(topic, news?.items ?? []);
    if (sourceItems.length === 0) {
      setActionError(isEn ? "No usable source material found for this topic." : "这条题目当前没有可用素材，先换一个关键词再搜。");
      return;
    }

    setSubmittingTopic(topic.topicKey);
    setGenerationStartedAt(Date.now());
    setActionError(null);

    try {
      const direction = directionFromPresetId(ownedMediaPreset);
      const worthiness = scoreTopicForLongForm(topic, news?.items ?? [], direction);
      const result = await apiRequest<FastPackageResult>("/api/daily-run/fast-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.label,
          contentLine: "OWNED_MEDIA",
          editorialDirection: direction,
          platforms: ["TOUTIAO"],
          materials: sourceItems,
          generateStoryboard: true,
          deferPackaging: true,
          worthiness,
        }),
      });

      if (result.failed > 0 || result.packagingDeferred) {
        window.sessionStorage.setItem("daily-run-last-warning", result.readiness.message);
      }
      router.push(result.nextHref as Route);
    } catch (error) {
      const explained = explainClientError(error, locale);
      setActionError([explained.title, explained.detail, explained.suggestion].filter(Boolean).join("\n"));
    } finally {
      setSubmittingTopic(null);
      setGenerationStartedAt(null);
    }
  }

  function cycleCandidate(presetId: string, count: number) {
    if (count <= 1) return;
    setCandidateIndexes((current) => ({
      ...current,
      [presetId]: ((current[presetId] ?? 0) + 1) % count,
    }));
  }

  function topicFitLabel(score?: number) {
    if (score === undefined) {
      return isEn ? "No topic" : "暂无题目";
    }
    if (score >= 70) {
      return isEn ? "Recommended" : "推荐";
    }
    if (score >= 55) {
      return isEn ? "Usable" : "可用";
    }
    return isEn ? "Thin sources" : "素材偏少";
  }

  return (
    <div id="daily-run-signals" className="theme-panel px-5 py-6 sm:px-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--text-1)]">
              {isEn ? "Search Hot Topics" : "搜索热点"}
            </div>
            <div className="mt-1 text-sm text-[var(--text-2)]">
              {isEn ? "Search once, then generate one package for each account." : "搜一次，然后给三个账号各生成一篇文章包。"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setQuery(preset.brand.keywordPool.slice(0, 3).join(" OR "))}
                title={isEn ? "Fill this account's search keywords" : "填入这个账号的搜索关键词"}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isEn ? "Track today: OpenAI / Nvidia / LVMH show" : "输入今天要追的关键词，例如 OpenAI / 英伟达 / LV 大秀"}
            className="theme-input min-w-0 flex-1 rounded-[14px] px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--text-inverse)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {isEn ? "Search hot topics" : "搜索热点"}
          </button>
        </div>

        {error ? <div className="border-y border-[color:color-mix(in_srgb,var(--danger-text)_24%,transparent)] bg-[var(--danger-bg)] py-3 text-sm text-[var(--danger-text)]">{error}</div> : null}
        {actionError ? (
          <div className="whitespace-pre-line border-y border-[color:color-mix(in_srgb,var(--danger-text)_24%,transparent)] bg-[var(--danger-bg)] py-3 text-sm leading-6 text-[var(--danger-text)]">
            {actionError}
          </div>
        ) : null}
        {isGenerating ? (
          <DailyRunGenerationProgress
            locale={locale}
            progress={generationProgress}
            elapsedSec={generationElapsedSec}
          />
        ) : null}

        {searched ? (
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-1)]">
                <TrendingUp className="size-4 text-[var(--accent)]" />
                {isEn ? "Today account topics" : "三个账号今日选题"}
              </div>
              <div className="grid gap-3">
                {laneCandidates.map((lane) => {
                  const selectedIndex = Math.min(candidateIndexes[lane.preset.id] ?? 0, Math.max(0, lane.candidates.length - 1));
                  const best = lane.candidates[selectedIndex];
                  const reasonOpen = Boolean(openReasons[lane.preset.id]);
                  return (
                    <div key={lane.preset.id} className="rounded-[18px] border border-[var(--border-soft)] bg-[var(--surface-solid)] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">{lane.preset.label}</div>
                            <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--text-2)]">
                              {topicFitLabel(best?.worthiness.score)}
                            </span>
                          </div>
                          <div className="mt-2 text-base font-semibold leading-6 text-[var(--text-1)]">
                            {best?.topic.label ?? (isEn ? "No candidate yet" : "暂无候选")}
                          </div>
                          {best ? (
                            <button
                              type="button"
                              onClick={() => setOpenReasons((current) => ({ ...current, [lane.preset.id]: !reasonOpen }))}
                              className="mt-2 text-xs text-[var(--text-3)] underline decoration-[var(--border)] underline-offset-4 transition hover:text-[var(--text-1)]"
                            >
                              {reasonOpen ? (isEn ? "Hide reason" : "收起原因") : (isEn ? "Why this topic" : "为什么推荐")}
                            </button>
                          ) : (
                            <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                              {isEn ? "Search with this account's keywords to get a candidate." : "用这个账号的关键词搜索后，这里会出现推荐题。"}
                            </div>
                          )}
                          {best && reasonOpen ? (
                            <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{best.worthiness.angleHint}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => best && void createLaneProject(best.topic, lane.preset.id)}
                          disabled={!best || isGenerating}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--text-inverse)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55 md:w-auto"
                        >
                          {submittingTopic === best?.topic.topicKey ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                          {submittingTopic === best?.topic.topicKey
                            ? (isEn ? "Generating..." : "正在生成...")
                            : (isEn ? "Generate article package" : "生成文章包")}
                        </button>
                        <button
                          type="button"
                          onClick={() => cycleCandidate(lane.preset.id, lane.candidates.length)}
                          disabled={lane.candidates.length <= 1 || isGenerating}
                          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2.5 text-sm text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isEn ? "Switch topic" : "换一个"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {topics.length > 3 ? (
                <div className="border-y border-dashed border-[var(--border)] py-4 text-sm leading-6 text-[var(--text-2)]">
                  <button
                    type="button"
                    onClick={() => setShowAlternates((value) => !value)}
                    className="font-medium text-[var(--text-1)] underline decoration-[var(--border)] underline-offset-4"
                  >
                    {showAlternates ? (isEn ? "Hide alternate topics" : "收起备选题") : (isEn ? "View alternate topics" : "查看备选题")}
                  </button>
                  {showAlternates ? (
                    <div className="mt-3 grid gap-2">
                      {topics.slice(3, 9).map((topic) => (
                        <div key={topic.topicKey} className="text-sm text-[var(--text-2)]">{topic.label}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-1)]">
                <Search className="size-4 text-[var(--accent)]" />
                <button
                  type="button"
                  onClick={() => setShowSources((value) => !value)}
                  className="underline decoration-[var(--border)] underline-offset-4 transition hover:text-[var(--accent)]"
                >
                  {showSources ? (isEn ? "Hide source material" : "收起素材来源") : (isEn ? "View source material" : "查看素材来源")}
                </button>
              </div>
              {showSources ? <div className="grid gap-3">
                {topNews.length === 0 ? (
                  <div className="border-y border-dashed border-[var(--border)] py-6 text-sm text-[var(--text-2)]">
                    {isEn ? "No source items returned yet. Try a tighter query." : "还没有返回素材，换一个更具体的关键词试试。"}
                  </div>
                ) : (
                  topNews.map((item) => (
                    <div key={item.id} className="border-t border-[var(--border)] py-4">
                      <div className="text-sm font-semibold text-[var(--text-1)]">{item.title}</div>
                      <div className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-2)]">{item.snippet}</div>
                      <div className="mt-3 text-xs text-[var(--text-3)]">
                        {item.source} · {item.published_at} · {isEn ? "will be used as source context" : "作为正文素材"}
                      </div>
                    </div>
                  ))
                )}
              </div> : null}
            </div>
          </div>
        ) : (
          <div className="border-y border-dashed border-[var(--border)] py-8 text-sm leading-6 text-[var(--text-2)]">
            {isEn
              ? "Enter a query and search. The next step is always one button: generate the article package."
              : "输入关键词并搜索。下一步只有一个动作：生成文章包。"}
          </div>
        )}
      </div>
    </div>
  );
}

function formatElapsed(seconds: number, locale: "zh" | "en") {
  if (seconds < 60) {
    return locale === "en" ? `${seconds}s` : `${seconds} 秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return locale === "en" ? `${minutes}m ${rest}s` : `${minutes} 分 ${rest} 秒`;
}

function DailyRunGenerationProgress({
  locale,
  progress,
  elapsedSec,
}: {
  locale: "zh" | "en";
  progress: number;
  elapsedSec: number;
}) {
  const isEn = locale === "en";
  const steps = isEn
    ? ["Sources", "Draft", "Title / copy / image brief"]
    : ["素材", "正文", "标题/文案/配图"];

  return (
    <div className="border-y border-[var(--border)] bg-[var(--surface-muted)] py-4 text-sm leading-6 text-[var(--text-2)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-semibold text-[var(--text-1)]">
            {isEn ? "Generating the article package" : "正在生成文章包"}
          </div>
          <div className="mt-1">
            {isEn
              ? "After the draft is ready, the editor opens automatically while titles, publish copy, and image briefs keep completing."
              : "正文完成后会自动进入编辑页，标题、发布文案和配图说明会继续补齐。"}
          </div>
        </div>
        <div className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">
          {isEn ? "Elapsed" : "已等待"} {formatElapsed(elapsedSec, locale)}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-solid)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {steps.map((step, index) => {
          const done = index === 0;
          const active = index === 1;
          return (
            <div
              key={step}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2"
            >
              <span
                className={[
                  "size-2.5 rounded-full",
                  done ? "bg-[var(--ok-text)]" : active ? "animate-pulse bg-[var(--accent-strong)]" : "bg-[var(--border)]",
                ].join(" ")}
              />
              <span className={active ? "font-medium text-[var(--text-1)]" : "text-[var(--text-2)]"}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
