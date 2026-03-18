import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorPanel } from "@/components/ui/state-panel";
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
  const workspaceResult = await (projectId
    ? workspaceQueryService
        .getProjectWorkspace(projectId)
        .then((value) => ({ ok: true as const, value }))
        .catch(() => ({ ok: false as const, value: null }))
    : Promise.resolve({ ok: true as const, value: null }));
  const workspace = workspaceResult.value;
  const workspaceLoadFailed = Boolean(projectId) && !workspaceResult.ok;

  const modeLabel =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? locale === "en" ? "Short Video" : "短视频"
      : workspace?.workspaceMode === "COPYWRITING"
        ? locale === "en" ? "Copywriting" : "文案写作"
        : workspace?.workspaceMode === "PROMOTION"
          ? locale === "en" ? "Promotion" : "宣传推广"
          : null;

  const zh = locale === "zh";

  const ui = {
    // ── Getting Started ──
    gettingStartedTitle: zh ? "快速上手" : "Getting Started",
    gettingStartedDesc: zh
      ? "第一次使用？按这个顺序跑通一个完整流程。"
      : "First time? Follow this flow to run through a complete cycle.",
    step1: zh ? "1. 打开「今日工作台」" : "1. Open Today's Workbench",
    step2: zh ? "2. 选择关键词池 → 勾选关键词 → 搜索" : "2. Pick a keyword pool → select keywords → search",
    step3: zh ? "3. 从搜索结果里勾选事实素材（新闻 / 国内热点证据）" : "3. Select fact materials from search results (news / CN evidence)",
    step4: zh ? "4. 从热度卡片点「+ 选题参考」加入趋势信号" : "4. Click '+ Topic Reference' on trend cards to add trend signals",
    step5: zh ? "5. 在底部素材篮子确认后，点「生成脚本」" : "5. Review the material basket, then click 'Generate Script'",
    step6: zh ? "6. 系统会自动生成脚本并拆分为镜头（ScriptScene）" : "6. The system generates a script and splits it into scenes automatically",
    step7: zh ? "7. 在脚本实验台预览和编辑，之后进入分镜、素材和生成执行" : "7. Preview and edit in Script Lab, then move to storyboard, assets, and rendering",
    currentMode: (mode: string) => zh ? `当前项目模式是「${mode}」。` : `Current project mode is "${mode}".`,
    noProjectYet: zh ? "还没有选定项目。" : "No project selected yet.",
    shortestPath: zh
      ? "最短路径：今日工作台 → 选素材 → 生成脚本 → 脚本实验台 → 分镜。"
      : "Shortest path: Today → select materials → generate script → Script Lab → storyboard.",
    goToToday: zh ? "去今日工作台" : "Go to Today",
    backToOverview: zh ? "返回总览" : "Back to Overview",

    // ── Today Workbench ──
    todayTitle: zh ? "今日工作台（核心入口）" : "Today's Workbench (Main Entry)",
    todayDesc: zh
      ? "这是你每天的起点。从搜索到选题到脚本生成，一页完成。"
      : "Your daily starting point. From search to topic selection to script generation, all in one page.",
    todayFeatures: zh
      ? [
          "关键词池：预设关键词分组，支持切换、勾选、添加和删除",
          "分批搜索：选中的关键词自动分批（每批 ≤3 词，最多 4 批），并行请求后合并去重",
          "搜索结果分两列：Google 新闻样本 + 国内热点证据，每列 header 内嵌数据源状态 badge",
          "热度卡片：基于 YouTube / X 的趋势信号，可点「+ 选题参考」加入素材篮子",
          "素材篮子：底部统一展示已收集素材，按角色分组 — 📰 事实素材 / 📡 选题参考",
          "生成脚本：至少 1 条事实素材才能生成，选题参考用于调整角度和 framing",
        ]
      : [
          "Keyword pool: preset keyword groups with select, add, and delete",
          "Batch search: selected keywords auto-split into batches (≤3 per batch, max 4), merged & deduped",
          "Results in 2 columns: Google News + CN Indexed Evidence, with status badge per section",
          "Trend cards: YouTube/X trend signals, click '+ Topic Reference' to collect",
          "Material basket: shows collected items grouped by role — 📰 Facts / 📡 Trend References",
          "Generate script: requires ≥1 fact item; trend references influence angle and framing only",
        ],

    // ── Material Roles ──
    rolesTitle: zh ? "素材角色说明" : "Material Roles",
    rolesDesc: zh
      ? "不同来源在脚本生成中扮演不同角色，互不混淆。"
      : "Different sources play different roles in script generation.",
    factLabel: zh ? "📰 事实素材" : "📰 Fact Materials",
    factDesc: zh
      ? "来自 Google 新闻 / 国内热点证据。作为脚本主体的事实依据，LLM 会基于这些内容撰写主体。"
      : "From Google News or CN indexed evidence. Used as factual basis for the script body.",
    trendLabel: zh ? "📡 选题参考" : "📡 Trend References",
    trendDesc: zh
      ? "来自 YouTube / X 热度卡片。仅用于影响开场、重点排序和叙事框架，不作为事实引用。"
      : "From YouTube/X trend cards. Only influences opening, focus priority, and narrative framing — never cited as fact.",

    // ── Work Modes ──
    workModesTitle: zh ? "三种工作模式" : "Three Work Modes",
    workModesDesc: zh ? "模式不同，页面导航和推荐流程会自动收缩。" : "Navigation and recommended flow adjust automatically based on mode.",
    shortVideoLabel: zh ? "短视频" : "Short Video",
    shortVideoDesc: zh
      ? "关注：今日工作台 → 趋势 → 脚本 → 镜头拆解 → 分镜与素材准备。"
      : "Focus: Today → trends → script → scene decomposition → storyboard & assets.",
    copywritingLabel: zh ? "文案写作" : "Copywriting",
    copywritingDesc: zh
      ? "关注：任务单 → 宣传主稿 → 平台适配稿 → 文案质量增强。"
      : "Focus: brief → master copy → platform adaptations → copy quality enhancement.",
    promotionLabel: zh ? "宣传推广" : "Promotion",
    promotionDesc: zh
      ? "关注：推广目标 → 平台适配 → 合规检查 → 复盘优化。"
      : "Focus: promotion goals → platform adaptation → compliance → post-campaign review.",

    // ── Page Guide ──
    pageGuideTitle: zh ? "主要页面怎么用" : "Page Guide",
    pageGuideDesc: zh ? "先理解每个页面只负责什么，再开始操作，会更顺。" : "Understand what each page is responsible for before you start.",

    // ── Script Pipeline ──
    scriptPipelineTitle: zh ? "脚本生成流程" : "Script Pipeline",
    scriptPipelineDesc: zh
      ? "从素材到脚本到镜头的完整链路。"
      : "The complete chain from materials to script to scenes.",
    pipelineSteps: zh
      ? [
          "在今日工作台勾选素材 → 点「生成脚本」",
          "系统创建 Project + 调用 LLM 生成脚本（事实素材写主体，选题参考影响角度）",
          "脚本生成后自动跳转到脚本实验台",
          "后台异步调用 LLM 拆分为多个 ScriptScene（镜头）",
          "拆分完成后刷新脚本实验台即可看到镜头列表",
          "后续进入分镜编排 → 素材准备 → 生成执行",
        ]
      : [
          "Select materials in Today → click 'Generate Script'",
          "System creates a Project + calls LLM (facts → body, trends → framing)",
          "Auto-redirect to Script Lab after generation",
          "Background LLM call splits script into ScriptScenes",
          "Refresh Script Lab to see the scene list",
          "Continue to storyboard → asset prep → render pipeline",
        ],

    // ── FAQ ──
    faqTitle: zh ? "常见问题" : "FAQ",
    faqDesc: zh ? "先看这里，能解决大部分初期困惑。" : "Check here first to resolve most early questions.",
    faq1Q: zh ? "搜索超时怎么办？" : "What if search times out?",
    faq1A: zh
      ? "系统已采用分批搜索策略（每批 ≤3 个关键词）。如果仍然超时，减少选中的关键词数量，或检查网络。部分批次失败不影响已成功的结果。"
      : "The system uses batch search (≤3 keywords per batch). If still timing out, reduce selected keywords or check network. Partial batch failures don't affect successful results.",
    faq2Q: zh ? "为什么只有选题参考不能生成脚本？" : "Why can't I generate a script with only trend references?",
    faq2A: zh
      ? "选题参考（YouTube / X 热度卡片）只用于调整角度和叙事框架，不能作为事实依据。至少勾选 1 条来自新闻 / 国内热点的事实素材后才能生成。"
      : "Trend references only influence framing — they can't serve as factual basis. Select at least 1 news/CN evidence item.",
    faq3Q: zh ? "脚本拆分（Scene Split）失败了怎么办？" : "What if scene split fails?",
    faq3A: zh
      ? "脚本实验台会显示拆分状态。如果状态为「失败」，可以重新调用拆分接口（POST /api/scripts/:id/split-scenes），使用 force: true 强制重新拆分。"
      : "Script Lab shows split status. If 'failed', re-call the split API (POST /api/scripts/:id/split-scenes) with force: true.",
    faq4Q: zh ? "为什么我找不到某个模块？" : "Why can't I find a certain module?",
    faq4A: zh
      ? "系统会按项目模式自动收缩导航。短视频、文案写作、宣传推广看到的重点模块不完全一样。"
      : "The system automatically adjusts navigation based on project mode.",
    faq5Q: zh ? "为什么生成结果像摘要，不像宣传文案？" : "Why does the output read like a summary, not marketing copy?",
    faq5A: zh
      ? "通常是因为项目介绍、核心想法或使用场景没写清楚，或者没有提供参考样稿。优先补输入，再点「诊断并增强主稿」。"
      : "Usually because the project intro, core idea, or usage scenario wasn't filled in clearly. Improve inputs first, then use 'Diagnose & Enhance'.",

    // ── Changelog ──
    changelogTitle: zh ? "版本更新记录" : "Changelog",
    changelogDesc: zh ? "功能变化会先记在这里，再同步到手册。" : "Feature changes are logged here first, then synced to the manual.",
    goToSettings: zh ? "去设置页" : "Go to Settings",
    healthCheck: zh ? "健康检查" : "Health Check",
  };

  const pageGuideItems: [string, string][] = zh
    ? [
        ["今日工作台", "每天的起点。搜索热点、收集素材、生成脚本，一页搞定。"],
        ["总览", "看当前项目、推荐下一步，并决定是继续还是新建。"],
        ["创意任务单", "把目标、核心表达和 CTA 先写清楚。"],
        ["趋势研究", "深入分析趋势主题、证据链和可生产性评分。"],
        ["脚本实验台", "预览、编辑 AI 生成的脚本，查看自动拆分的镜头（ScriptScene）列表。"],
        ["分镜编排", "判断镜头能不能开工、缺什么素材，安排分镜。"],
        ["图片与视频生成", "把提示词、镜头、素材和生成任务串成工作流。"],
        ["宣传文案与运营", "先生成主稿，再增强、派生平台稿、做合规检查。"],
        ["品牌档案", "沉淀品牌 voice、禁用表达和内容支柱。"],
        ["行业模板", "沉淀行业边界、竞品关键词和风险词。"],
        ["项目中心", "统一搜索、筛选、置顶和归档多个项目。"],
      ]
    : [
        ["Today's Workbench", "Your daily starting point. Search trends, collect materials, and generate scripts in one page."],
        ["Dashboard", "View the current project, see the recommended next step, and decide whether to continue or start fresh."],
        ["Brief Studio", "Define the goal, core message, and CTA first."],
        ["Trend Explorer", "Deep-dive into trend topics, evidence chains, and producibility scores."],
        ["Script Lab", "Preview and edit AI-generated scripts, view auto-split scenes (ScriptScenes)."],
        ["Storyboard Planner", "Check if scenes are ready to shoot and what assets are missing."],
        ["Render Lab", "Turn scenes, prompts, assets, and generation jobs into one workflow."],
        ["Marketing Ops", "Generate the master copy first, then enhance, derive platform versions, and run compliance."],
        ["Brand Profiles", "Capture brand voice, banned expressions, and content pillars."],
        ["Industry Templates", "Capture industry boundaries, competitor keywords, and risk terms."],
        ["Project Hub", "Search, filter, pin, and archive projects in one place."],
      ];

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.help.eyebrow}
          title={text.pages.help.title}
          description={text.pages.help.description}
          locale={locale}
        />

        {workspaceLoadFailed ? (
          <ErrorPanel
            title={zh ? "帮助中心暂时无法读取项目上下文" : "Help Center Is Temporarily Running Without Project Context"}
            description={
              zh
                ? "页面本身仍可访问，但当前项目上下文刚刚没有从服务器成功读取。"
                : "The page is still available, but the current project context could not be loaded from the server just now."
            }
            locale={locale}
          />
        ) : null}

        {/* ── Getting Started ── */}
        <PanelCard title={ui.gettingStartedTitle} description={ui.gettingStartedDesc}>
          <div className="space-y-4 text-sm leading-7 text-[var(--text-2)]">
            <div className="rounded-xl bg-[var(--surface-muted)] p-4">
              {ui.step1}<br />
              {ui.step2}<br />
              {ui.step3}<br />
              {ui.step4}<br />
              {ui.step5}<br />
              {ui.step6}<br />
              {ui.step7}
            </div>
            <div>
              {modeLabel ? ui.currentMode(modeLabel) : ui.noProjectYet}{" "}
              {ui.shortestPath}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/today" className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">
                {ui.goToToday}
              </Link>
              <Link href={projectId ? `/?projectId=${projectId}` : "/"} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
                {ui.backToOverview}
              </Link>
            </div>
          </div>
        </PanelCard>

        {/* ── Today Workbench Features ── */}
        <PanelCard title={ui.todayTitle} description={ui.todayDesc}>
          <div className="grid gap-3 md:grid-cols-2">
            {ui.todayFeatures.map((feature) => (
              <div key={feature} className="flex items-start gap-2 rounded-xl bg-[var(--surface-muted)] p-3">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span className="text-sm leading-6 text-[var(--text-2)]">{feature}</span>
              </div>
            ))}
          </div>
        </PanelCard>

        {/* ── Material Roles ── */}
        <PanelCard title={ui.rolesTitle} description={ui.rolesDesc}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-base font-semibold text-emerald-700 dark:text-emerald-400">{ui.factLabel}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.factDesc}</div>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="text-base font-semibold text-violet-700 dark:text-violet-400">{ui.trendLabel}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.trendDesc}</div>
            </div>
          </div>
        </PanelCard>

        {/* ── Script Pipeline ── */}
        <PanelCard title={ui.scriptPipelineTitle} description={ui.scriptPipelineDesc}>
          <div className="space-y-2">
            {ui.pipelineSteps.map((step, i) => (
              <div key={step} className="flex items-start gap-3 rounded-xl bg-[var(--surface-muted)] p-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-xs font-bold text-[var(--accent)]">
                  {i + 1}
                </span>
                <span className="text-sm leading-6 text-[var(--text-2)]">{step}</span>
              </div>
            ))}
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

        {/* ── FAQ ── */}
        <Disclosure
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5"
          summaryClassName="text-sm font-medium text-[var(--text-1)]"
          contentClassName="mt-4 space-y-6"
          title={ui.faqTitle}
        >
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
            <div>
              <div className="font-medium text-[var(--text-1)]">{ui.faq4Q}</div>
              <div className="mt-1">{ui.faq4A}</div>
            </div>
            <div>
              <div className="font-medium text-[var(--text-1)]">{ui.faq5Q}</div>
              <div className="mt-1">{ui.faq5A}</div>
            </div>
          </div>
        </Disclosure>

        {/* ── Changelog ── */}
        <PanelCard title={ui.changelogTitle} description={ui.changelogDesc}>
          <div className="flex flex-wrap gap-3">
            <Link href="/settings" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
              {ui.goToSettings}
            </Link>
            <a href="/api/health" target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
              {ui.healthCheck}
            </a>
          </div>
        </PanelCard>
      </div>
    </WorkspaceLayout>
  );
}
