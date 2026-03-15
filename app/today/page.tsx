import { WorkspaceLayout } from "@/components/workspace/layout";
import { PageHeader } from "@/components/ui/page-header";
import { TodayWorkbench } from "@/components/today/today-workbench";
import { getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const locale = await getLocale();

  let brandKeywordProfiles: Array<{ id: string; name: string; keywords: string[] }> = [];
  let recentProjects: Array<{ id: string; title: string; topic_query: string; status: string }> = [];
  try {
    const profiles = await workspaceQueryService.listBrandProfiles();
    brandKeywordProfiles = profiles
      .filter((p) => Array.isArray(p.keyword_pool) && (p.keyword_pool as string[]).length > 0)
      .map((p) => ({ id: p.id, name: p.brand_name, keywords: p.keyword_pool as string[] }));
    const projects = await workspaceQueryService.listRecentProjects();
    recentProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      topic_query: p.topic_query,
      status: p.status,
    }));
  } catch {
    // DB unreachable — continue with empty data
  }

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={locale === "en" ? "TODAY" : "今日"}
          title={locale === "en" ? "Today's Workbench" : "今日工作台"}
          description={
            locale === "en"
              ? "See what's trending, pick a topic, produce content — all in one page."
              : "看热点、选题、产出 — 一页搞定。"
          }
          locale={locale}
        />
        <TodayWorkbench
          brandProfiles={brandKeywordProfiles}
          recentProjects={recentProjects}
          locale={locale}
        />
      </div>
    </WorkspaceLayout>
  );
}
