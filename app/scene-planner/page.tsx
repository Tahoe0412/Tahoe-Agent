import { PageHeader } from "@/components/ui/page-header";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { GenerateStoryboardButton } from "@/components/workspace/generate-storyboard-button";
import { ProjectContext } from "@/components/workspace/project-context";
import { PageStateView } from "@/components/workspace/page-state";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { ScenePlannerWorkbench } from "@/components/workspace/scene-planner-workbench";
import { WorkspaceLayout } from "@/components/workspace/layout";
import type { PageState } from "@/lib/demo-workspace-data";
import { getUploadStorageMode, usesLocalUploadStorage } from "@/lib/env";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export default async function ScenePlannerPage({
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
  const uploadStorageMode = getUploadStorageMode();
  const showLocalStorageNotice = usesLocalUploadStorage();

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.storyboard.eyebrow}
          title={text.pages.storyboard.title}
          description={text.pages.storyboard.description}
          locale={locale}
          action={
            projectId ? (
              <div className="flex flex-wrap gap-3">
                <GenerateStoryboardButton projectId={projectId} locale={locale} variant="secondary" />
                <NextStepLink
                  href={`/render-lab?projectId=${projectId}`}
                  label={locale === "en" ? "Next: Prepare Render Jobs" : "下一步：准备渲染任务"}
                />
              </div>
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
              ? "The project list is temporarily unavailable, but Scene Planner will be ready once workspace data recovers."
              : "当前项目列表暂时不可用，但分镜编排页面本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}

        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Scene Planner Is Temporarily Unavailable" : "分镜编排暂时不可用"}
            description={
              locale === "en"
                ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers."
                : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"
            }
            action={<NextStepLink href={projectId ? `/scene-planner?projectId=${projectId}` : "/scene-planner"} label={locale === "en" ? "Retry Loading" : "重新加载"} />}
          />
        ) : state && state !== "ready" ? (
          <PageStateView state={state} locale={locale} />
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Select a project first to view storyboard planning and asset readiness." : "请先选择项目，再查看镜头规划与素材齐备度。"} action={<NextStepLink href="/" label={locale === "en" ? "Back to Dashboard" : "先回总览选项目"} />} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Storyboard Data Unavailable" : "无法读取场景规划数据"} description={locale === "en" ? "The project does not exist, or there are no usable scenes yet." : "该项目不存在，或项目还没有可用 scene 数据。"} action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Dashboard" : "返回总览页"} />} />
        ) : workspace.scenePlannerRows.length === 0 ? (
          <EmptyPanel
            title={locale === "en" ? "No Storyboard Data Yet" : "暂无分镜规划数据"}
            description={
              locale === "en"
                ? "You can now generate a storyboard directly from the project topic and intent, or jump to Script Lab if you want to shape scenes manually first."
                : "现在可以直接从项目主题和意图生成分镜；如果你想先手动整理 scene，也可以先去 Script Lab。"
            }
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <GenerateStoryboardButton projectId={projectId} locale={locale} />
                <NextStepLink href={`/script-lab?projectId=${projectId}`} label={locale === "en" ? "Go to Script Lab" : "先去 Script Lab"} />
              </div>
            }
          />
        ) : (
          <ScenePlannerWorkbench
            projectId={projectId}
            rows={workspace.scenePlannerRows}
            showLocalStorageNotice={showLocalStorageNotice}
            uploadStorageMode={uploadStorageMode}
          />
        )}
      </div>
    </WorkspaceLayout>
  );
}
