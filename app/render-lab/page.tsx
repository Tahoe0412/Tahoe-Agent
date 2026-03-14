import { PageHeader } from "@/components/ui/page-header";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { PageStateView } from "@/components/workspace/page-state";
import { ProjectContext } from "@/components/workspace/project-context";
import { RenderLabWorkbench } from "@/components/workspace/render-lab-workbench";
import type { PageState } from "@/lib/demo-workspace-data";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

export default async function RenderLabPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: PageState; projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { state, projectId } = await searchParams;
  const [recentProjectsResult, workspaceResult] = await Promise.allSettled([
    workspaceQueryService.listRecentProjects(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);
  const recentProjects = recentProjectsResult.status === "fulfilled" ? recentProjectsResult.value : [];
  const workspace = workspaceResult.status === "fulfilled" ? workspaceResult.value : null;
  const loadFailed = recentProjectsResult.status === "rejected" || workspaceResult.status === "rejected";

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.renderLab.eyebrow}
          title={text.pages.renderLab.title}
          description={text.pages.renderLab.description}
          action={
            projectId ? (
              <NextStepLink
                href={`/marketing-ops?projectId=${projectId}`}
                label={locale === "en" ? "Next: Marketing Output" : "下一步：整理宣传文案"}
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

        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Render Lab Is Temporarily Unavailable" : "Render Lab 暂时不可用"}
            description={locale === "en" ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers." : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"}
          />
        ) : state && state !== "ready" ? (
          <PageStateView state={state} />
        ) : !projectId ? (
          <EmptyPanel
            title={locale === "en" ? "Select a Project" : "等待选择项目"}
            description={locale === "en" ? "Select a short video project first to prepare render jobs from storyboard scenes." : "请先选择一个短视频项目，再基于已有场景准备渲染任务。"}
          />
        ) : !workspace ? (
          <ErrorPanel
            title={locale === "en" ? "Render Data Unavailable" : "无法读取生成制作数据"}
            description={locale === "en" ? "The current project could not be found, or the workspace data is unavailable." : "当前项目不存在，或工作台数据暂时不可用。"}
          />
        ) : workspace.workspaceMode !== "SHORT_VIDEO" ? (
          <EmptyPanel
            title={locale === "en" ? "Render Lab Is for Short Video Projects" : "Render Lab 仅支持短视频项目"}
            description={locale === "en" ? "Switch to a short video project to connect scenes, prompts, and render jobs in one flow." : "请切换到短视频模式项目，再把场景、提示词和渲染任务串到同一条工作流中。"}
          />
        ) : workspace.scenePlannerRows.length === 0 ? (
          <div className="space-y-4">
            <EmptyPanel
              title={locale === "en" ? "No Scene Data Yet" : "还没有可用场景数据"}
              description={locale === "en" ? "Plan storyboard scenes first, then return here to prefill prompts and create image or video jobs." : "请先去 Scene Planner 完成场景与分镜，再回来预填提示词并创建图片或视频任务。"}
            />
            <NextStepLink
              href={`/scene-planner?projectId=${projectId}`}
              label={locale === "en" ? "Go to Scene Planner" : "先去 Scene Planner"}
            />
          </div>
        ) : (
          <RenderLabWorkbench projectId={projectId} rows={workspace.scenePlannerRows} jobs={workspace.latestRenderJobs} locale={locale} />
        )}
      </div>
    </WorkspaceLayout>
  );
}
