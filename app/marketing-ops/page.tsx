import { PageHeader } from "@/components/ui/page-header";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { MarketingOpsWorkbench } from "@/components/workspace/marketing-ops-workbench";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { ProjectContext } from "@/components/workspace/project-context";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

export default async function MarketingOpsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId } = await searchParams;
  const recentProjects = await workspaceQueryService.listRecentProjects();
  const workspace = projectId ? await workspaceQueryService.getProjectWorkspace(projectId) : null;

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={text.pages.marketingOps.eyebrow}
          title={text.pages.marketingOps.title}
          description={text.pages.marketingOps.description}
          action={
            projectId ? (
              <NextStepLink
                href={`/?projectId=${projectId}`}
                label={locale === "en" ? "Back to Dashboard" : "返回总览看结果"}
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
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Open a project first before using Marketing Ops." : "请先选择项目，再进入内容运营台。"} action={<NextStepLink href="/" label={locale === "en" ? "Back to Dashboard" : "先回总览选项目"} />} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Project Not Found" : "项目不存在"} description={locale === "en" ? "The current projectId could not be found." : "当前 projectId 没有找到项目数据。"} action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Dashboard" : "返回总览页"} />} />
        ) : (
          <MarketingOpsWorkbench
            projectId={projectId}
            marketingOverview={workspace.marketingOverview}
            projectConfig={{
              writingMode: workspace.projectSummary.writingMode as never,
              styleTemplate: workspace.projectSummary.styleTemplate as never,
              copyLength: workspace.projectSummary.copyLength as never,
              usageScenario: workspace.projectSummary.usageScenario as never,
              styleReferenceSample: workspace.projectSummary.styleReferenceSample,
            }}
          />
        )}
      </div>
    </WorkspaceLayout>
  );
}
