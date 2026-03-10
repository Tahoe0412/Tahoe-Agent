import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { ProjectForm } from "@/components/dashboard/project-form";
import { DetailPanel } from "@/components/ui/detail-panel";
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
            eyebrow: "文案工作流",
            title: "文案项目总览",
            description: "先确认任务，再生成主稿，再做平台改写与合规检查，不必一开始打开全部模块。",
          }
        : workspace?.workspaceMode === "PROMOTION"
          ? {
              eyebrow: "推广工作流",
              title: "推广项目总览",
              description: "围绕一个推广目标收集信息、生成宣传主稿、派生平台稿，并在发布前完成检查。",
            }
          : text.pages.dashboard;
  const nextStep = getDashboardNextStep(workspace, locale);

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
        {workspace ? (
          <>
            <PanelCard title="开始工作" description="不要先看所有模块，只做当前最合理的下一步。">
              <div className="flex flex-wrap items-center gap-3">
                <NextStepLink href={nextStep.href} label={locale === "en" ? "Continue Current Project" : "继续当前项目"} />
                <Link
                  href="#new-project"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-2 text-sm font-medium text-[var(--text-1)] transition hover:bg-[var(--surface-muted)]"
                >
                  {locale === "en" ? "Start Another Project" : "开始新项目"}
                </Link>
              </div>
            </PanelCard>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <PanelCard title="三步完成当前项目" description="把工作流压缩成最关键的 3 步，不先思考所有模块。">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "先确认任务单",
                    body: workspace.latestBrief ? "任务单已存在，可直接继续。" : "先去“创意任务单”把目标、受众、CTA 写清楚。",
                  },
                  {
                    step: "02",
                    title: workspace.workspaceMode === "SHORT_VIDEO" ? "再生成脚本 / 分镜" : "再生成宣传主稿",
                    body:
                      workspace.workspaceMode === "SHORT_VIDEO"
                        ? workspace.scriptLabRows.length
                          ? `当前已有 ${workspace.scriptLabRows.length} 个镜头，可继续细修。`
                          : "先运行脚本重构，再决定镜头与素材。"
                        : workspace.marketingOverview.latestPromotionalCopy
                          ? "当前已有宣传主稿，可直接继续平台改写。"
                          : "去“宣传文案与运营”先生成一版主稿。",
                  },
                  {
                    step: "03",
                    title: "最后检查并交付",
                    body: workspace.latestReport ? "报告已生成，可继续合规与交付。" : "最后再生成报告，不要一开始就切很多页。",
                  },
                ].map((item) => (
                  <div key={item.step} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{item.step}</div>
                    <div className="mt-3 text-lg font-semibold text-[var(--text-1)]">{item.title}</div>
                    <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{item.body}</div>
                  </div>
                ))}
              </div>
            </PanelCard>
            <WorkflowActions projectId={workspace.project.id} workspaceMode={workspace.workspaceMode} />
            </div>
          </>
        ) : null}

        {!workspace ? (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div id="new-project">
              <ProjectForm />
            </div>
            <DetailPanel title="使用建议">
              {[
                "先选工作模式，不要一开始就做所有事情。",
                "先把项目介绍、核心想法和原始输入写清楚。",
                "先跑出第一版结果，再决定要不要进入更细的页面。",
              ].map((item) => (
                <div key={item}>
                  <div className="mt-2">{item}</div>
                </div>
              ))}
            </DetailPanel>
          </div>
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Create a project first or switch from the recent project bar above." : "创建新项目后会自动跳转；也可以从上方最近项目里切换。"} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Project Not Found" : "项目不存在"} description={locale === "en" ? "The current projectId could not be found. Check the link or create a new project." : "当前 `projectId` 没有查到项目数据，请检查链接或重新创建项目。"} />
        ) : (
          <div className="space-y-6">
            <PanelCard title="当前只看这几件事" description="先确认方向、再推进执行，不在总览页一次看完所有信息。">
              <div className="grid gap-4 md:grid-cols-3">
                {(workspace.priorities ?? ["等待生成本轮重点。"]).slice(0, 3).map((item, index) => (
                  <div key={item} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">重点 {index + 1}</div>
                    <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{item}</div>
                  </div>
                ))}
              </div>
            </PanelCard>

            <PanelCard title="当前任务单" description="先看任务是否明确，再决定继续研究、脚本还是宣传文案。">
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
                <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--text-2)]">
                  当前项目还没有创意任务单。建议先去“创意任务单”页面把目标、CTA、受众和风格约束固化下来。
                </div>
              )}
            </PanelCard>

            <PanelCard title="当前执行概览" description="总览里只保留本轮最关键的结果和状态。">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">趋势主题</div>
                  <div className="mt-3 text-3xl font-semibold text-[var(--text-1)]">{workspace.trendRows.length}</div>
                  <div className="mt-2 text-sm text-[var(--text-2)]">
                    {workspace.trendRows[0]?.label ? `当前优先：${workspace.trendRows[0].label}` : "还没有趋势结果"}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
                    {workspace.workspaceMode === "SHORT_VIDEO" ? "镜头数量" : "主稿版本"}
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-[var(--text-1)]">
                    {workspace.workspaceMode === "SHORT_VIDEO"
                      ? workspace.scriptLabRows.length
                      : workspace.marketingOverview.promotionalCopyVersions.length}
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-2)]">
                    {workspace.workspaceMode === "SHORT_VIDEO"
                      ? "当前脚本拆解后的可编辑镜头数"
                      : workspace.marketingOverview.latestPromotionalCopy
                        ? `最新主稿：${workspace.marketingOverview.latestPromotionalCopy.title}`
                        : "还没有宣传主稿"}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">当前状态</div>
                  <div className="mt-3 text-3xl font-semibold text-[var(--text-1)]">{workspace.latestReport ? "已产出" : "进行中"}</div>
                  <div className="mt-2 text-sm text-[var(--text-2)]">
                    {workspace.latestReport ? "当前项目已有报告，可继续细修或导出。" : "建议先按页面顶部推荐动作继续推进。"}
                  </div>
                </div>
              </div>
            </PanelCard>

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

            <Disclosure
              className="theme-panel rounded-[24px] p-4"
              summaryClassName="text-sm font-medium text-[var(--text-1)]"
              contentClassName="mt-4 space-y-6"
              title="查看详细结果"
            >
                <PanelCard title="重点趋势" description="只在需要时再展开看主题和证据。">
                  <div className="grid gap-4 md:grid-cols-3">
                    {workspace.trendRows.slice(0, 3).map((row) => (
                      <div key={row.topic} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-solid)] p-5">
                        <div className="text-lg font-semibold text-[var(--text-1)]">{row.label}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <SummaryPill>{row.platforms}</SummaryPill>
                          <SummaryPill>{row.evidence} 条证据</SummaryPill>
                          <SummaryPill>{row.total} 分</SummaryPill>
                        </div>
                        <div className="mt-4 text-sm leading-6 text-[var(--text-2)]">{row.summary}</div>
                      </div>
                    ))}
                  </div>
                </PanelCard>

                {workspace.workspaceMode === "SHORT_VIDEO" ? (
                  <PanelCard title="最近镜头" description="只在需要时展开看最近几个镜头。">
                    <div className="space-y-3">
                      {workspace.scriptLabRows.slice(0, 3).map((scene) => (
                        <div key={scene.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-[var(--text-1)]">镜头 {scene.sceneOrder}</div>
                            <div className="flex items-center gap-2">
                              <SummaryPill>{scene.continuityGroup}</SummaryPill>
                              <SummaryPill>{scene.assetReady ? "已齐备" : "待补素材"}</SummaryPill>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 text-sm leading-6 text-[var(--text-2)] md:grid-cols-2">
                            <div className="rounded-2xl bg-[var(--surface-muted)] p-3 text-[var(--text-1)]">{scene.originalText}</div>
                            <div className="theme-panel-strong rounded-2xl p-3 text-[color:rgba(246,240,232,0.9)]">{scene.rewritten}</div>
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
        )}
      </div>
    </WorkspaceLayout>
  );
}
