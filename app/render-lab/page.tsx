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
  const recentProjectsUnavailable = recentProjectsResult.status === "rejected";
  const workspaceLoadFailed = workspaceResult.status === "rejected";
  const loadFailed = Boolean(projectId) && workspaceLoadFailed;
  const nextHref = !projectId
    ? "/"
    : workspace?.contentLine === "MARKETING"
      ? `/marketing-ops?projectId=${projectId}`
      : `/script-lab?projectId=${projectId}`;
  const nextLabel = !projectId
    ? locale === "en"
      ? "Back to Home"
      : "返回首页"
    : workspace?.contentLine === "MARKETING"
      ? locale === "en"
        ? "Back to Creative & Copy"
        : "返回创意与文案"
      : locale === "en"
        ? "Back to Script & Packaging"
        : "返回脚本与发布包装";

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.renderLab.eyebrow}
          title={text.pages.renderLab.title}
          description={text.pages.renderLab.description}
          locale={locale}
          action={
            projectId ? (
              <NextStepLink href={nextHref} label={nextLabel} />
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

        {recentProjectsUnavailable && !projectId ? (
          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--warning-text)_26%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--warning-bg)_84%,var(--surface-solid)),rgba(255,255,255,0.28))] px-5 py-4 text-sm leading-7 text-[var(--warning-text)] shadow-[0_14px_34px_rgba(145,108,43,0.08)]">
            {locale === "en"
              ? "The project list is temporarily unavailable, but Render Lab is still ready once the workspace data recovers."
              : "当前项目列表暂时不可用，但 Render Lab 页面本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}

        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Render Lab Is Temporarily Unavailable" : "Render Lab 暂时不可用"}
            description={locale === "en" ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers." : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"}
            action={<NextStepLink href={projectId ? `/render-lab?projectId=${projectId}` : "/render-lab"} label={locale === "en" ? "Retry Loading" : "重新加载"} />}
          />
        ) : state && state !== "ready" ? (
          <PageStateView state={state} locale={locale} />
        ) : !projectId ? (
          <EmptyPanel
            title={locale === "en" ? "Select a Project" : "等待选择项目"}
            description={
              locale === "en"
                ? "Open a project first, then use Render Lab to turn storyboard shots into image or video jobs."
                : "请先选择项目，再把分镜镜头推进成图片或视频生成任务。"
            }
            action={<NextStepLink href="/" label={locale === "en" ? "Back to Home" : "先回首页选项目"} />}
          />
        ) : !workspace ? (
          <ErrorPanel
            title={locale === "en" ? "Render Data Unavailable" : "无法读取生成制作数据"}
            description={
              locale === "en"
                ? "The current project could not be found, or this output has not been prepared for render work yet."
                : "当前项目不存在，或这条内容还没有准备到生成制作这一步。"
            }
            action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Project" : "返回当前项目"} />}
          />
        ) : workspace.scenePlannerRows.length === 0 ? (
          <EmptyPanel
            title={locale === "en" ? "No Render-Ready Shots Yet" : "还没有可进入生成的镜头"}
            description={
              locale === "en"
                ? "Finish the first storyboard draft first, then return here to refine prompts and create image or video jobs."
                : "先完成第一版分镜，再回来细修提示词并创建图片或视频任务。"
            }
            action={<NextStepLink href={`/scene-planner?projectId=${projectId}`} label={locale === "en" ? "Finish Storyboard First" : "先完成分镜"} />}
          />
        ) : (
          <RenderLabWorkbench projectId={projectId} rows={workspace.scenePlannerRows} jobs={workspace.latestRenderJobs} locale={locale} />
        )}
      </div>
    </WorkspaceLayout>
  );
}
