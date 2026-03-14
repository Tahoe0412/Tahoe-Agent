import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectContext } from "@/components/workspace/project-context";
import { ApprovalBoard } from "@/components/workspace/approval-board";
import { BriefStudioWorkbench } from "@/components/workspace/brief-studio-workbench";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { copy, getLocale } from "@/lib/locale";
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
  const recentProjects = await workspaceQueryService.listRecentProjects();
  const workspace = projectId ? await workspaceQueryService.getProjectWorkspace(projectId) : null;
  const pageCopy =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? {
          eyebrow: "项目起点",
          title: "快速任务单",
          description: "先把视频目标、核心表达和平台写清楚，再进入趋势、脚本和分镜。",
        }
      : workspace?.workspaceMode === "COPYWRITING"
        ? {
            eyebrow: "文案起点",
            title: "快速任务单",
            description: "先把传播目标、核心表达和 CTA 写清楚，再生成主稿和平台稿。",
          }
        : workspace?.workspaceMode === "PROMOTION"
          ? {
              eyebrow: "推广起点",
              title: "快速任务单",
              description: "先把推广目标、核心卖点和目标平台写清楚，再推进宣传文案与合规检查。",
            }
          : text.pages.brief;

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={pageCopy.eyebrow}
          title={pageCopy.title}
          description={pageCopy.description}
          action={
            projectId ? (
              <NextStepLink
                href={`/trend-explorer?projectId=${projectId}`}
                label={locale === "en" ? "Next: Review Trends" : "下一步：看趋势主题"}
              />
            ) : null
          }
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

        {!projectId ? (
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
