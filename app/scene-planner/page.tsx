import { PageHeader } from "@/components/ui/page-header";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
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
  const recentProjects = await workspaceQueryService.listRecentProjects();
  const workspace = projectId ? await workspaceQueryService.getProjectWorkspace(projectId) : null;
  const uploadStorageMode = getUploadStorageMode();
  const showLocalStorageNotice = usesLocalUploadStorage();

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={text.pages.storyboard.eyebrow}
          title={text.pages.storyboard.title}
          description={text.pages.storyboard.description}
          action={
            projectId ? (
              <NextStepLink
                href={`/marketing-ops?projectId=${projectId}`}
                label={locale === "en" ? "Next: Review Output Copy" : "下一步：整理输出文案"}
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

        {state && state !== "ready" ? (
          <PageStateView state={state} />
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Select a project first to view storyboard planning and asset readiness." : "请先选择项目，再查看镜头规划与素材齐备度。"} action={<NextStepLink href="/" label={locale === "en" ? "Back to Dashboard" : "先回总览选项目"} />} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Storyboard Data Unavailable" : "无法读取场景规划数据"} description={locale === "en" ? "The project does not exist, or there are no usable scenes yet." : "该项目不存在，或项目还没有可用 scene 数据。"} action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Dashboard" : "返回总览页"} />} />
        ) : workspace.scenePlannerRows.length === 0 ? (
          <EmptyPanel title={locale === "en" ? "No Storyboard Data Yet" : "暂无分镜规划数据"} description={locale === "en" ? "Generate scenes first, then add storyboard frames before using this planner." : "请先生成 scene，并在后续补齐 storyboard frame，再进入此页做镜头编排和素材登记。"} action={<NextStepLink href={`/script-lab?projectId=${projectId}`} label={locale === "en" ? "Go to Script Lab" : "先去 Script Lab"} />} />
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
