import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { ProjectForm } from "@/components/dashboard/project-form";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { ProjectContext } from "@/components/workspace/project-context";
import { WorkflowActions } from "@/components/workspace/workflow-actions";
import { ApprovalBoard } from "@/components/workspace/approval-board";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

function SummaryPill({ children }: { children: ReactNode }) {
  return <span className="theme-pill rounded-full px-3 py-1.5 text-xs font-medium">{children}</span>;
}

function getDashboardNextStep(
  workspace: Awaited<ReturnType<WorkspaceQueryService["getProjectWorkspace"]>>,
  locale: "zh" | "en",
) {
  if (!workspace) {
    return {
      href: "#new-project",
      label: locale === "en" ? "Start a New Project" : "开始新项目",
    };
  }

  if (!workspace.latestBrief) {
    return {
      href: `/brief-studio?projectId=${workspace.project.id}`,
      label: locale === "en" ? "Fill the Brief" : "先写任务单",
    };
  }

  if (workspace.trendRows.length === 0) {
    return {
      href: `/trend-explorer?projectId=${workspace.project.id}`,
      label: locale === "en" ? "Generate Trends" : "去看趋势主题",
    };
  }

  if (workspace.workspaceMode === "SHORT_VIDEO") {
    if (workspace.scriptLabRows.length === 0) {
      return {
        href: `/script-lab?projectId=${workspace.project.id}`,
        label: locale === "en" ? "Generate Script Scenes" : "去生成脚本镜头",
      };
    }

    return {
      href: `/scene-planner?projectId=${workspace.project.id}`,
      label: locale === "en" ? "Continue Storyboard" : "去补素材与分镜",
    };
  }

  return {
    href: `/marketing-ops?projectId=${workspace.project.id}`,
    label: locale === "en" ? "Continue Copy Drafting" : "去生成宣传主稿",
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId } = await searchParams;
  const recentProjects = await workspaceQueryService.listRecentProjects();
  const workspace = projectId ? await workspaceQueryService.getProjectWorkspace(projectId) : null;
  const headerCopy =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? text.pages.dashboard
      : workspace?.workspaceMode === "COPYWRITING"
        ? {
            eyebrow: "COPYWRITING",
            title: locale === "en" ? "Copy Studio" : "文案工作台",
            description: locale === "en" ? "Brief → master copy → platform rewrites → compliance." : "从任务单到主稿，再到平台改写与合规检查。",
          }
        : workspace?.workspaceMode === "PROMOTION"
          ? {
              eyebrow: "PROMOTION",
              title: locale === "en" ? "Campaign Hub" : "推广枢纽",
              description: locale === "en" ? "One goal, one brief, multiple platform outputs." : "一个目标、一份任务单、多个平台产出。",
            }
          : text.pages.dashboard;
  const nextStep = getDashboardNextStep(workspace, locale);

  const ui = {
    startWorkingTitle: locale === "en" ? "Getting Started" : "开始工作",
    startWorkingDesc: locale === "en" ? "Don\u0027t look at every module first. Just do the most logical next step." : "不要先看所有模块，只做当前最合理的下一步。",
    threeStepsTitle: locale === "en" ? "Three Steps to Complete" : "三步完成当前项目",
    threeStepsDesc: locale === "en" ? "Compress the workflow into three key steps." : "把工作流压缩成最关键的 3 步，不先思考所有模块。",
    prioritiesTitle: locale === "en" ? "Current Focus" : "当前只看这几件事",
    prioritiesDesc: locale === "en" ? "Confirm direction first, then push execution. Don\u0027t try to absorb everything from the overview." : "先确认方向、再推进执行，不在总览页一次看完所有信息。",
    briefTitle: locale === "en" ? "Current Brief" : "当前任务单",
    briefDesc: locale === "en" ? "Check if the brief is clear before deciding to continue with research, scripts, or copy." : "先看任务是否明确，再决定继续研究、脚本还是宣传文案。",
    execTitle: locale === "en" ? "Execution Overview" : "当前执行概览",
    execDesc: locale === "en" ? "Only the most critical results and statuses for this round." : "总览里只保留本轮最关键的结果和状态。",
    viewDetails: locale === "en" ? "View Detailed Results" : "查看详细结果",
    tipsTitle: locale === "en" ? "Quick Tips" : "使用建议",
    tip1: locale === "en" ? "Choose a work mode first—don\u0027t try to do everything at once." : "先选工作模式，不要一开始就做所有事情。",
    tip2: locale === "en" ? "Write out the project intro, core idea, and raw input clearly." : "先把项目介绍、核心想法和原始输入写清楚。",
    tip3: locale === "en" ? "Generate the first draft, then decide whether to go deeper." : "先跑出第一版结果，再决定要不要进入更细的页面。",
    continueProject: locale === "en" ? "Continue Current Project" : "继续当前项目",
    startNewProject: locale === "en" ? "Start Another Project" : "开始新项目",
    step01Title: locale === "en" ? "Confirm the Brief" : "先确认任务单",
    step02VideoTitle: locale === "en" ? "Generate Script / Storyboard" : "再生成脚本 / 分镜",
    step02CopyTitle: locale === "en" ? "Generate Master Copy" : "再生成宣传主稿",
    step03Title: locale === "en" ? "Review & Deliver" : "最后检查并交付",
    trendLabel: locale === "en" ? "Trend Topics" : "趋势主题",
    scenesLabel: locale === "en" ? "Scene Count" : "镜头数量",
    copyVersionsLabel: locale === "en" ? "Copy Versions" : "主稿版本",
    statusLabel: locale === "en" ? "Status" : "当前状态",
    produced: locale === "en" ? "Produced" : "已产出",
    inProgress: locale === "en" ? "In Progress" : "进行中",
    priorityLabel: locale === "en" ? "Focus" : "重点",
    noBriefYet: locale === "en" ? "No brief yet. Go to the Brief Studio to define your goals, CTA, audience, and style constraints first." : "当前项目还没有创意任务单。建议先去「创意任务单」页面把目标、CTA、受众和风格约束固化下来。",
    trendsPrimary: (label: string) => locale === "en" ? `Current lead: ${label}` : `当前优先：${label}`,
    noTrendsYet: locale === "en" ? "No trend results yet" : "还没有趋势结果",
    scenesDesc: locale === "en" ? "Editable scenes from script decomposition" : "当前脚本拆解后的可编辑镜头数",
    latestCopy: (title: string) => locale === "en" ? `Latest: ${title}` : `最新主稿：${title}`,
    noCopyYet: locale === "en" ? "No master copy yet" : "还没有宣传主稿",
    producedDesc: locale === "en" ? "Report generated. Continue refining or export." : "当前项目已有报告，可继续细修或导出。",
    inProgressDesc: locale === "en" ? "Follow the recommended action at the top to continue." : "建议先按页面顶部推荐动作继续推进。",
    topTrendsTitle: locale === "en" ? "Top Trends" : "重点趋势",
    topTrendsDesc: locale === "en" ? "Expand only when you need to review topics and evidence." : "只在需要时再展开看主题和证据。",
    recentScenesTitle: locale === "en" ? "Recent Scenes" : "最近镜头",
    recentScenesDesc: locale === "en" ? "Expand only when you need to review the latest scenes." : "只在需要时展开看最近几个镜头。",
    evidenceLabel: locale === "en" ? "evidence" : "条证据",
    pointsLabel: locale === "en" ? "pts" : "分",
    sceneLabel: locale === "en" ? "Scene" : "镜头",
    assetsReady: locale === "en" ? "Ready" : "已齐备",
    assetsNeeded: locale === "en" ? "Needs Assets" : "待补素材",
    awaitingPriorities: locale === "en" ? "Awaiting generation of priorities." : "等待生成本轮重点。",
    briefHasData: locale === "en" ? "Brief exists. Continue to the next step." : "任务单已存在，可直接继续。",
    briefNeedsData: locale === "en" ? "Go to the Brief Studio to define your goals, audience, and CTA." : "先去「创意任务单」把目标、受众、CTA 写清楚。",
    step02VideoHasData: (count: number) => locale === "en" ? `${count} scenes available. Continue refining.` : `当前已有 ${count} 个镜头，可继续细修。`,
    step02VideoNeedsData: locale === "en" ? "Run script rewrite first, then decide on scenes and assets." : "先运行脚本重构，再决定镜头与素材。",
    step02CopyHasData: locale === "en" ? "Master copy exists. Continue with platform adaptation." : "当前已有宣传主稿，可直接继续平台改写。",
    step02CopyNeedsData: locale === "en" ? "Go to Marketing Ops to generate the first master copy." : "去「宣传文案与运营」先生成一版主稿。",
    step03HasData: locale === "en" ? "Report generated. Continue with compliance and delivery." : "报告已生成，可继续合规与交付。",
    step03NeedsData: locale === "en" ? "Generate the report at the end. Don\u0027t switch between too many pages upfront." : "最后再生成报告，不要一开始就切很多页。",
  };

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={headerCopy.eyebrow}
          title={headerCopy.title}
          description={headerCopy.description}
          action={<NextStepLink href={nextStep.href} label={nextStep.label} />}
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
          density="expanded"
        />

        {/* ── With workspace: main dashboard ── */}
        {workspace ? (
          <div className="space-y-6">
            {/* Three-step guide — flattened into a horizontal row */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: ui.step01Title,
                  body: workspace.latestBrief ? ui.briefHasData : ui.briefNeedsData,
                },
                {
                  step: "02",
                  title: workspace.workspaceMode === "SHORT_VIDEO" ? ui.step02VideoTitle : ui.step02CopyTitle,
                  body:
                    workspace.workspaceMode === "SHORT_VIDEO"
                      ? workspace.scriptLabRows.length
                        ? ui.step02VideoHasData(workspace.scriptLabRows.length)
                        : ui.step02VideoNeedsData
                      : workspace.marketingOverview.latestPromotionalCopy
                        ? ui.step02CopyHasData
                        : ui.step02CopyNeedsData,
                },
                {
                  step: "03",
                  title: ui.step03Title,
                  body: workspace.latestReport ? ui.step03HasData : ui.step03NeedsData,
                },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{item.step}</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--text-1)]">{item.title}</div>
                  <div className="mt-1 text-sm leading-7 text-[var(--text-2)]">{item.body}</div>
                </div>
              ))}
            </div>

            {/* Execution overview + Workflow actions — standard two-column */}
            <div className="grid gap-6 md:grid-cols-2">
              <PanelCard title={ui.execTitle} description={ui.execDesc}>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{ui.trendLabel}</div>
                    <div className="mt-3 text-3xl font-semibold text-[var(--text-1)]">{workspace.trendRows.length}</div>
                    <div className="mt-2 text-sm text-[var(--text-2)]">
                      {workspace.trendRows[0]?.label ? ui.trendsPrimary(workspace.trendRows[0].label) : ui.noTrendsYet}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
                      {workspace.workspaceMode === "SHORT_VIDEO" ? ui.scenesLabel : ui.copyVersionsLabel}
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-[var(--text-1)]">
                      {workspace.workspaceMode === "SHORT_VIDEO"
                        ? workspace.scriptLabRows.length
                        : workspace.marketingOverview.promotionalCopyVersions.length}
                    </div>
                    <div className="mt-2 text-sm text-[var(--text-2)]">
                      {workspace.workspaceMode === "SHORT_VIDEO"
                        ? ui.scenesDesc
                        : workspace.marketingOverview.latestPromotionalCopy
                          ? ui.latestCopy(workspace.marketingOverview.latestPromotionalCopy.title)
                          : ui.noCopyYet}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{ui.statusLabel}</div>
                    <div className="mt-3 text-3xl font-semibold text-[var(--text-1)]">{workspace.latestReport ? ui.produced : ui.inProgress}</div>
                    <div className="mt-2 text-sm text-[var(--text-2)]">
                      {workspace.latestReport ? ui.producedDesc : ui.inProgressDesc}
                    </div>
                  </div>
                </div>
              </PanelCard>
              <WorkflowActions projectId={workspace.project.id} workspaceMode={workspace.workspaceMode} />
            </div>

            {/* Current brief */}
            <PanelCard title={ui.briefTitle} description={ui.briefDesc}>
              {workspace.latestBrief ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-semibold tracking-tight text-[var(--text-1)]">{workspace.latestBrief.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <SummaryPill>{workspace.latestBrief.objective}</SummaryPill>
                      <SummaryPill>{workspace.latestBrief.primary_tone}</SummaryPill>
                      {workspace.latestBrief.audience_awareness ? <SummaryPill>{workspace.latestBrief.audience_awareness}</SummaryPill> : null}
                      <SummaryPill>{workspace.latestBrief.brief_status}</SummaryPill>
                    </div>
                  </div>
                  <div className="text-sm leading-7 text-[var(--text-2)]">{workspace.latestBrief.key_message}</div>
                  <div className="flex flex-wrap gap-2">
                    {((workspace.latestBrief.target_platforms as string[] | null) ?? []).map((platform) => (
                      <SummaryPill key={platform}>{platform}</SummaryPill>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--text-2)]">
                  {ui.noBriefYet}
                </div>
              )}
            </PanelCard>

            {/* Priorities */}
            <PanelCard title={ui.prioritiesTitle} description={ui.prioritiesDesc}>
              <div className="grid gap-4 md:grid-cols-3">
                {(workspace.priorities ?? [ui.awaitingPriorities]).slice(0, 3).map((item, index) => (
                  <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{ui.priorityLabel} {index + 1}</div>
                    <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{item}</div>
                  </div>
                ))}
              </div>
            </PanelCard>

            {/* Approval Board */}
            <ApprovalBoard
              projectId={workspace.project.id}
              approvals={workspace.project.approval_gates.map((gate) => ({
                id: gate.id,
                stage: gate.stage,
                approval_status: gate.approval_status,
                target_version: gate.target_version,
                reviewer_label: gate.reviewer_label,
                decision_summary: gate.decision_summary,
                approved_at: gate.approved_at,
              }))}
              versionHints={{
                BRIEF: workspace.latestBrief?.version_number ?? 1,
                RESEARCH: 1,
                SCRIPT: workspace.project.scripts[0]?.version_number ?? 1,
                STORYBOARD: workspace.latestStoryboard?.version_number ?? 1,
                ASSET_PLAN: workspace.project.scripts[0]?.version_number ?? 1,
                RENDER: 1,
                DELIVERY: workspace.latestReport ? workspace.latestReport.version_number : 1,
              }}
            />

            {/* Expanded details (collapsed by default) */}
            <Disclosure
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5"
              summaryClassName="text-sm font-medium text-[var(--text-1)]"
              contentClassName="mt-4 space-y-6"
              title={ui.viewDetails}
            >
                <PanelCard title={ui.topTrendsTitle} description={ui.topTrendsDesc}>
                  <div className="grid gap-4 md:grid-cols-3">
                    {workspace.trendRows.slice(0, 3).map((row) => (
                      <div key={row.topic} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5">
                        <div className="text-lg font-semibold text-[var(--text-1)]">{row.label}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <SummaryPill>{row.platforms}</SummaryPill>
                          <SummaryPill>{row.evidence} {ui.evidenceLabel}</SummaryPill>
                          <SummaryPill>{row.total} {ui.pointsLabel}</SummaryPill>
                        </div>
                        <div className="mt-4 text-sm leading-6 text-[var(--text-2)]">{row.summary}</div>
                      </div>
                    ))}
                  </div>
                </PanelCard>

                {workspace.workspaceMode === "SHORT_VIDEO" ? (
                  <PanelCard title={ui.recentScenesTitle} description={ui.recentScenesDesc}>
                    <div className="space-y-3">
                      {workspace.scriptLabRows.slice(0, 3).map((scene) => (
                        <div key={scene.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-[var(--text-1)]">{ui.sceneLabel} {scene.sceneOrder}</div>
                            <div className="flex items-center gap-2">
                              <SummaryPill>{scene.continuityGroup}</SummaryPill>
                              <SummaryPill>{scene.assetReady ? ui.assetsReady : ui.assetsNeeded}</SummaryPill>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 text-sm leading-6 text-[var(--text-2)] md:grid-cols-2">
                            <div className="rounded-xl bg-[var(--surface-muted)] p-3 text-[var(--text-1)]">{scene.originalText}</div>
                            <div className="theme-panel-strong rounded-xl p-3 text-[color:rgba(246,240,232,0.9)]">{scene.rewritten}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PanelCard>
                ) : null}

                <div id="new-project">
                  <ProjectForm />
                </div>
            </Disclosure>
          </div>
        ) : null}

        {/* ── Without workspace: project creation ── */}
        {!workspace ? (
          <div className="space-y-6">
            <div id="new-project">
              <ProjectForm />
            </div>
            <div className="rounded-2xl bg-[var(--surface-muted)] px-5 py-4 text-sm leading-7 text-[var(--text-2)]">
              <div className="font-medium text-[var(--text-1)]">{ui.tipsTitle}</div>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>{ui.tip1}</li>
                <li>{ui.tip2}</li>
                <li>{ui.tip3}</li>
              </ul>
            </div>
          </div>
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Create a project first or switch from the recent project bar above." : "创建新项目后会自动跳转；也可以从上方最近项目里切换。"} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Project Not Found" : "项目不存在"} description={locale === "en" ? "The current projectId could not be found. Check the link or create a new project." : "当前 `projectId` 没有查到项目数据，请检查链接或重新创建项目。"} />
        ) : null}
      </div>
    </WorkspaceLayout>
  );
}
