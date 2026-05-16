import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { ProjectForm } from "@/components/dashboard/project-form";
import { OutputStudio } from "@/components/dashboard/output-studio";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { ProjectContext } from "@/components/workspace/project-context";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { getContentLineMeta, getOutputTypeMeta } from "@/lib/content-line";
import { copy, getLocale } from "@/lib/locale";
import { buildDashboardCreateHref, coerceOutputType, resolveContentLine } from "@/lib/project-intent";
import { getDashboardNextStep } from "@/lib/workflow-navigator";
import { buildProjectContextProject } from "@/lib/build-project-context";
import { WorkspaceQueryService } from "@/services/workspace-query.service";
import { ArrowUpRight, Heart, Newspaper, Sparkles, WalletCards } from "lucide-react";

const workspaceQueryService = new WorkspaceQueryService();

function SummaryPill({ children }: { children: ReactNode }) {
  return <span className="theme-pill rounded-md px-3 py-1.5 text-xs font-medium">{children}</span>;
}

function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="border-t border-[var(--border-soft)] py-4">
      <div className="text-xs font-medium text-[var(--text-3)]">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-1)]">{value}</div>
      <div className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{caption}</div>
    </div>
  );
}

function StartCard({
  href,
  eyebrow,
  title,
  description,
  locale,
  footer,
  featured = false,
}: {
  href: Route;
  eyebrow: string;
  title: string;
  description: string;
  locale: string;
  footer?: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`home-start-card group ${featured ? "home-start-card-featured" : ""}`}
    >
      <div className="home-start-card__content">
        <div className="home-start-card__eyebrow">{eyebrow}</div>
        <div className="home-start-card__title">{title}</div>
        <div className="home-start-card__description">{description}</div>
        {footer ? <div className="home-start-card__footer">{footer}</div> : null}
        <div className="home-start-card__action">
          <span>{locale === "en" ? "Open path" : "进入路径"}</span>
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function StrategyNote({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Newspaper | typeof Heart;
  label: string;
  value: string;
}) {
  return (
    <div className="home-strategy-note">
      <div className="home-strategy-note__icon">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="home-strategy-note__label">{label}</div>
        <div className="home-strategy-note__value">{value}</div>
      </div>
    </div>
  );
}



export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    projectId?: string;
    topic?: string;
    title?: string;
    contentLine?: string;
    outputType?: string;
    ownedMediaPreset?: string;
  }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId, topic, title, contentLine, outputType, ownedMediaPreset } = await searchParams;
  const initialContentLine = resolveContentLine({ contentLine });
  const initialOutputType = coerceOutputType(initialContentLine, outputType);
  const normalizedOwnedMediaPreset =
    ownedMediaPreset === "AI_GROWTH" ||
    ownedMediaPreset === "MONEY_NEVER_SLEEPS" ||
    ownedMediaPreset === "EASTERN_VITALITY"
      ? ownedMediaPreset
      : null;
  const projectFormKey = [initialContentLine, initialOutputType, topic ?? "", title ?? "", normalizedOwnedMediaPreset ?? ""].join(":");
  const [recentProjectsResult, workspaceResult] = await Promise.allSettled([
    workspaceQueryService.listRecentProjects(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);
  const recentProjects = recentProjectsResult.status === "fulfilled" ? recentProjectsResult.value : [];
  const workspace = workspaceResult.status === "fulfilled" ? workspaceResult.value : null;
  const recentProjectsUnavailable = recentProjectsResult.status === "rejected";
  const workspaceLoadFailed = workspaceResult.status === "rejected";
  const loadFailed = Boolean(projectId) && workspaceLoadFailed;
  const nextStep = getDashboardNextStep(workspace, locale);
  const lineMeta = workspace ? getContentLineMeta(workspace.contentLine, locale) : null;
  const outputMeta = workspace ? getOutputTypeMeta(workspace.outputType, locale) : null;

  const headerCopy =
    workspace?.contentLine === "MARKETING"
      ? {
          eyebrow: "MARKETING",
          title: locale === "en" ? "Commercial Services Workspace" : "商业服务工作台",
          description:
            locale === "en"
              ? "Focus on the next client-facing content action and keep delivery details in the background."
              : "先推进下一条客户内容或广告交付，其余细节交给系统在后台处理。",
        }
      : workspace?.contentLine === "MARS_CITIZEN"
        ? {
            eyebrow: "OWNED MEDIA",
            title: locale === "en" ? "Owned Media Workspace" : "内容矩阵工作台",
            description:
              locale === "en"
                ? "Focus on the next publishable article or image package instead of navigating every module."
                : "直接推进下一条可发布图文，而不是先理解所有模块。",
          }
        : text.pages.dashboard;

  const ui =
    locale === "en"
      ? {
          focusTitle: "Current Focus",
          focusDesc: "The page only shows the next important move.",
          nextTitle: "Do this next",
          statusTitle: "Simple Status",
          statusDesc: "Only the numbers that help you decide whether to continue.",
          trendsLabel: "Trends",
          outputsLabel: "Current output",
          storyboardLabel: "Image brief rows",
          reportLabel: "Report",
          reportReady: "Ready",
          reportPending: "Pending",
          focusReasonNoProject: "Start from one topic and one target output. Everything else can stay empty for now.",
          focusReasonStoryboard: "Go straight to the image brief. You do not need to finish the whole pipeline first.",
          focusReasonScript: "Generate the first master draft, then decide whether it needs deeper editing or supporting images.",
          focusReasonRender: "The image brief is ready enough. Move to image production instead of reopening upstream steps.",
          focusReasonMarketing: "Generate the first usable client-facing draft first. Briefs and refinements can follow when needed.",
          moreTitle: "More details",
          briefTitle: "Current brief",
          briefDesc: "Only open this if you need to confirm the message and constraints.",
          noBriefYet: "No brief yet. That is okay if you only want to move fast from topic to first draft.",
          prioritiesTitle: "Current notes",
          prioritiesDesc: "Keep this as a short checklist, not a second dashboard.",
          noProjectTitle: "Project not found",
          noProjectDesc: "The selected project could not be loaded. Create a new one or switch projects.",
          startTitle: "Start here",
          startDesc: "Choose the path that matches what you want to produce right now.",
          quickStartTitle: "Minimum input",
          startTodayTitle: "Find today's topics",
          startTodayDesc: "Trends and source material",
          startMarsTitle: "Build owned-media content",
          startMarsDesc: "Owned-media article package",
          startMarketingTitle: "Build commercial content",
          startMarketingDesc: "Client copy and ad work",
          startRecentTitle: "Continue a recent project",
          startRecentDesc: "Resume the last active thread",
          strategyEyebrow: "Editorial desk",
          strategyTitle: "Build a tighter owned-media system before you expand again.",
          strategyDesc:
            "Start from Toutiao. Turn one topic into a publishable article package, then reuse the same engine for commercial service work.",
          strategyTrackTitle: "Current directions",
          strategyLaunchLabel: "Launch channel",
          strategyLaunchValue: "Toutiao / article + image publishing",
          strategyRevenueLabel: "Revenue loop",
          strategyRevenueValue: "Content / advertising + service / technical delivery",
          strategyFocusLabel: "Current focus",
          strategyFocusValue: "Article quality, packaging quality, and refined static images",
          strategyTrackAi: "AI Briefing · models / agents / product launches",
          strategyTrackMoney: "Global Markets · US / HK / CN equities / macro",
          strategyTrackLife: "Consumer Style · brands / beauty / fashion / trends",
          startTodayFooter: "Research / topic / material",
          startMarsFooter: "Draft / image / publish",
          startMarketingFooter: "Copy / creative / image",
          startRecentFooter: "Last active project",
        }
      : {
          focusTitle: "当前重点",
          focusDesc: "默认只显示下一步最重要的动作。",
          nextTitle: "现在就做这件事",
          statusTitle: "简洁状态",
          statusDesc: "只保留会影响你下一步判断的几个数字。",
          trendsLabel: "趋势",
          outputsLabel: "当前产出",
          storyboardLabel: "配图条目",
          reportLabel: "报告",
          reportReady: "已生成",
          reportPending: "未生成",
          focusReasonNoProject: "从一个主题和一个目标产物开始就够了，其他信息现在都可以先留空。",
          focusReasonStoryboard: "直接去做配图说明，不需要先把整套流程走完。",
          focusReasonScript: "先生成第一版主稿，再决定要不要进入更细的编辑和配图准备。",
          focusReasonRender: "当前配图说明已经足够进入图片生产，不必反复回到上游步骤。",
          focusReasonMarketing: "先拿到第一版可用客户内容，再补任务单、风格和细化约束。",
          moreTitle: "更多信息",
          briefTitle: "当前任务单",
          briefDesc: "只有在你要确认目标、约束和表达口径时，再展开这里。",
          noBriefYet: "当前还没有任务单。如果你只是想快速从主题推进到第一版内容，这并不妨碍继续做。",
          prioritiesTitle: "当前备注",
          prioritiesDesc: "把它当成简短待办，不要把首页重新堆成第二个大总览。",
          noProjectTitle: "项目不存在",
          noProjectDesc: "当前选中的项目没有加载成功。你可以重新创建，或者切换到其他项目。",
          startTitle: "先从这里开始",
          startDesc: "按你现在想产出的内容来选路径，不用先理解整个系统。",
          quickStartTitle: "最少只需要这些",
          startTodayTitle: "今日选题",
          startTodayDesc: "热点与素材",
          startMarsTitle: "内容矩阵",
          startMarsDesc: "自营图文内容包",
          startMarketingTitle: "商业服务",
          startMarketingDesc: "客户内容与广告",
          startRecentTitle: "继续项目",
          startRecentDesc: "回到上次进行中的项目",
          strategyEyebrow: "编辑部入口",
          strategyTitle: "先把内容矩阵做扎实，再扩张渠道和形态。",
          strategyDesc:
            "从头条号启动，把一个主题稳定变成可发布图文包，再把同一套方法复用到商业内容与技术服务收入上。",
          strategyTrackTitle: "当前三条方向",
          strategyLaunchLabel: "启动渠道",
          strategyLaunchValue: "头条号 / 图文发布",
          strategyRevenueLabel: "收入闭环",
          strategyRevenueValue: "内容广告收入 + 服务技术收入",
          strategyFocusLabel: "当前重点",
          strategyFocusValue: "文章质量、包装质量、精细静态配图",
          strategyTrackAi: "AI快讯 · 模型 / Agent / AI 产品动态",
          strategyTrackMoney: "全球股市 · 美股 / 港股 / A股 / 宏观资金",
          strategyTrackLife: "消费时尚 · 品牌 / 美妆 / 服饰 / 趋势",
          startTodayFooter: "研究 / 定题 / 素材",
          startMarsFooter: "主稿 / 配图 / 发布",
          startMarketingFooter: "文案 / 创意 / 配图",
          startRecentFooter: "最近项目",
        };

  const focusReason = !workspace
    ? ui.focusReasonNoProject
    : workspace.outputType === "STORYBOARD_SCRIPT" || workspace.outputType === "AD_STORYBOARD"
      ? workspace.scenePlannerRows.length === 0
        ? ui.focusReasonStoryboard
        : ui.focusReasonRender
      : workspace.contentLine === "MARS_CITIZEN"
        ? ui.focusReasonScript
        : ui.focusReasonMarketing;

  const outputCount =
    workspace?.contentLine === "MARS_CITIZEN"
      ? workspace.scriptLabRows.length
      : workspace?.marketingOverview.promotionalCopyVersions.length ?? 0;

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={headerCopy.eyebrow}
          title={headerCopy.title}
          description={headerCopy.description}
          locale={locale}
          action={<NextStepLink href={nextStep.href} label={nextStep.label} />}
        />

        {workspace ? (
          <ProjectContext
            project={buildProjectContextProject(workspace)}
            recentProjects={recentProjects.map((project) => ({
              id: project.id,
              title: project.title,
              topic_query: project.topic_query,
              is_pinned: project.is_pinned,
            }))}
            locale={locale}
            density="compact"
          />
        ) : null}

        {recentProjectsUnavailable && !projectId ? (
          <div className="border-y border-[var(--border)] bg-[var(--warn-bg)] px-5 py-4 text-sm leading-7 text-[var(--warn-text)]">
            {locale === "en"
              ? "The recent-project list is temporarily unavailable, but you can still start from a new project below."
              : "最近项目列表暂时不可用，但你仍然可以直接从下面开始一个新项目。"}
          </div>
        ) : null}

        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Dashboard Is Temporarily Unavailable" : "总览暂时不可用"}
            description={
              locale === "en"
                ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers."
                : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"
            }
            action={<NextStepLink href={projectId ? `/?projectId=${projectId}` : "/"} label={locale === "en" ? "Retry Loading" : "重新加载"} />}
          />
        ) : workspace ? (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <PanelCard title={ui.focusTitle} description={ui.focusDesc}>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {lineMeta ? <SummaryPill><lineMeta.icon className="mr-1.5 inline-block h-3.5 w-3.5" />{lineMeta.label}</SummaryPill> : null}
                    {outputMeta ? <SummaryPill>{outputMeta.label}</SummaryPill> : null}
                  </div>
                  <div className="border-y border-[var(--border-soft)] py-5">
                    <div className="text-xs font-medium text-[var(--text-3)]">{ui.nextTitle}</div>
                    <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-1)]">{nextStep.label}</div>
                    <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{focusReason}</div>
                    <div className="mt-5">
                      <NextStepLink href={nextStep.href} label={nextStep.label} />
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-soft)] bg-transparent pt-4 text-sm leading-relaxed text-[var(--text-1)]">
                    {workspace.projectSummary.coreIdea?.trim() ||
                      workspace.projectSummary.introduction?.trim() ||
                      workspace.project.topic_query}
                  </div>
                </div>
              </PanelCard>

              <PanelCard title={ui.statusTitle} description={ui.statusDesc}>
                <div className="grid gap-4">
                  <StatCard
                    label={ui.trendsLabel}
                    value={String(workspace.trendRows.length)}
                    caption={
                      workspace.trendRows[0]?.label ??
                      (locale === "en" ? "No trend signals yet." : "当前还没有趋势信号。")
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <StatCard
                      label={ui.outputsLabel}
                      value={String(outputCount)}
                      caption={outputMeta?.label ?? (locale === "en" ? "Requested output" : "当前目标产物")}
                    />
                    <StatCard
                      label={ui.storyboardLabel}
                      value={String(workspace.scenePlannerRows.length)}
                      caption={
                        locale === "en"
                          ? "Rows ready for image brief and image production"
                          : "当前已可进入配图说明 / 图片生产的条目数"
                      }
                    />
                  </div>
                  <StatCard
                    label={ui.reportLabel}
                    value={workspace.latestReport ? ui.reportReady : ui.reportPending}
                    caption={
                      workspace.latestReport
                        ? locale === "en"
                          ? "You can review or export when needed."
                          : "需要时再查看或导出即可。"
                        : locale === "en"
                          ? "This does not block the main content flow."
                          : "这不会阻塞主内容流程。"
                    }
                  />
                </div>
              </PanelCard>
            </div>

            <OutputStudio
              projectId={workspace.project.id}
              contentLine={workspace.contentLine}
              currentOutputType={workspace.outputType}
              locale={locale}
            />

            <Disclosure
              className="border-y border-[var(--border)] py-5"
              summaryClassName="text-sm font-medium text-[var(--text-1)]"
              contentClassName="mt-4 space-y-6"
              title={ui.moreTitle}
            >
              <PanelCard title={ui.briefTitle} description={ui.briefDesc}>
                {workspace.latestBrief ? (
                  <div className="space-y-4">
                    <div className="text-xl font-semibold text-[var(--text-1)]">{workspace.latestBrief.title}</div>
                    <div className="text-sm leading-7 text-[var(--text-2)]">{workspace.latestBrief.key_message}</div>
                    <div className="flex flex-wrap gap-2">
                      <SummaryPill>{workspace.latestBrief.objective}</SummaryPill>
                      <SummaryPill>{workspace.latestBrief.primary_tone}</SummaryPill>
                      <SummaryPill>{workspace.latestBrief.brief_status}</SummaryPill>
                    </div>
                  </div>
                ) : (
                  <div className="border-y border-dashed border-[var(--border)] py-5 text-sm leading-7 text-[var(--text-2)]">
                    {ui.noBriefYet}
                  </div>
                )}
              </PanelCard>

              <PanelCard title={ui.prioritiesTitle} description={ui.prioritiesDesc}>
                <div className="grid gap-4 md:grid-cols-3">
                  {(workspace.priorities ?? []).length > 0
                    ? workspace.priorities.slice(0, 3).map((item, index) => (
                        <div key={item} className="border-t border-[var(--border)] py-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">
                            {locale === "en" ? `Note ${index + 1}` : `备注 ${index + 1}`}
                          </div>
                          <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{item}</div>
                        </div>
                      ))
                    : (
                      <div className="border-y border-dashed border-[var(--border)] py-5 text-sm leading-7 text-[var(--text-2)] md:col-span-3">
                        {locale === "en"
                          ? "No extra notes right now. That is fine."
                          : "当前没有额外备注，这很正常。"}
                      </div>
                    )}
                </div>
              </PanelCard>

              <div id="new-project">
                <ProjectForm
                  key={projectFormKey}
                  locale={locale}
                  initialContentLine={initialContentLine}
                  initialOutputType={initialOutputType}
                  initialTopic={topic ?? ""}
                  initialTitle={title ?? ""}
                />
              </div>
            </Disclosure>
          </div>
        ) : projectId ? (
          <ErrorPanel
            title={ui.noProjectTitle}
            description={ui.noProjectDesc}
            action={<NextStepLink href="/" label={locale === "en" ? "Back to Dashboard" : "返回总览首页"} />}
          />
        ) : (
          <div className="space-y-6">
            <div className="border-y border-[var(--border)] py-4">
              <div className="text-xs font-medium text-[var(--text-3)]">{ui.quickStartTitle}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                {locale === "en"
                  ? "Direction, topic, source material. The rest can wait."
                  : "方向、题目、素材。其余信息可以后补。"}
              </div>
            </div>

            <div id="new-project">
              <ProjectForm
                key={projectFormKey}
                locale={locale}
                initialContentLine={initialContentLine}
                initialOutputType={initialOutputType}
                initialTopic={topic ?? ""}
                initialTitle={title ?? ""}
                initialOwnedMediaPreset={normalizedOwnedMediaPreset}
              />
            </div>

            <PanelCard title={ui.startTitle} description={ui.startDesc}>
              <div className="home-start-grid">
                <StartCard href="/today" eyebrow="Today" title={ui.startTodayTitle} description={ui.startTodayDesc} footer={ui.startTodayFooter} locale={locale} featured />
                <StartCard
                  href={buildDashboardCreateHref({
                    contentLine: "MARS_CITIZEN",
                    outputType: "NARRATIVE_SCRIPT",
                  }) as Route}
                  eyebrow={locale === "en" ? "Owned Media" : "内容矩阵"}
                  title={ui.startMarsTitle}
                  description={ui.startMarsDesc}
                  footer={ui.startMarsFooter}
                  locale={locale}
                />
                <StartCard
                  href={buildDashboardCreateHref({
                    contentLine: "MARKETING",
                    outputType: "PLATFORM_COPY",
                  }) as Route}
                  eyebrow={locale === "en" ? "Commercial" : "商业服务"}
                  title={ui.startMarketingTitle}
                  description={ui.startMarketingDesc}
                  footer={ui.startMarketingFooter}
                  locale={locale}
                />
                <StartCard
                  href={(recentProjects[0] ? `/?projectId=${recentProjects[0].id}` : "/project-hub") as Route}
                  eyebrow="Recent"
                  title={ui.startRecentTitle}
                  description={ui.startRecentDesc}
                  footer={ui.startRecentFooter}
                  locale={locale}
                />
              </div>
            </PanelCard>

            <Disclosure
              className="border-y border-[var(--border)] py-6"
              summaryClassName="text-sm font-medium text-[var(--text-1)]"
              contentClassName="mt-5"
              title={locale === "en" ? "Why these directions exist" : "为什么现在是这三条方向"}
            >
              <section className="home-strategy-board">
                <div className="home-strategy-board__hero">
                  <div className="home-strategy-board__eyebrow">{ui.strategyEyebrow}</div>
                  <h2 className="home-strategy-board__title">{ui.strategyTitle}</h2>
                  <p className="home-strategy-board__description">{ui.strategyDesc}</p>
                  <div className="home-strategy-board__tracks">
                    <div className="home-direction-pill">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{ui.strategyTrackAi}</span>
                    </div>
                    <div className="home-direction-pill">
                      <WalletCards className="h-3.5 w-3.5" />
                      <span>{ui.strategyTrackMoney}</span>
                    </div>
                    <div className="home-direction-pill">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{ui.strategyTrackLife}</span>
                    </div>
                  </div>
                </div>
                <div className="home-strategy-board__aside">
                  <div className="home-strategy-board__aside-title">{ui.strategyTrackTitle}</div>
                  <div className="home-strategy-board__notes">
                    <StrategyNote icon={Newspaper} label={ui.strategyLaunchLabel} value={ui.strategyLaunchValue} />
                    <StrategyNote icon={WalletCards} label={ui.strategyRevenueLabel} value={ui.strategyRevenueValue} />
                    <StrategyNote icon={Sparkles} label={ui.strategyFocusLabel} value={ui.strategyFocusValue} />
                  </div>
                </div>
              </section>
            </Disclosure>
          </div>
        )}

        {!workspace && !projectId && recentProjects.length === 0 ? (
          <EmptyPanel
            title={locale === "en" ? "Start with One Project" : "先从一个项目开始"}
            description={
              locale === "en"
                ? "Pick one business line, one topic, and one target output. That is enough to begin."
                : "选一条业务线、一个主题、一个目标产物，就足够开始。"
            }
            action={<NextStepLink href="#new-project" label={locale === "en" ? "Create Project" : "创建项目"} />}
          />
        ) : null}
      </div>
    </WorkspaceLayout>
  );
}
