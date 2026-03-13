import { LanguageSettings } from "@/components/settings/language-settings";
import { ProjectManager } from "@/components/settings/project-manager";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { DetailPanel } from "@/components/ui/detail-panel";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { SettingsForm } from "@/components/settings/settings-form";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { copy, getLocale } from "@/lib/locale";
import { AppSettingsService } from "@/services/app-settings.service";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const appSettingsService = new AppSettingsService();
const workspaceQueryService = new WorkspaceQueryService();
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const locale = await getLocale();
  const text = copy[locale];
  const settings = await appSettingsService.getEffectiveSettings();
  const [projects, brandProfiles, industryTemplates] = await Promise.all([
    workspaceQueryService.listProjects(),
    workspaceQueryService.listBrandProfiles(),
    workspaceQueryService.listIndustryTemplates(),
  ]);

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={text.pages.settings.eyebrow}
          title={text.pages.settings.title}
          description={text.pages.settings.description}
        />

        <div className="grid gap-6 xl:grid-cols-[0.82fr_0.82fr_0.86fr]">
          <PanelCard title={locale === "en" ? "Theme" : "界面外观"} description={locale === "en" ? "Choose light, dark, or follow system." : "切换莫兰迪浅色、深色，或保持跟随系统。"}>
            <ThemeSettings />
          </PanelCard>

          <PanelCard title={text.common.localeTitle} description={text.common.localeDesc}>
            <LanguageSettings initialLocale={locale} />
          </PanelCard>

          <DetailPanel title={locale === "en" ? "Visual Strategy" : "视觉策略"}>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Current Direction" : "当前方向"}</div>
              <div className="mt-2">{locale === "en" ? "The interface uses a muted Morandi palette to reduce harsh contrast and make dense information easier to read." : "整体采用低饱和莫兰迪色板，降低刺眼对比，让高密度信息更适合长时间阅读。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Recommended" : "推荐方式"}</div>
              <div className="mt-2">{locale === "en" ? "Keep it on system mode for daytime light theme and automatic dark mode at night." : "日常使用建议保持“跟随系统”，白天走浅色，夜间自动切到深色工作台。"}</div>
            </div>
          </DetailPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <PanelCard
            title={locale === "en" ? "Deployment Readiness" : "部署准备"}
            description={
              locale === "en"
                ? "Use Tencent Cloud as the primary runtime and confirm environment, storage, and access control before wider sharing."
                : "以腾讯云作为主运行环境，在扩大共享前先确认环境变量、存储方式和访问控制。"
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="theme-panel-muted rounded-[22px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">Access</div>
                <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">
                  {locale === "en"
                    ? "Use PREVIEW_ACCESS_ENABLED and PREVIEW_ACCESS_PASSWORD so only invited teammates or test users can open the workspace."
                    : "通过 `PREVIEW_ACCESS_ENABLED` 和 `PREVIEW_ACCESS_PASSWORD` 控制访问，只给内部团队或受邀测试用户开放工作台。"}
                </div>
              </div>
              <div className="theme-panel-muted rounded-[22px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">Storage</div>
                <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">
                  {locale === "en"
                    ? "Local uploads are acceptable on your self-hosted Tencent Cloud server for early production, but object storage is still recommended before broader sharing."
                    : "当前自托管在腾讯云服务器上，本地上传可支持早期生产使用；如果后续扩大共享，仍建议切到对象存储。"}
                </div>
              </div>
            </div>
          </PanelCard>

          <DetailPanel title={locale === "en" ? "Launch Checklist" : "上线清单"}>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Must Have" : "必配项"}</div>
              <div className="mt-2">
                {locale === "en"
                  ? "Set DATABASE_URL, APP_BASE_URL, preview password, and at least one real model provider."
                  : "至少配置好 `DATABASE_URL`、`APP_BASE_URL`、测试口令，以及一套真实模型 provider。"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Recommended" : "建议项"}</div>
              <div className="mt-2">
                {locale === "en"
                  ? "Enable Tavily plus YouTube/X live connectors if you need real trend evidence in the live workspace."
                  : "如果要在当前正式工作台里看到真实趋势来源，建议打开 Tavily，以及 YouTube / X live connector。"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Before Wider Sharing" : "扩大共享前"}</div>
              <div className="mt-2">
                {locale === "en"
                  ? "Replace local uploads, add a real auth layer, and define a backup/export path for project assets."
                  : "在面向更多用户前，先替换本地上传、补账号体系，并明确项目资产的备份与导出方案。"}
              </div>
            </div>
          </DetailPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <PanelCard title={locale === "en" ? "Models & Web Search" : "模型与联网"} description={locale === "en" ? "OpenAI, Gemini, DeepSeek, and Qwen are supported. News search supports Mock and Tavily." : "当前支持 OpenAI、Gemini、DeepSeek 与 Qwen，新闻搜索支持 Mock 与 Tavily。"}>
            <SettingsForm
              initial={{
                llmProvider: settings.llmProvider,
                llmModel: settings.llmModel,
                llmMockMode: settings.llmMockMode,
                openaiApiKey: settings.openaiApiKey,
                geminiApiKey: settings.geminiApiKey,
                deepseekApiKey: settings.deepseekApiKey,
                qwenApiKey: settings.qwenApiKey,
                llmRouting: settings.llmRouting,
                newsSearchProvider: settings.newsSearchProvider,
                newsSearchMockMode: settings.newsSearchMockMode,
                tavilyApiKey: settings.tavilyApiKey,
                appBaseUrl: settings.appBaseUrl,
              }}
            />
          </PanelCard>

          <DetailPanel title={locale === "en" ? "Current Capabilities" : "当前能力"}>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Model Orchestration" : "模型编排"}</div>
              <div className="mt-2">
                {locale === "en" ? "A unified provider abstraction powers Script Rewriter, Scene Classification, and Asset Dependency Analyzer." : "统一 provider 抽象会驱动 Script Rewriter、Scene Classification 和 Asset Dependency Analyzer。"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Web Search" : "联网搜索"}</div>
              <div className="mt-2">{locale === "en" ? "News search adds fresh evidence into trend research, topic scoring, and report summaries." : "新闻搜索会在趋势研究时补充最新新闻证据，用于趋势主题和报告摘要。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Recommended Setup" : "建议起步"}</div>
              <div className="mt-2">{locale === "en" ? "Disable mock first, configure Gemini or OpenAI, then enable Tavily and rerun the full dashboard workflow." : "先关掉 mock，配置 Gemini 或 OpenAI，再把 Tavily 打开，最后重跑 Dashboard 全流程。"}</div>
            </div>
          </DetailPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <PanelCard title={locale === "en" ? "Project Management" : "项目管理"} description={locale === "en" ? "Create, open, archive, or restore projects from one place." : "在同一页创建新项目、切换项目、归档或恢复项目。"}>
            <ProjectManager
              initialProjects={projects}
              brandProfiles={brandProfiles.map((item) => ({ id: item.id, brand_name: item.brand_name }))}
              industryTemplates={industryTemplates.map((item) => ({ id: item.id, industry_name: item.industry_name }))}
            />
          </PanelCard>

          <DetailPanel title={locale === "en" ? "Management Notes" : "管理建议"}>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "New Project" : "新项目"}</div>
              <div className="mt-2">{locale === "en" ? "A new project immediately creates initial research, trends, and a report shell for fast exploration." : "新项目会立即创建初始 research、趋势和报告，适合快速启动题目探索。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Archive" : "归档"}</div>
              <div className="mt-2">{locale === "en" ? "Archiving does not delete data. It only marks the project as ARCHIVED to keep the workspace clean." : "归档不会删除数据，只是把项目状态切到 `ARCHIVED`，避免工作台列表混乱。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Open" : "切换"}</div>
              <div className="mt-2">{locale === "en" ? "Selecting Open returns to the dashboard with the projectId attached so you can continue the workflow." : "点击“打开”会直接带上 `projectId` 跳回 Dashboard，方便继续执行工作流。"}</div>
            </div>
          </DetailPanel>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
