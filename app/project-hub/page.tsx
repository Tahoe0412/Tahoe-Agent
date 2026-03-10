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

        <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <PanelCard title={locale === "en" ? "Project Center" : "项目中心"} description={locale === "en" ? "Create new projects, switch work modes, and manage many projects with one filtered list." : "在同一个页面里创建新项目、切换工作模式，并统一管理多个项目。"}>
            <ProjectManager
              initialProjects={projects}
              brandProfiles={brandProfiles.map((item) => ({ id: item.id, brand_name: item.brand_name }))}
              industryTemplates={industryTemplates.map((item) => ({ id: item.id, industry_name: item.industry_name }))}
              showBulkActions
            />
          </PanelCard>

          <DetailPanel title={locale === "en" ? "Recommended Management Model" : "推荐管理方式"}>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Default lifecycle" : "默认生命周期"}</div>
              <div className="mt-2">{locale === "en" ? "Keep active projects in circulation, archive historical ones, and only consider hard deletion after backup or export." : "当前项目保持激活，历史项目优先归档。真正删除应当放在导出或备份之后。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Good sorting rules" : "推荐排序规则"}</div>
              <div className="mt-2">{locale === "en" ? "Use newest for daily operations, trend count for research-heavy work, and scene count for production-heavy work." : "日常查看优先按最近创建；研究型项目可按趋势数排序；制作型项目可按场景数排序。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Tags" : "项目标签"}</div>
              <div className="mt-2">{locale === "en" ? "Use tags for quarters, product lines, launch waves, or campaign names so projects remain searchable across brands." : "建议用标签标记季度、产品线、活动代号或 campaign 名称，方便跨品牌搜索和后续复盘。"}</div>
            </div>
          </DetailPanel>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
