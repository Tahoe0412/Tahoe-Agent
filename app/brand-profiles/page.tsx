import { PageHeader } from "@/components/ui/page-header";
import { ProjectContext } from "@/components/workspace/project-context";
import { BrandProfileWorkbench } from "@/components/workspace/brand-profile-workbench";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

export default async function BrandProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId } = await searchParams;
  const [recentProjects, profiles, workspace] = await Promise.all([
    workspaceQueryService.listRecentProjects(),
    workspaceQueryService.listBrandProfiles(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-8">
        <PageHeader eyebrow={text.pages.brands.eyebrow} title={text.pages.brands.title} description={text.pages.brands.description} />
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
        <BrandProfileWorkbench
          profiles={profiles.map((profile) => ({
            id: profile.id,
            brand_name: profile.brand_name,
            brand_positioning: profile.brand_positioning,
            brand_stage: profile.brand_stage,
            brand_voice: profile.brand_voice,
            platform_priority: (profile.platform_priority as string[] | null) ?? [],
            forbidden_phrases: (profile.forbidden_phrases as string[] | null) ?? [],
            content_pillars: profile.content_pillars.map((pillar) => ({
              id: pillar.id,
              pillar_name: pillar.pillar_name,
              pillar_type: pillar.pillar_type,
              priority_score: pillar.priority_score,
            })),
            projects: profile.projects.map((item) => ({ id: item.id, title: item.title, status: item.status })),
          }))}
          projectId={projectId}
          activeBrandProfileId={workspace?.project.brand_profile_id ?? null}
        />
      </div>
    </WorkspaceLayout>
  );
}
