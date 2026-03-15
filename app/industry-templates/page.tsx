import { PageHeader } from "@/components/ui/page-header";
import { ErrorPanel } from "@/components/ui/state-panel";
import { ProjectContext } from "@/components/workspace/project-context";
import { IndustryTemplateWorkbench } from "@/components/workspace/industry-template-workbench";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

export default async function IndustryTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId } = await searchParams;
  const [recentProjectsResult, templatesResult, workspaceResult] = await Promise.allSettled([
    workspaceQueryService.listRecentProjects(),
    workspaceQueryService.listIndustryTemplates(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);
  const recentProjects = recentProjectsResult.status === "fulfilled" ? recentProjectsResult.value : [];
  const templates = templatesResult.status === "fulfilled" ? templatesResult.value : [];
  const workspace = workspaceResult.status === "fulfilled" ? workspaceResult.value : null;
  const recentProjectsUnavailable = recentProjectsResult.status === "rejected";
  const templatesUnavailable = templatesResult.status === "rejected";
  const workspaceLoadFailed = workspaceResult.status === "rejected";
  const loadFailed = Boolean(projectId) && workspaceLoadFailed;

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader eyebrow={text.pages.industry.eyebrow} title={text.pages.industry.title} description={text.pages.industry.description} locale={locale} />
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
                  writingMode: workspace.projectSummary.writingMode as never,
                  writingModeLabel: workspace.projectSummary.writingModeLabel,
                  styleTemplate: workspace.projectSummary.styleTemplate as never,
                  styleTemplateLabel: workspace.projectSummary.styleTemplateLabel,
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
              ? "The project list is temporarily unavailable, but Industry Templates will be ready once workspace data recovers."
              : "当前项目列表暂时不可用，但行业模板页面本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}
        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Industry Templates Are Temporarily Unavailable" : "行业模板暂时不可用"}
            description={
              locale === "en"
                ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers."
                : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"
            }
            locale={locale}
          />
        ) : templatesUnavailable ? (
          <ErrorPanel
            title={locale === "en" ? "Industry Template Data Is Temporarily Unavailable" : "行业模板数据暂时不可用"}
            description={
              locale === "en"
                ? "The page shell is still available, but industry template records could not be loaded from the database."
                : "页面本身仍可访问，但行业模板数据暂时没有从数据库成功读取。"
            }
            locale={locale}
          />
        ) : null}
        <IndustryTemplateWorkbench
          templates={templates.map((template) => ({
            id: template.id,
            industry_name: template.industry_name,
            industry_keywords: (template.industry_keywords as string[] | null) ?? [],
            competitor_keywords: (template.competitor_keywords as string[] | null) ?? [],
            forbidden_terms: (template.forbidden_terms as string[] | null) ?? [],
            recommended_topic_directions: (template.recommended_topic_directions as string[] | null) ?? [],
            competitor_profiles: template.competitor_profiles.map((competitor) => ({
              id: competitor.id,
              competitor_name: competitor.competitor_name,
              competitor_tier: competitor.competitor_tier,
              primary_platforms: (competitor.primary_platforms as string[] | null) ?? [],
            })),
            projects: template.projects.map((item) => ({ id: item.id, title: item.title, status: item.status })),
          }))}
          projectId={projectId}
          activeIndustryTemplateId={workspace?.project.industry_template_id ?? null}
        />
      </div>
    </WorkspaceLayout>
  );
}
