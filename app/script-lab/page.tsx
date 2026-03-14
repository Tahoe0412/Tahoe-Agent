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
  const recentProjects = await workspaceQueryService.listRecentProjects();
  const workspace = projectId ? await workspaceQueryService.getProjectWorkspace(projectId) : null;
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
      <div className="space-y-8">
        <PageHeader
          eyebrow={text.pages.script.eyebrow}
          title={text.pages.script.title}
          description={text.pages.script.description}
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
