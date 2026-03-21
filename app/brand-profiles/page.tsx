import { PageHeader } from "@/components/ui/page-header";
import { ErrorPanel } from "@/components/ui/state-panel";
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
  const [recentProjectsResult, profilesResult, workspaceResult] = await Promise.allSettled([
    workspaceQueryService.listRecentProjects(),
    workspaceQueryService.listBrandProfiles(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);
  const recentProjects = recentProjectsResult.status === "fulfilled" ? recentProjectsResult.value : [];
  const profiles = profilesResult.status === "fulfilled" ? profilesResult.value : [];
  const workspace = workspaceResult.status === "fulfilled" ? workspaceResult.value : null;
  const recentProjectsUnavailable = recentProjectsResult.status === "rejected";
  const profilesUnavailable = profilesResult.status === "rejected";
  const workspaceLoadFailed = workspaceResult.status === "rejected";
  const loadFailed = Boolean(projectId) && workspaceLoadFailed;

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader eyebrow={text.pages.brands.eyebrow} title={text.pages.brands.title} description={text.pages.brands.description} locale={locale} />
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
              ? "The project list is temporarily unavailable, but Brand Profiles will be ready once workspace data recovers."
              : "当前项目列表暂时不可用，但品牌档案页面本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}
        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Brand Profiles Are Temporarily Unavailable" : "品牌档案暂时不可用"}
            description={
              locale === "en"
                ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers."
                : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"
            }
            locale={locale}
          />
        ) : profilesUnavailable ? (
          <ErrorPanel
            title={locale === "en" ? "Brand Profile Data Is Temporarily Unavailable" : "品牌档案数据暂时不可用"}
            description={
              locale === "en"
                ? "The page shell is still available, but brand profile records could not be loaded from the database."
                : "页面本身仍可访问，但品牌档案数据暂时没有从数据库成功读取。"
            }
            locale={locale}
          />
        ) : null}
        <BrandProfileWorkbench
          profiles={profiles.map((profile) => ({
            id: profile.id,
            brand_name: profile.brand_name,
            brand_positioning: profile.brand_positioning,
            brand_stage: profile.brand_stage,
            brand_voice: profile.brand_voice,
            platform_priority: (profile.platform_priority as string[] | null) ?? [],
            forbidden_phrases: (profile.forbidden_phrases as string[] | null) ?? [],
            keyword_pool: (profile.keyword_pool as string[] | null) ?? [],
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
