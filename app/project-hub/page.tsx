import { ProjectManager } from "@/components/settings/project-manager";
import { DetailPanel } from "@/components/ui/detail-panel";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();
export const dynamic = "force-dynamic";

export default async function ProjectHubPage() {
  const locale = await getLocale();
  const text = copy[locale];
  const [projects, brandProfiles, industryTemplates] = await Promise.all([
    workspaceQueryService.listProjects(),
    workspaceQueryService.listBrandProfiles(),
    workspaceQueryService.listIndustryTemplates(),
  ]);

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-8">
        <PageHeader eyebrow={text.pages.projectHub.eyebrow} title={text.pages.projectHub.title} description={text.pages.projectHub.description} />

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <PanelCard title={locale === "en" ? "Project Center" : "项目中心"} description={locale === "en" ? "Search, filter, and manage projects. Expand the form above the list to create a new one." : "搜索、筛选和管理项目。展开列表上方的表单可创建新项目。"}>
            <ProjectManager
              initialProjects={projects}
              brandProfiles={brandProfiles.map((item) => ({ id: item.id, brand_name: item.brand_name }))}
              industryTemplates={industryTemplates.map((item) => ({ id: item.id, industry_name: item.industry_name }))}
              showBulkActions
            />
          </PanelCard>

          <DetailPanel title={locale === "en" ? "Management Tips" : "管理建议"}>
            <div>
              <div className="text-sm font-medium text-[color:rgba(246,240,232,0.88)]">{locale === "en" ? "Default lifecycle" : "默认生命周期"}</div>
              <div className="mt-2">{locale === "en" ? "Keep active projects in circulation, archive historical ones, and only consider hard deletion after backup or export." : "当前项目保持激活，历史项目优先归档。真正删除应当放在导出或备份之后。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[color:rgba(246,240,232,0.88)]">{locale === "en" ? "Good sorting rules" : "推荐排序"}</div>
              <div className="mt-2">{locale === "en" ? "Use newest for daily operations, trend count for research-heavy work, and scene count for production-heavy work." : "日常按最近创建；研究型项目按趋势数；制作型项目按场景数。"}</div>
            </div>
          </DetailPanel>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
