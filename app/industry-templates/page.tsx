import { PageHeader } from "@/components/ui/page-header";
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
  const [recentProjects, templates, workspace] = await Promise.all([
    workspaceQueryService.listRecentProjects(),
    workspaceQueryService.listIndustryTemplates(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);

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
