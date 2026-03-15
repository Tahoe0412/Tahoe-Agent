import { PageHeader } from "@/components/ui/page-header";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { ProjectContext } from "@/components/workspace/project-context";
import { PageStateView } from "@/components/workspace/page-state";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { ScriptLabWorkbench } from "@/components/workspace/script-lab-workbench";
import { WorkspaceLayout } from "@/components/workspace/layout";
import type { PageState } from "@/lib/demo-workspace-data";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export default async function ScriptLabPage({
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
  const nextHref =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? projectId
        ? `/scene-planner?projectId=${projectId}`
        : "/scene-planner"
      : projectId
        ? `/marketing-ops?projectId=${projectId}`
        : "/marketing-ops";
  const nextLabel =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? locale === "en"
        ? "Next: Plan Storyboard"
        : "下一步：做分镜与素材"
      : locale === "en"
        ? "Next: Write Marketing Copy"
        : "下一步：去写宣传文案";

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.script.eyebrow}
          title={text.pages.script.title}
          description={text.pages.script.description}
          locale={locale}
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

        {recentProjectsUnavailable && !projectId ? (
          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--warning-text)_26%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--warning-bg)_84%,var(--surface-solid)),rgba(255,255,255,0.28))] px-5 py-4 text-sm leading-7 text-[var(--warning-text)] shadow-[0_14px_34px_rgba(145,108,43,0.08)]">
            {locale === "en"
              ? "The project list is temporarily unavailable, but Script Lab will be ready once workspace data recovers."
              : "当前项目列表暂时不可用，但脚本实验台页面本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}

        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Script Lab Is Temporarily Unavailable" : "脚本实验台暂时不可用"}
            description={
              locale === "en"
                ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers."
                : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"
            }
            action={<NextStepLink href={projectId ? `/script-lab?projectId=${projectId}` : "/script-lab"} label={locale === "en" ? "Retry Loading" : "重新加载"} />}
          />
        ) : state && state !== "ready" ? (
          <PageStateView state={state} locale={locale} />
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Select a project first to view real script lab data." : "请先选择项目，再查看真实脚本实验数据。"} action={<NextStepLink href="/" label={locale === "en" ? "Back to Dashboard" : "先回总览选项目"} />} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Script Data Unavailable" : "无法读取脚本实验数据"} description={locale === "en" ? "The project does not exist, or script rewrite has not been generated yet." : "该项目不存在，或还没生成脚本重构结果。"} action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Dashboard" : "返回总览页"} />} />
        ) : workspace.scriptLabRows.length === 0 ? (
          <EmptyPanel title={locale === "en" ? "No Scenes Yet" : "暂无 scene 数据"} description={locale === "en" ? "Run the full dashboard workflow or trigger script rewrite first, then return to edit scenes." : "先在 Dashboard 执行全流程，或先触发 script rewrite，再回来编辑 scene。"} action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Run Workflow First" : "先去总览跑流程"} />} />
        ) : (
          <ScriptLabWorkbench projectId={projectId} rows={workspace.scriptLabRows} />
        )}
      </div>
    </WorkspaceLayout>
  );
}
