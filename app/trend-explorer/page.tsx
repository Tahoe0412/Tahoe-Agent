import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { DetailPanel } from "@/components/ui/detail-panel";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { ScoreBar } from "@/components/ui/score-bar";
import { ScoreRing } from "@/components/ui/score-ring";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { ProjectContext } from "@/components/workspace/project-context";
import { PageStateView } from "@/components/workspace/page-state";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { WorkspaceLayout } from "@/components/workspace/layout";
import type { PageState } from "@/lib/demo-workspace-data";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";
import type { SupportedPlatform } from "@/types/platform-data";

const workspaceQueryService = new WorkspaceQueryService();

function MetaPill({ children }: { children: ReactNode }) {
  return <span className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{children}</span>;
}

export default async function TrendExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: PageState; projectId?: string; platform?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { state, projectId, platform } = await searchParams;
  const recentProjects = await workspaceQueryService.listRecentProjects();
  const workspace = projectId ? await workspaceQueryService.getProjectWorkspace(projectId) : null;
  const selectedPlatform = platform?.toUpperCase() ?? "ALL";
  const selectedSourcePlatform =
    selectedPlatform !== "ALL" ? (selectedPlatform as SupportedPlatform) : null;
  const filteredTrendRows =
    workspace && selectedSourcePlatform
      ? workspace.trendRows.filter((row) => row.sourcePlatforms.includes(selectedSourcePlatform))
      : workspace?.trendRows ?? [];
  const activeTrendRows = filteredTrendRows;
  const ui = {
    overviewTitle: locale === "en" ? "Signal Overview" : "趋势信号总览",
    overviewDesc: locale === "en" ? "Review the strongest themes first, then compare evidence density and cross-platform potential." : "先看最强主题，再看证据密度和跨平台潜力。",
    rankLabel: locale === "en" ? "Rank" : "排名",
    evidenceLabel: locale === "en" ? "evidence" : "条证据",
    rankPanelTitle: locale === "en" ? "Topic Ranking" : "主题排名",
    rankPanelDesc: locale === "en" ? "Break down each topic by platform, evidence count, and score mix for topic selection." : "按主题逐个拆看平台、证据量和评分结构，适合做选题判断。",
    deployable: locale === "en" ? "Deployable" : "可推进",
    watchlist: locale === "en" ? "Watchlist" : "观察中",
    totalLabel: locale === "en" ? "Total" : "总分",
    strategyTitle: locale === "en" ? "Strategy" : "策略说明",
    strategyGood: locale === "en" ? "Cross-platform potential is strong. This theme can extend into short video and image-based derivatives." : "跨平台延展性较好，适合同时做短视频和图文切片。",
    strategyNarrow: locale === "en" ? "Platform affinity is more concentrated. Validate with a single platform first." : "平台属性更集中，建议先做单平台验证。",
    focusTitle: locale === "en" ? "Lead Trend" : "主趋势拆解",
    usageTitle: locale === "en" ? "Recommended Use" : "使用建议",
    usageA: locale === "en" ? "Use this topic first for opening hooks, title cards, or cover concepts instead of spreading it evenly across all scenes." : "优先把这个主题用于开场 hook、标题卡或封面概念，不要直接平均铺到所有 scene。",
    usageB: locale === "en" ? "If evidence is high but velocity is moderate, it fits explanatory scripts better than hot-take scripts." : "如果证据量高但 velocity 一般，更适合做“解释型”而不是“热点型”脚本。",
    whyTitle: locale === "en" ? "Why this one" : "为什么先做这个",
    whyA: locale === "en" ? "Evidence is dense and it can extend across more than one platform." : "它的证据密度够高，而且可以往不止一个平台延展。",
    whyB: locale === "en" ? "This topic is more stable than a fleeting hot take, so it is safer as the current lead direction." : "它比纯热点更稳定，更适合作为这轮的主方向。",
    nextStepTitle: locale === "en" ? "Next step" : "下一步建议",
    nextStepVideo: locale === "en" ? "Take it into script rewriting first, and use it for the opening hook or first scene." : "先带去脚本页，把它放进开场 hook 或第一镜头。",
    nextStepCopy: locale === "en" ? "Take it into the copy page first, and write the headline, opening paragraph, and main angle around it." : "先带去文案页，围绕它写标题、开场和主宣传角度。",
    filterTitle: locale === "en" ? "Platform Filter" : "平台筛选",
    filterDesc: locale === "en" ? "Focus on one source platform or compare all signals together." : "可聚焦单个平台，也可以合并查看全部趋势信号。",
    allPlatforms: locale === "en" ? "All Platforms" : "全部平台",
    connectedTitle: locale === "en" ? "Connected Sources" : "已接通来源",
    plannedTitle: locale === "en" ? "Planned Sources" : "规划中来源",
    connectedDesc: locale === "en" ? "These sources are already feeding real or mock research data into the project." : "这些来源已经在当前项目里产出真实或 mock 趋势数据。",
    plannedDesc: locale === "en" ? "These platforms are planned next. Xiaohongshu and Douyin require a separate, stable data-source strategy." : "这些平台是下一阶段计划，其中小红书和抖音需要单独的数据源方案。",
    noPlatformData: locale === "en" ? "No trend topics for this platform yet." : "当前平台还没有可展示的趋势主题。",
    quickStartTitle: locale === "en" ? "Start Here" : "先按这个顺序做",
    quickStartDesc:
      locale === "en"
        ? "Choose a source first, then continue directly with the lead trend."
        : "先选这轮看哪个平台，再直接带着主推主题进入下一步。",
    quickStartStep1: locale === "en" ? "1. Choose source scope" : "1. 先选来源范围",
    quickStartStep2: locale === "en" ? "2. Pick the lead topic" : "2. 再选主主题",
    quickStartStep3:
      locale === "en" ? "3. Move to the next writing/production step" : "3. 带着这个主题进入下一步",
    sourceScopeTitle: locale === "en" ? "Source Scope" : "这轮看哪里",
    sourceScopeDesc:
      locale === "en"
        ? "If you are unsure, keep it on all platforms first."
        : "如果你还不确定，就先选“全部平台”。只有想单独看某个平台时再切换。",
    sourceStatusTitle: locale === "en" ? "Current Data Sources" : "当前数据情况",
    sourceStatusConnected: locale === "en" ? "Connected" : "已接通",
    sourceStatusPlanned: locale === "en" ? "Planned" : "下一步计划",
  };

  const connectedPlatforms = ((workspace?.platformCoverage.connected ?? []) as string[]).filter(Boolean);
  const plannedPlatforms = ((workspace?.platformCoverage.planned ?? []) as string[]).filter(Boolean);
  const filterOptions: string[] = workspace ? ["ALL", ...connectedPlatforms] : ["ALL"];
  const primaryTrend = activeTrendRows[0] ?? null;
  const topTrends = activeTrendRows.slice(0, 3);
  const secondaryTrends = activeTrendRows.slice(3);
  const nextHref =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? projectId
        ? `/script-lab?projectId=${projectId}`
        : "/script-lab"
      : projectId
        ? `/marketing-ops?projectId=${projectId}`
        : "/marketing-ops";
  const nextLabel =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? locale === "en"
        ? "Next: Rewrite Script"
        : "下一步：生成脚本"
      : locale === "en"
        ? "Next: Generate Copy"
        : "下一步：生成宣传主稿";

  function buildHref(nextPlatform: string): Route {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (nextPlatform !== "ALL") params.set("platform", nextPlatform);
    return `/trend-explorer${params.toString() ? `?${params.toString()}` : ""}` as Route;
  }

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={text.pages.trend.eyebrow}
          title={text.pages.trend.title}
          description={text.pages.trend.description}
          action={projectId ? <NextStepLink href={nextHref} label={nextLabel} /> : null}
        />
        <ProjectContext
          project={
            workspace
              ? {
                  id: workspace.project.id,
                  title: workspace.project.title,
                  topic_query: workspace.project.topic_query,
                  workspaceMode: workspace.workspaceMode,
                  introduction: workspace.projectSummary.introduction,
                  coreIdea: workspace.projectSummary.coreIdea,
                  originalScript: workspace.projectSummary.originalScript,
                  styleReferenceSample: workspace.projectSummary.styleReferenceSample,
                  styleReferenceInsight: workspace.projectSummary.styleReferenceInsight,
                  writingMode: workspace.projectSummary.writingMode as never,
                  writingModeLabel: workspace.projectSummary.writingModeLabel,
                  styleTemplate: workspace.projectSummary.styleTemplate as never,
                  styleTemplateLabel: workspace.projectSummary.styleTemplateLabel,
                  copyLength: workspace.projectSummary.copyLength as never,
                  copyLengthLabel: workspace.projectSummary.copyLengthLabel,
                  usageScenario: workspace.projectSummary.usageScenario as never,
                  usageScenarioLabel: workspace.projectSummary.usageScenarioLabel,
                }
              : null
          }
          recentProjects={recentProjects.map((project) => ({ id: project.id, title: project.title, topic_query: project.topic_query, is_pinned: project.is_pinned }))}
          locale={locale}
          density="compact"
        />

        {state && state !== "ready" ? (
          <PageStateView state={state} />
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Create a project first or open Trend Explorer with a projectId." : "请先从总览页创建项目，或带上 `projectId` 进入趋势面板。"} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Trend Data Unavailable" : "无法读取趋势数据"} description={locale === "en" ? "The project was not found, or trend topics have not been generated yet." : "没有找到该项目，或项目还没生成趋势主题。"} />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.28fr_0.72fr]">
              <PanelCard title={ui.quickStartTitle} description={ui.quickStartDesc}>
                <div className="space-y-4">
                  {activeTrendRows.length === 0 ? (
                    <EmptyPanel title={ui.noPlatformData} description={ui.filterDesc} />
                  ) : (
                    <>
                      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                        <div className="text-sm font-semibold text-[var(--text-1)]">{ui.quickStartStep1}</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.sourceScopeDesc}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {filterOptions.map((item) => {
                            const active = item === selectedPlatform;
                            return (
                              <Link
                                key={item}
                                href={buildHref(item)}
                                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                  active
                                    ? "theme-panel-strong border-transparent text-[var(--text-inverse)]"
                                    : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)] hover:bg-[var(--surface-solid)]"
                                }`}
                              >
                                {item === "ALL" ? ui.allPlatforms : item}
                              </Link>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {connectedPlatforms.length ? connectedPlatforms.map((item) => <MetaPill key={item}>{item}</MetaPill>) : <span className="text-sm text-[var(--text-2)]">当前还没有来源数据。</span>}
                          {plannedPlatforms.map((item) => (
                            <span key={item} className="rounded-full border border-dashed border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-3)]">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.quickStartStep1}</div>
                          <div className="mt-2 text-sm text-[var(--text-2)]">{selectedPlatform === "ALL" ? ui.allPlatforms : selectedPlatform}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.quickStartStep2}</div>
                          <div className="mt-2 text-sm text-[var(--text-2)]">{primaryTrend ? primaryTrend.label : "先选一个主题"}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.quickStartStep3}</div>
                          <div className="mt-2">{projectId ? <NextStepLink href={nextHref} label={nextLabel} /> : null}</div>
                        </div>
                      </div>
                      {primaryTrend ? (
                        <div className="grid gap-4 rounded-[24px] border border-[var(--accent)] bg-[var(--accent-soft)] p-5 lg:grid-cols-[minmax(0,1.2fr)_180px_220px]">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="grid size-8 place-items-center rounded-full bg-[var(--surface-strong)] text-xs font-semibold text-[var(--text-inverse)]">1</div>
                              <div className="text-lg font-semibold text-[var(--text-1)]">主推主题：{primaryTrend.label}</div>
                            </div>
                            <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{primaryTrend.topic}</div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <MetaPill>{primaryTrend.platforms}</MetaPill>
                              <MetaPill>{primaryTrend.evidence} {ui.evidenceLabel}</MetaPill>
                              <MetaPill>{primaryTrend.total >= 70 ? ui.deployable : ui.watchlist}</MetaPill>
                            </div>
                            <div className="mt-4 text-sm leading-7 text-[var(--text-2)]">
                              {primaryTrend.crossPlatform >= 60 ? ui.strategyGood : ui.strategyNarrow}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <ScoreBar label="reach" value={primaryTrend.reach} />
                            <ScoreBar label="engagement" value={primaryTrend.engagement} />
                            <ScoreBar label="velocity" value={primaryTrend.velocity} />
                          </div>

                          <div className="space-y-3">
                            <div className="theme-panel-muted rounded-[20px] p-3">
                              <ScoreRing value={primaryTrend.total} label="优先主题" />
                            </div>
                            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-solid)] p-3 text-sm leading-6 text-[var(--text-2)]">
                              先围绕这一个主题做封面、标题、开场或首条内容，不要同时铺开多个方向。
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {topTrends.length > 1 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {topTrends.slice(1).map((row, index) => (
                            <div key={row.topic} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-[var(--text-1)]">备选 {index + 2}</div>
                                  <div className="mt-1 text-base font-medium text-[var(--text-1)]">{row.label}</div>
                                </div>
                                <ScoreRing value={row.total} label="分数" />
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <MetaPill>{row.platforms}</MetaPill>
                                <MetaPill>{row.evidence} {ui.evidenceLabel}</MetaPill>
                              </div>
                              <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">
                                {row.crossPlatform >= 60 ? "如果主推主题不合适，再用这个作为第二选择。" : "先放着观察，不建议这轮立刻主推。"}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {secondaryTrends.length > 0 ? (
                        <Disclosure
                          className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4"
                          summaryClassName="text-sm font-medium text-[var(--text-1)]"
                          contentClassName="mt-4 space-y-3"
                          title={`查看其余 ${secondaryTrends.length} 个趋势主题`}
                        >
                            {secondaryTrends.map((row, index) => (
                              <div key={row.topic} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-[var(--text-1)]">#{index + 4} {row.label}</div>
                                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{row.topic}</div>
                                  </div>
                                  <MetaPill>{row.total} 分</MetaPill>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <MetaPill>{row.platforms}</MetaPill>
                                  <MetaPill>{row.evidence} {ui.evidenceLabel}</MetaPill>
                                </div>
                              </div>
                            ))}
                        </Disclosure>
                      ) : null}
                    </>
                  )}
                </div>
              </PanelCard>

              <DetailPanel title={ui.focusTitle} className="xl:sticky xl:top-6 xl:self-start">
                {primaryTrend ? (
                  <>
                    <div>
                      <div className="text-xl font-semibold text-[var(--text-inverse)]">{primaryTrend.label}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[color:rgba(246,240,232,0.58)]">{primaryTrend.topic}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {primaryTrend.sourceEvidenceMap.map((item) => (
                        <MetaPill key={`focus-${item.platform}`}>{item.platform} · {item.count}</MetaPill>
                      ))}
                    </div>
                    <div className="grid gap-3 rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{ui.whyTitle}</div>
                      <div>{ui.whyA}</div>
                      <div>{ui.whyB}</div>
                    </div>
                    <div className="grid gap-3 rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{ui.usageTitle}</div>
                      <div>{ui.usageA}</div>
                      <div>{ui.usageB}</div>
                    </div>
                    <div className="grid gap-3 rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{ui.nextStepTitle}</div>
                      <div>{workspace?.workspaceMode === "SHORT_VIDEO" ? ui.nextStepVideo : ui.nextStepCopy}</div>
                      <div className="flex flex-wrap gap-2">
                        <MetaPill>{ui.totalLabel} {primaryTrend.total}</MetaPill>
                        <MetaPill>{primaryTrend.evidence} {ui.evidenceLabel}</MetaPill>
                        <MetaPill>{primaryTrend.crossPlatform >= 60 ? ui.deployable : ui.watchlist}</MetaPill>
                      </div>
                    </div>
                  </>
                ) : null}
              </DetailPanel>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
