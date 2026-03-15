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
  const [recentProjectsResult, workspaceResult] = await Promise.allSettled([
    workspaceQueryService.listRecentProjects(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);
  const recentProjects = recentProjectsResult.status === "fulfilled" ? recentProjectsResult.value : [];
  const workspace = workspaceResult.status === "fulfilled" ? workspaceResult.value : null;
  const recentProjectsUnavailable = recentProjectsResult.status === "rejected";
  const workspaceLoadFailed = workspaceResult.status === "rejected";
  const loadFailed = Boolean(projectId) && workspaceLoadFailed;

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.marketingOps.eyebrow}
          title={text.pages.marketingOps.title}
          description={text.pages.marketingOps.description}
          locale={locale}
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
        {recentProjectsUnavailable && !projectId ? (
          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--warning-text)_26%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--warning-bg)_84%,var(--surface-solid)),rgba(255,255,255,0.28))] px-5 py-4 text-sm leading-7 text-[var(--warning-text)] shadow-[0_14px_34px_rgba(145,108,43,0.08)]">
            {locale === "en"
              ? "The project list is temporarily unavailable, but Marketing Ops will be ready once workspace data recovers."
              : "当前项目列表暂时不可用，但宣传文案页面本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}
        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Marketing Ops Is Temporarily Unavailable" : "宣传文案与运营暂时不可用"}
            description={
              locale === "en"
                ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers."
                : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"
            }
            action={<NextStepLink href={projectId ? `/marketing-ops?projectId=${projectId}` : "/marketing-ops"} label={locale === "en" ? "Retry Loading" : "重新加载"} />}
          />
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Open a project first before using Marketing Ops." : "请先选择项目，再进入内容运营台。"} action={<NextStepLink href="/" label={locale === "en" ? "Back to Dashboard" : "先回总览选项目"} />} />
        ) : !workspace ? (
          <ErrorPanel title={locale === "en" ? "Project Not Found" : "项目不存在"} description={locale === "en" ? "The current projectId could not be found." : "当前 projectId 没有找到项目数据。"} action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Dashboard" : "返回总览页"} />} />
        ) : (
          <MarketingOpsWorkbench
            projectId={projectId}
            marketingOverview={workspace.marketingOverview}
            locale={locale}
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
