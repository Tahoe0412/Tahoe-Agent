import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

export default async function HelpCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId } = await searchParams;
  const workspace = projectId ? await workspaceQueryService.getProjectWorkspace(projectId) : null;

  const modeLabel =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? locale === "en" ? "Short Video" : "短视频"
      : workspace?.workspaceMode === "COPYWRITING"
        ? locale === "en" ? "Copywriting" : "文案写作"
        : workspace?.workspaceMode === "PROMOTION"
          ? locale === "en" ? "Promotion" : "宣传推广"
          : null;

  const ui = {
    gettingStartedTitle: locale === "en" ? "Getting Started" : "先这样开始",
    gettingStartedDesc: locale === "en" ? "Don\u0027t try to view every module on your first visit. Run through one project end-to-end first." : "第一次使用时，不要试图把所有模块都看完，先跑通一个项目。",
    step1: locale === "en" ? "1. Create a project" : "1. 新建项目",
    step2: locale === "en" ? "2. Choose a work mode" : "2. 选择工作模式",
    step3: locale === "en" ? "3. Fill in the project intro, core idea, and raw input" : "3. 填写项目介绍、核心想法、原始输入",
    step4: locale === "en" ? "4. For copywriting projects, also set writing mode, output style, copy length, and usage scenario" : "4. 如果是文案类项目，再设置写作模式、输出风格、文案长度、使用场景",
    step5: locale === "en" ? "5. Add a style reference / sample post if needed" : "5. 需要时补风格参照 / 参考样稿",
    step6: locale === "en" ? "6. Generate the first draft, then enhance" : "6. 先生成第一版，再增强",
    currentMode: (mode: string) => locale === "en" ? `Current project mode is "${mode}".` : `当前项目模式是「${mode}」。`,
    noProjectYet: locale === "en" ? "No project selected yet." : "还没有选定项目。",
    shortestPath: locale === "en" ? "If you just want to run through one complete flow, start from the shortest path: Overview → Trend Explorer → Marketing Ops." : "如果你只想先跑通一个完整流程，优先从「总览 → 趋势研究 → 宣传文案与运营」这条最短路径开始。",
    backToOverview: locale === "en" ? "Back to Overview" : "返回总览",
    goToMarketingOps: locale === "en" ? "Go to Marketing Ops" : "去宣传文案与运营",
    workModesTitle: locale === "en" ? "Three Work Modes" : "三种工作模式",
    workModesDesc: locale === "en" ? "Navigation and recommended flow adjust automatically based on mode." : "模式不同，页面导航和推荐流程会自动收缩。",
    shortVideoLabel: locale === "en" ? "Short Video" : "短视频",
    shortVideoDesc: locale === "en" ? "Focus: trends, script rewriting, scene decomposition, storyboard and asset planning." : "更关注：趋势、脚本重构、镜头拆解、分镜与素材准备。",
    copywritingLabel: locale === "en" ? "Copywriting" : "文案写作",
    copywritingDesc: locale === "en" ? "Focus: brief, master copy, platform adaptations, and copy quality enhancement." : "更关注：任务单、宣传主稿、平台稿和文案质量增强。",
    promotionLabel: locale === "en" ? "Promotion" : "宣传推广",
    promotionDesc: locale === "en" ? "Focus: promotion goals, platform adaptation, compliance checks, and post-campaign review." : "更关注：推广目标、平台适配、合规检查和复盘优化。",
    pageGuideTitle: locale === "en" ? "Page Guide" : "主要页面怎么用",
    pageGuideDesc: locale === "en" ? "Understand what each page is responsible for before you start." : "先理解每个页面只负责什么，再开始操作，会更顺。",
    copyQualityTitle: locale === "en" ? "Improving Copy Quality" : "如何提高文案质量",
    copyQualityDesc: locale === "en" ? "Don\u0027t just keep regenerating. Improve input quality first." : "不要只反复点生成，先把输入质量提上去。",
    priorityInputsLabel: locale === "en" ? "Prioritize filling in:" : "优先写清这几项：",
    inputItems: locale === "en"
      ? ["Project Intro", "Core Idea", "Raw Input", "Writing Mode", "Output Style", "Copy Length", "Usage Scenario", "Style Reference / Sample Post"]
      : ["项目介绍", "核心想法", "原始输入", "写作模式", "输出风格", "文案长度", "使用场景", "风格参照 / 参考样稿"],
    enhanceTip: locale === "en" ? "If the first draft isn\u0027t good enough, use \u0022Diagnose & Enhance\u0022 instead of changing prompts over and over. The system already provides a quality score, issues, and enhancement focus." : "如果第一版不够好，优先用「诊断并增强主稿」，不要直接换十几次 prompt。系统已经会给你质量分、问题和增强重点，再生成更强的新版本。",
    sampleTip: locale === "en" ? "For style references, paste 1–3 complete sample posts. The system learns tone, rhythm, sentence length, paragraph structure and emotional arc, but won\u0027t copy content." : "参考样稿建议贴 1 到 3 段完整文案。系统会学习语气、节奏、句长、段落结构和情绪推进，但不会照抄内容。",
    faqTitle: locale === "en" ? "FAQ" : "常见问题",
    faqDesc: locale === "en" ? "Check here first to resolve most early questions." : "先看这里，能解决大部分初期困惑。",
    faq1Q: locale === "en" ? "Why does the output read like a summary, not marketing copy?" : "为什么生成结果像摘要，不像宣传文案？",
    faq1A: locale === "en" ? "Usually because the project intro, core idea, or usage scenario wasn\u0027t filled in clearly, or no sample post was provided. Improve inputs first, then click \u0022Diagnose & Enhance\u0022." : "通常是因为项目介绍、核心想法或使用场景没写清楚，或者没有提供参考样稿。优先补输入，再点「诊断并增强主稿」。",
    faq2Q: locale === "en" ? "Why can\u0027t I find a certain module?" : "为什么我找不到某个模块？",
    faq2A: locale === "en" ? "The system automatically adjusts navigation based on project mode. Short Video, Copywriting, and Promotion modes show different key modules." : "系统会按项目模式自动收缩导航。短视频、文案写作、宣传推广看到的重点模块不完全一样。",
    faq3Q: locale === "en" ? "Why is deleting projects not recommended?" : "为什么不建议直接删除项目？",
    faq3A: locale === "en" ? "Projects contain accumulated assets: trends, briefs, scripts, platform copies, and compliance records. Archive first, don\u0027t hard-delete." : "项目里沉淀的是资产，包括趋势、任务单、脚本、平台稿和合规记录。建议先归档，不要轻易硬删除。",
    changelogTitle: locale === "en" ? "Changelog" : "版本更新记录",
    changelogDesc: locale === "en" ? "Feature changes are logged here first, then synced to the manual." : "功能变化会先记在这里，再同步到手册。",
    changelogViewDocs: locale === "en" ? "You can view the full record in the documentation:" : "你可以在文档里查看完整记录：",
    goToSettings: locale === "en" ? "Go to Settings" : "去设置页",
    healthCheck: locale === "en" ? "Health Check" : "健康检查",
    changelogMaintenance: locale === "en" ? "Recommended maintenance flow:" : "当前建议维护方式：",
    changelogStep1: locale === "en" ? "1. Update release notes first with each version" : "1. 每次版本先更新 release notes",
    changelogStep2: locale === "en" ? "2. Sync user manual if flows or pages changed" : "2. 如果流程和页面有变化，再同步更新用户手册",
    changelogStep3: locale === "en" ? "3. Manual should only contain user-facing info, not dev details" : "3. 手册只写用户需要知道的内容，不写底层开发细节",
  };

  const pageGuideItems: [string, string][] = locale === "en"
    ? [
        ["Overview", "View the current project, see the recommended next step, and decide whether to continue or start fresh."],
        ["Brief Studio", "Define the goal, core message, and CTA first."],
        ["Trend Explorer", "Focus on the single strongest topic by default, then review 2 alternates."],
        ["Script Lab", "Edit the AI-rewritten text first; advanced fields expand on demand."],
        ["Scene Planner", "Check if scenes are ready to shoot and what assets are missing, then review advanced params."],
        ["Marketing Ops", "Generate the master copy first, then enhance, derive platform versions, and run compliance."],
        ["Brand Profiles", "Capture brand voice, banned expressions, and content pillars."],
        ["Industry Templates", "Capture industry boundaries, competitor keywords, and risk terms."],
        ["Project Hub", "Search, filter, pin, and archive projects in one place."],
      ]
    : [
        ["总览", "看当前项目、推荐下一步，并决定是继续还是新建。"],
        ["创意任务单", "把目标、核心表达和 CTA 先写清楚。"],
        ["趋势研究", "默认只看最值得做的 1 个主题，再看 2 个备选。"],
        ["脚本实验台", "先修改 AI 重构文本，其他高级字段按需展开。"],
        ["分镜编排", "先判断镜头能不能开工、缺什么素材，再看高级参数。"],
        ["宣传文案与运营", "先生成主稿，再增强、派生平台稿、做合规检查。"],
        ["品牌档案", "沉淀品牌 voice、禁用表达和内容支柱。"],
        ["行业模板", "沉淀行业边界、竞品关键词和风险词。"],
        ["项目中心", "统一搜索、筛选、置顶和归档多个项目。"],
      ];

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={text.pages.help.eyebrow}
          title={text.pages.help.title}
          description={text.pages.help.description}
        />

        {/* ── Getting Started ── */}
        <PanelCard title={ui.gettingStartedTitle} description={ui.gettingStartedDesc}>
          <div className="space-y-4 text-sm leading-7 text-[var(--text-2)]">
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              {ui.step1}<br />
              {ui.step2}<br />
              {ui.step3}<br />
              {ui.step4}<br />
              {ui.step5}<br />
              {ui.step6}
            </div>
            <div>
              {modeLabel ? ui.currentMode(modeLabel) : ui.noProjectYet}{" "}
              {ui.shortestPath}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={projectId ? `/?projectId=${projectId}` : "/"} className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">
                {ui.backToOverview}
              </Link>
              <Link href={projectId ? `/marketing-ops?projectId=${projectId}` : "/marketing-ops"} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
                {ui.goToMarketingOps}
              </Link>
            </div>
          </div>
        </PanelCard>

        {/* ── Work Modes ── */}
        <PanelCard title={ui.workModesTitle} description={ui.workModesDesc}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <div className="text-base font-semibold text-[var(--text-1)]">{ui.shortVideoLabel}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.shortVideoDesc}</div>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <div className="text-base font-semibold text-[var(--text-1)]">{ui.copywritingLabel}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.copywritingDesc}</div>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              <div className="text-base font-semibold text-[var(--text-1)]">{ui.promotionLabel}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.promotionDesc}</div>
            </div>
          </div>
        </PanelCard>

        {/* ── Page Guide ── */}
        <PanelCard title={ui.pageGuideTitle} description={ui.pageGuideDesc}>
          <div className="grid gap-4 md:grid-cols-3">
            {pageGuideItems.map(([title, desc]) => (
              <div key={title} className="rounded-xl bg-[var(--surface-muted)] p-4">
                <div className="text-base font-semibold text-[var(--text-1)]">{title}</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{desc}</div>
              </div>
            ))}
          </div>
        </PanelCard>

        {/* ── Copy Quality & FAQ (collapsed by default) ── */}
        <Disclosure
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5"
          summaryClassName="text-sm font-medium text-[var(--text-1)]"
          contentClassName="mt-4 space-y-6"
          title={locale === "en" ? "Copy Quality Tips & FAQ" : "文案质量指南与常见问题"}
        >
          <PanelCard title={ui.copyQualityTitle} description={ui.copyQualityDesc}>
            <div className="space-y-3 text-sm leading-7 text-[var(--text-2)]">
              <div className="rounded-xl bg-[var(--surface-muted)] p-4">
                {ui.priorityInputsLabel}
                <ul className="mt-1 list-inside list-disc">
                  {ui.inputItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>{ui.enhanceTip}</div>
              <div>{ui.sampleTip}</div>
            </div>
          </PanelCard>

          <PanelCard title={ui.faqTitle} description={ui.faqDesc}>
            <div className="space-y-4 text-sm leading-7 text-[var(--text-2)]">
              <div>
                <div className="font-medium text-[var(--text-1)]">{ui.faq1Q}</div>
                <div className="mt-1">{ui.faq1A}</div>
              </div>
              <div>
                <div className="font-medium text-[var(--text-1)]">{ui.faq2Q}</div>
                <div className="mt-1">{ui.faq2A}</div>
              </div>
              <div>
                <div className="font-medium text-[var(--text-1)]">{ui.faq3Q}</div>
                <div className="mt-1">{ui.faq3A}</div>
              </div>
            </div>
          </PanelCard>
        </Disclosure>

        {/* ── Changelog ── */}
        <PanelCard title={ui.changelogTitle} description={ui.changelogDesc}>
          <div className="space-y-3 text-sm leading-7 text-[var(--text-2)]">
            <div>{ui.changelogViewDocs}</div>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
                {ui.goToSettings}
              </Link>
              <a href="/api/health" target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
                {ui.healthCheck}
              </a>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              {ui.changelogMaintenance}<br />
              {ui.changelogStep1}<br />
              {ui.changelogStep2}<br />
              {ui.changelogStep3}
            </div>
          </div>
        </PanelCard>
      </div>
    </WorkspaceLayout>
  );
}
