"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Check, Loader2, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { useHotTopics } from "@/hooks/use-hot-topics";
import { getEditorialDirectionPresets } from "@/lib/editorial-direction-presets";
import { apiRequest } from "@/lib/client-api";
import type { NewsSearchItem } from "@/types/news-search";
import type { TopicRankingItem } from "@/types/trend-discovery";

const SESSION_KEY = "daily-run-triage-v1";

type TriageState = "KEPT" | "DISMISSED";

type TriageStore = Record<string, TriageState>;

type GenerateFromNewsResult = {
  projectId: string;
  scriptId: string;
  title: string;
};

type QuickPackageResult = {
  completed: number;
  failed: number;
  steps: Array<{
    step: "IMAGE_BRIEF" | "TITLE_PACK" | "PUBLISH_COPY";
    ok: boolean;
    message?: string;
  }>;
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

function laneHint(topic: TopicRankingItem, lane: "AI_GROWTH" | "MONEY_NEVER_SLEEPS" | "EASTERN_VITALITY", locale: "zh" | "en") {
  const label = topic.label;
  if (locale === "en") {
    if (lane === "AI_GROWTH") return `Explain what changed in AI around "${label}".`;
    if (lane === "MONEY_NEVER_SLEEPS") return `Turn "${label}" into a market-variable read.`;
    return `Turn "${label}" into a brand or consumer signal.`;
  }

  if (lane === "AI_GROWTH") return `把“${label}”写成一条 AI 变化快讯。`;
  if (lane === "MONEY_NEVER_SLEEPS") return `把“${label}”转成市场变量判断。`;
  return `把“${label}”转成品牌或消费信号判断。`;
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

function buildLanePatch(
  preset: ReturnType<typeof getEditorialDirectionPresets>[number],
  resultTitle: string,
  topicLabel: string,
) {
  return {
    title: resultTitle || topicLabel,
    topic_query: topicLabel,
    project_introduction: preset.introduction,
    core_idea: preset.coreIdea,
    style_reference_sample: preset.styleReferenceSample,
    writing_mode: "PRODUCT_PROMO" as const,
    style_template: preset.id === "EASTERN_VITALITY" ? "LIGHT_LUXURY" as const : "RATIONAL_PRO" as const,
    copy_length: "STANDARD" as const,
    usage_scenario: "XIAOHONGSHU_POST" as const,
    project_tags: [preset.label, preset.id, "daily-run", "今日三篇"],
  };
}

export function DailyRunSignalPanel({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const router = useRouter();
  const presets = useMemo(() => getEditorialDirectionPresets(locale), [locale]);
  const [query, setQuery] = useState("");
  const { loading, error, searched, topics, news, search } = useHotTopics();
  const [triage, setTriage] = useState<TriageStore>({});
  const [submittingTopic, setSubmittingTopic] = useState<string | null>(null);
  const [quickPackagingTopic, setQuickPackagingTopic] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const isEn = locale === "en";

  const topNews = news?.items.slice(0, 5) ?? [];

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TriageStore;
      setTriage(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(triage));
    } catch {}
  }, [triage]);

  async function handleSearch() {
    if (!query.trim()) return;
    await search(query.trim());
  }

  async function createLaneProject(topic: TopicRankingItem, ownedMediaPreset: "AI_GROWTH" | "MONEY_NEVER_SLEEPS" | "EASTERN_VITALITY") {
    const preset = presets.find((item) => item.id === ownedMediaPreset);
    if (!preset) return;
    const sourceItems = buildSourceItems(topic, news?.items ?? []);
    if (sourceItems.length === 0) {
      setActionError(isEn ? "No usable source material found for this topic." : "这条题目当前没有可用素材，先换一个关键词再搜。");
      return;
    }

    setSubmittingTopic(topic.topicKey);
    setActionError(null);

    try {
      const result = await apiRequest<GenerateFromNewsResult>("/api/scripts/generate-from-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchQuery: topic.label,
          newsItems: sourceItems,
          contentLine: "MARS_CITIZEN",
          outputType: "NARRATIVE_SCRIPT",
        }),
      });

      await apiRequest(`/api/projects/${result.projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildLanePatch(preset, result.title, topic.label)),
      });

      setQuickPackagingTopic(topic.topicKey);
      const quickPackage = await apiRequest<QuickPackageResult>("/api/daily-run/quick-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: result.projectId,
          scriptId: result.scriptId,
        }),
      });

      setTriage((current) => ({ ...current, [topic.topicKey]: "KEPT" }));
      if (quickPackage.failed > 0) {
        const failedSteps = quickPackage.steps
          .filter((step) => !step.ok)
          .map((step) => step.step)
          .join(", ");
        window.sessionStorage.setItem(
          "daily-run-last-warning",
          isEn
            ? `Draft created, but quick package partially failed: ${failedSteps}.`
            : `主稿已创建，但快速发布包有步骤失败：${failedSteps}。`,
        );
      }
      router.push(`/script-lab?projectId=${result.projectId}` as Route);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : isEn ? "Failed to create project." : "创建项目失败。");
    } finally {
      setSubmittingTopic(null);
      setQuickPackagingTopic(null);
    }
  }

  function markTopic(topicKey: string, state: TriageState) {
    setTriage((current) => ({ ...current, [topicKey]: state }));
  }

  return (
    <div id="daily-run-signals" className="theme-panel py-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">
              {isEn ? "Today's signals" : "今日信号"}
            </div>
            <div className="mt-2 text-lg font-semibold text-[var(--text-1)]">
              {isEn ? "Search once. One selected topic becomes draft, image brief, title pack, and publish copy." : "搜一次。选中的题目会直接生成主稿、配图说明、标题包和发布文案。"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setQuery(preset.brand.keywordPool.slice(0, 3).join(" OR "))}
                className="rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
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
            placeholder={isEn ? "For example: OpenAI OR Nvidia OR LVMH" : "例如：OpenAI OR 英伟达 OR LV 大秀"}
            className="theme-input min-w-0 flex-1 rounded-md px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent-strong)] px-4 py-3 text-sm font-medium text-[var(--text-inverse)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {isEn ? "Search signals" : "搜索信号"}
          </button>
        </div>

        {error ? <div className="border-y border-[color:color-mix(in_srgb,var(--danger-text)_24%,transparent)] bg-[var(--danger-bg)] py-3 text-sm text-[var(--danger-text)]">{error}</div> : null}
        {actionError ? <div className="border-y border-[color:color-mix(in_srgb,var(--danger-text)_24%,transparent)] bg-[var(--danger-bg)] py-3 text-sm text-[var(--danger-text)]">{actionError}</div> : null}

        {searched ? (
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-1)]">
                <TrendingUp className="size-4 text-[var(--accent)]" />
                {isEn ? "Recommended topics" : "推荐选题"}
              </div>
              <div className="grid border-t border-[var(--border)]">
                {topics.slice(0, 6).map((topic) => (
                  <div key={topic.topicKey} className="border-b border-[var(--border)] py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--text-1)]">{topic.label}</div>
                        <div className="mt-2 text-xs text-[var(--text-3)]">
                          {isEn ? "Heat" : "热度"} {topic.score} · {isEn ? "Evidence" : "证据"} {topic.evidenceCount}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {triage[topic.topicKey] === "KEPT" ? (
                          <span className="rounded-md bg-[color:color-mix(in_srgb,var(--ok-bg)_80%,transparent)] px-2.5 py-1 text-xs text-[var(--ok-text)]">
                            {isEn ? "Kept" : "已保留"}
                          </span>
                        ) : null}
                        {triage[topic.topicKey] === "DISMISSED" ? (
                          <span className="rounded-md bg-[color:color-mix(in_srgb,var(--danger-bg)_82%,transparent)] px-2.5 py-1 text-xs text-[var(--danger-text)]">
                            {isEn ? "Ignored" : "已忽略"}
                          </span>
                        ) : null}
                        <span className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-2)]">{topic.heatLevel}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => markTopic(topic.topicKey, "KEPT")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
                      >
                        <Check className="size-3.5" />
                        {isEn ? "Keep" : "保留"}
                      </button>
                      <button
                        type="button"
                        onClick={() => markTopic(topic.topicKey, "DISMISSED")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
                      >
                        <X className="size-3.5" />
                        {isEn ? "Ignore" : "忽略"}
                      </button>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {presets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => void createLaneProject(topic, preset.id)}
                          disabled={submittingTopic === topic.topicKey}
                          className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm transition hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div>
                            <div className="font-medium text-[var(--text-1)]">{preset.label}</div>
                            <div className="mt-1 text-xs text-[var(--text-3)]">
                              {quickPackagingTopic === topic.topicKey
                                ? isEn
                                  ? "Building quick package: image brief, titles, publish copy..."
                                  : "正在生成快速发布包：配图说明、标题包、发布文案..."
                                : laneHint(topic, preset.id, locale)}
                            </div>
                          </div>
                          {submittingTopic === topic.topicKey ? (
                            <Loader2 className="size-4 shrink-0 animate-spin text-[var(--text-3)]" />
                          ) : (
                            <Sparkles className="size-4 shrink-0 text-[var(--text-3)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-1)]">
                <Search className="size-4 text-[var(--accent)]" />
                {isEn ? "Fresh source material" : "最新素材"}
              </div>
              <div className="grid gap-3">
                {topNews.length === 0 ? (
                  <div className="border-y border-dashed border-[var(--border)] py-6 text-sm text-[var(--text-2)]">
                    {isEn ? "No source items returned yet. Try a tighter query." : "还没有返回素材，换一个更具体的关键词试试。"}
                  </div>
                ) : (
                  topNews.map((item) => (
                    <div key={item.id} className="border-t border-[var(--border)] py-4">
                      <div className="text-sm font-semibold text-[var(--text-1)]">{item.title}</div>
                      <div className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-2)]">{item.snippet}</div>
                      <div className="mt-3 text-xs text-[var(--text-3)]">{item.source} · {item.published_at}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-y border-dashed border-[var(--border)] py-8 text-sm leading-6 text-[var(--text-2)]">
            {isEn
              ? "No auto-search here. Enter a query, click search, then route one topic into the right account lane."
              : "这里不会自动搜索。先输入关键词，点一次搜索，再把题目分到合适账号。"}
          </div>
        )}
      </div>
    </div>
  );
}
