import { LanguageSettings } from "@/components/settings/language-settings";
import { ProjectManager } from "@/components/settings/project-manager";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { Disclosure } from "@/components/ui/disclosure";
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
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.settings.eyebrow}
          title={text.pages.settings.title}
          description={text.pages.settings.description}
          locale={locale}
        />

        {/* ── Row 1: Theme & Language (lightweight, equal halves) ── */}
        <div className="grid gap-6 md:grid-cols-2">
          <PanelCard title={locale === "en" ? "Theme" : "界面外观"} description={locale === "en" ? "Choose light, dark, or follow system." : "切换莫兰迪浅色、深色，或保持跟随系统。"}>
            <ThemeSettings />
          </PanelCard>

          <PanelCard title={text.common.localeTitle} description={text.common.localeDesc}>
            <LanguageSettings initialLocale={locale} />
          </PanelCard>
        </div>

        {/* ── Row 2: Models & Web Search (full-width, core config) ── */}
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
              googleSearchApiKey: settings.googleSearchApiKey,
              googleSearchCx: settings.googleSearchCx,
              appBaseUrl: settings.appBaseUrl,
            }}
          />
        </PanelCard>

        {/* ── Row 3: Deployment & Platform Notes (collapsed help text) ── */}
        <Disclosure
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5"
          summaryClassName="text-sm font-medium text-[var(--text-1)]"
          contentClassName="mt-4 space-y-6"
          title={locale === "en" ? "Deployment & Platform Notes" : "部署说明与上线清单"}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">Access</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                {locale === "en"
                  ? "Use PREVIEW_ACCESS_ENABLED and PREVIEW_ACCESS_PASSWORD so only invited teammates or test users can open the workspace."
                  : "通过 PREVIEW_ACCESS_ENABLED 和 PREVIEW_ACCESS_PASSWORD 控制访问，只给内部团队或受邀测试用户开放工作台。"}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">Storage</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                {locale === "en"
                  ? "Local uploads are acceptable on your self-hosted Tencent Cloud server for early production, but object storage is still recommended before broader sharing."
                  : "当前自托管在腾讯云服务器上，本地上传可支持早期生产使用；如果后续扩大共享，仍建议切到对象存储。"}
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Must Have" : "必配项"}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                {locale === "en"
                  ? "Set DATABASE_URL, APP_BASE_URL, preview password, and at least one real model provider."
                  : "至少配置好 DATABASE_URL、APP_BASE_URL、测试口令，以及一套真实模型 provider。"}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Recommended" : "建议项"}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                {locale === "en"
                  ? "Enable Tavily plus YouTube/X live connectors if you need real trend evidence in the live workspace."
                  : "如果要在当前正式工作台里看到真实趋势来源，建议打开 Tavily，以及 YouTube / X live connector。"}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Before Wider Sharing" : "扩大共享前"}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                {locale === "en"
                  ? "Replace local uploads, add a real auth layer, and define a backup/export path for project assets."
                  : "在面向更多用户前，先替换本地上传、补账号体系，并明确项目资产的备份与导出方案。"}
              </div>
            </div>
          </div>
        </Disclosure>

        {/* ── Row 4: Project Management (full-width, core interaction) ── */}
        <PanelCard title={locale === "en" ? "Project Management" : "项目管理"} description={locale === "en" ? "Create, open, archive, or restore projects from one place." : "在同一页创建新项目、切换项目、归档或恢复项目。"}>
          <ProjectManager
            initialProjects={projects}
            brandProfiles={brandProfiles.map((item) => ({ id: item.id, brand_name: item.brand_name }))}
            industryTemplates={industryTemplates.map((item) => ({ id: item.id, industry_name: item.industry_name }))}
            locale={locale}
          />
        </PanelCard>
      </div>
    </WorkspaceLayout>
  );
}
