import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectContext } from "@/components/workspace/project-context";
import { ApprovalBoard } from "@/components/workspace/approval-board";
import { BriefStudioWorkbench } from "@/components/workspace/brief-studio-workbench";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { getOutputTypeMeta } from "@/lib/content-line";
import { copy, getLocale } from "@/lib/locale";
import { getDashboardNextStep } from "@/lib/workflow-navigator";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export default async function BriefStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId } = await searchParams;
  const [recentProjectsResult, workspaceResult] = await Promise.allSettled([
    workspaceQueryService.listRecentProjects(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);
  const recentProjects = recentProjectsResult.status === "fulfilled" ? recentProjectsResult.value : [];
  const workspace = workspaceResult.status === "fulfilled" ? workspaceResult.value : null;
  const recentProjectsUnavailable = recentProjectsResult.status === "rejected";
  const workspaceLoadFailed = workspaceResult.status === "rejected";
  const loadFailed = Boolean(projectId) && workspaceLoadFailed;
  const nextStep = getDashboardNextStep(workspace, locale);
  const outputLabel = workspace ? getOutputTypeMeta(workspace.outputType, locale).label : null;
  const pageCopy =
    workspace?.contentLine === "MARS_CITIZEN"
      ? {
          eyebrow: locale === "en" ? "Science Context" : "科普起点",
          title: "快速任务单",
          description: locale === "en" ? "Use this page only when you need to sharpen the angle before script or storyboard generation." : "只有在你需要先把角度和表达收清时，再来这里补充上下文，然后继续做脚本或分镜。",
        }
      : workspace?.contentLine === "MARKETING"
        ? {
            eyebrow: locale === "en" ? "Marketing Context" : "营销起点",
            title: "快速任务单",
            description: locale === "en" ? "Use this page to clarify brand goal, key message, and constraints before generating the first marketing draft." : "先把品牌目标、核心表达和约束写清楚，再去生成第一版营销内容。",
          }
        : text.pages.brief;

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={pageCopy.eyebrow}
          title={pageCopy.title}
          description={pageCopy.description}
          locale={locale}
          action={
            projectId ? (
              <NextStepLink
                href={nextStep.href}
                label={nextStep.label}
              />
            ) : null
          }
        />

        {workspace && outputLabel ? (
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] px-5 py-4 text-sm leading-7 text-[var(--text-2)]">
            {locale === "en"
              ? `Current target output is ${outputLabel}. Treat Brief Studio as optional context, not a mandatory front door.`
              : `当前目标产物是「${outputLabel}」。把这里当成补充上下文的地方，而不是所有项目的必经入口。`}
          </div>
        ) : null}

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

        {recentProjectsUnavailable && !projectId ? (
          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--warning-text)_26%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--warning-bg)_84%,var(--surface-solid)),rgba(255,255,255,0.28))] px-5 py-4 text-sm leading-7 text-[var(--warning-text)] shadow-[0_14px_34px_rgba(145,108,43,0.08)]">
            {locale === "en"
              ? "The project list is temporarily unavailable, but Brief Studio will be ready once workspace data recovers."
              : "当前项目列表暂时不可用，但创意任务单页面本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}

        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Brief Studio Is Temporarily Unavailable" : "创意任务单暂时不可用"}
            description={
              locale === "en"
                ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers."
                : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"
            }
            action={<NextStepLink href={projectId ? `/brief-studio?projectId=${projectId}` : "/brief-studio"} label={locale === "en" ? "Retry Loading" : "重新加载"} />}
          />
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Create or switch a project from Dashboard before opening Brief Studio." : "请先从总览页创建或切换项目，再进入创意任务单页面。"} action={<NextStepLink href="/" label={locale === "en" ? "Back to Dashboard" : "先回总览选项目"} />} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Project Not Found" : "项目不存在"} description={locale === "en" ? "No project matches the current projectId." : "没有找到当前 projectId 对应的项目。"} action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Dashboard" : "返回总览页"} />} />
        ) : (
          <>
            <BriefStudioWorkbench
              projectId={workspace.project.id}
              briefs={workspace.project.creative_briefs.map((brief) => ({
                id: brief.id,
                version_number: brief.version_number,
                title: brief.title,
                campaign_name: brief.campaign_name,
                objective: brief.objective,
                primary_tone: brief.primary_tone,
                audience_awareness: brief.audience_awareness,
                target_platforms: (brief.target_platforms as string[] | null) ?? [],
                key_message: brief.key_message,
                call_to_action: brief.call_to_action,
                target_audience: brief.target_audience,
                duration_target_sec: brief.duration_target_sec,
                brief_status: brief.brief_status,
                constraints: brief.constraints.map((item) => ({
                  id: item.id,
                  constraint_type: item.constraint_type,
                  constraint_label: item.constraint_label,
                  constraint_value: item.constraint_value,
                  is_hard_constraint: item.is_hard_constraint,
                })),
              }))}
              defaultTopic={workspace.project.topic_query}
            />

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
                RENDER: workspace.latestRenderJobs[0] ? 1 : 1,
                DELIVERY: workspace.latestReport ? workspace.latestReport.version_number : 1,
              }}
            />
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
