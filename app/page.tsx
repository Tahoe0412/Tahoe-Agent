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
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

function SummaryPill({ children }: { children: ReactNode }) {
  return <span className="theme-pill rounded-full px-3 py-1.5 text-xs font-medium">{children}</span>;
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
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">{label}</div>
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
}: {
  href: Route;
  eyebrow: string;
  title: string;
  description: string;
  locale: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-solid)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_12px_30px_rgba(34,184,207,0.08)]"
    >
      <div
        className="pointer-events-none absolute right-[-1.5rem] top-[-1.5rem] h-20 w-20 rounded-full bg-[radial-gradient(circle,var(--accent-soft),transparent_70%)] opacity-60 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative z-[1]">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">{eyebrow}</div>
        <div className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-1)]">{title}</div>
        <div className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{description}</div>
        <div className="mt-6 flex items-center text-sm font-semibold text-[var(--accent)] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
          {locale === "en" ? "Start" : "开始"} &rarr;
        </div>
      </div>
    </Link>
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
  }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId, topic, title, contentLine, outputType } = await searchParams;
  const initialContentLine = resolveContentLine({ contentLine });
  const initialOutputType = coerceOutputType(initialContentLine, outputType);
  const projectFormKey = [initialContentLine, initialOutputType, topic ?? "", title ?? ""].join(":");
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
          title: locale === "en" ? "Marketing Workspace" : "Marketing 工作台",
          description:
            locale === "en"
              ? "Choose the next content action and keep the rest of the system in the background."
              : "只保留当前最重要的内容动作，其余流程交给系统在后台处理。",
        }
      : workspace?.contentLine === "MARS_CITIZEN"
        ? {
            eyebrow: "MARS CITIZEN",
            title: locale === "en" ? "Mars Citizen Workspace" : "火星公民工作台",
            description:
              locale === "en"
                ? "Focus on the next publishable output instead of navigating every module."
                : "直接推进下一条可发布内容，而不是先理解所有模块。",
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
          storyboardLabel: "Storyboard rows",
          reportLabel: "Report",
          reportReady: "Ready",
          reportPending: "Pending",
          focusReasonNoProject: "Start from one topic and one target output. Everything else can stay empty for now.",
          focusReasonStoryboard: "Go straight to storyboard. You do not need to finish the whole workflow first.",
          focusReasonScript: "Generate the first script or scene draft, then decide whether it needs deeper editing.",
          focusReasonRender: "The storyboard is ready enough. Move on to render preparation instead of reopening upstream steps.",
          focusReasonMarketing: "Generate the first usable marketing draft first. Briefs and refinements can follow when needed.",
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
          startTodayTitle: "Find today's topics",
          startTodayDesc: "Open Today Workbench to search trends, gather facts, and pick a topic first.",
          startMarsTitle: "Make a Mars Citizen video",
          startMarsDesc: "Start a new science/tech video project and go straight into script or publish output.",
          startMarketingTitle: "Make marketing content",
          startMarketingDesc: "Start a new marketing project for platform copy, ad creative, or ad storyboard.",
          startRecentTitle: "Continue a recent project",
          startRecentDesc: "Jump back into the latest project instead of creating a new one.",
        }
      : {
          focusTitle: "当前重点",
          focusDesc: "默认只显示下一步最重要的动作。",
          nextTitle: "现在就做这件事",
          statusTitle: "简洁状态",
          statusDesc: "只保留会影响你下一步判断的几个数字。",
          trendsLabel: "趋势",
          outputsLabel: "当前产出",
          storyboardLabel: "分镜条目",
          reportLabel: "报告",
          reportReady: "已生成",
          reportPending: "未生成",
          focusReasonNoProject: "从一个主题和一个目标产物开始就够了，其他信息现在都可以先留空。",
          focusReasonStoryboard: "直接去做分镜，不需要先把整套流程走完。",
          focusReasonScript: "先生成第一版脚本或 scene，再决定要不要进入更细的编辑。",
          focusReasonRender: "当前分镜已经足够进入生成准备，不必反复回到上游步骤。",
          focusReasonMarketing: "先拿到第一版可用内容，再补任务单、风格和细化约束。",
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
          startTodayTitle: "今日选题",
          startTodayDesc: "搜热点、选素材、定题目",
          startMarsTitle: "火星公民",
          startMarsDesc: "科技脚本 · 视频分镜 · 发布包装",
          startMarketingTitle: "Marketing",
          startMarketingDesc: "平台文案 · 广告创意 · 广告分镜",
          startRecentTitle: "继续项目",
          startRecentDesc: "回到上次进行中的项目",
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
            project={{
              id: workspace.project.id,
              title: workspace.project.title,
              topic_query: workspace.project.topic_query,
              workspaceMode: workspace.workspaceMode,
              introduction: workspace.projectSummary.introduction,
              coreIdea: workspace.projectSummary.coreIdea,
              originalScript: workspace.projectSummary.originalScript,
              styleReferenceSample: workspace.projectSummary.styleReferenceSample,
              styleReferenceInsight: workspace.projectSummary.styleReferenceInsight,
              writingMode: workspace.projectSummary.writingMode as never,
              writingModeLabel: workspace.projectSummary.writingModeLabel,
              styleTemplate: workspace.projectSummary.styleTemplate as never,
              styleTemplateLabel: workspace.projectSummary.styleTemplateLabel,
              copyLength: workspace.projectSummary.copyLength as never,
              copyLengthLabel: workspace.projectSummary.copyLengthLabel,
              usageScenario: workspace.projectSummary.usageScenario as never,
              usageScenarioLabel: workspace.projectSummary.usageScenarioLabel,
            }}
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
          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--warning-text)_26%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--warning-bg)_84%,var(--surface-solid)),rgba(255,255,255,0.28))] px-5 py-4 text-sm leading-7 text-[var(--warning-text)] shadow-[0_14px_34px_rgba(145,108,43,0.08)]">
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
            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <PanelCard title={ui.focusTitle} description={ui.focusDesc}>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {lineMeta ? <SummaryPill><lineMeta.icon className="mr-1.5 inline-block h-3.5 w-3.5" />{lineMeta.label}</SummaryPill> : null}
                    {outputMeta ? <SummaryPill>{outputMeta.label}</SummaryPill> : null}
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-solid)] p-6 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">{ui.nextTitle}</div>
                    <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-1)]">{nextStep.label}</div>
                    <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{focusReason}</div>
                    <div className="mt-5">
                      <NextStepLink href={nextStep.href} label={nextStep.label} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5 text-sm leading-relaxed text-[var(--text-1)]">
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
                          ? "Rows ready for storyboard / render work"
                          : "当前已可进入分镜 / 生成准备的条目数"
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
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5"
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
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--text-2)]">
                    {ui.noBriefYet}
                  </div>
                )}
              </PanelCard>

              <PanelCard title={ui.prioritiesTitle} description={ui.prioritiesDesc}>
                <div className="grid gap-4 md:grid-cols-3">
                  {(workspace.priorities ?? []).length > 0
                    ? workspace.priorities.slice(0, 3).map((item, index) => (
                        <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
                            {locale === "en" ? `Note ${index + 1}` : `备注 ${index + 1}`}
                          </div>
                          <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{item}</div>
                        </div>
                      ))
                    : (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--text-2)] md:col-span-3">
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
            <PanelCard title={ui.startTitle} description={ui.startDesc}>
              <div className="grid gap-4 xl:grid-cols-4">
                <StartCard href="/today" eyebrow="Today" title={ui.startTodayTitle} description={ui.startTodayDesc} locale={locale} />
                <StartCard
                  href={buildDashboardCreateHref({
                    contentLine: "MARS_CITIZEN",
                    outputType: "NARRATIVE_SCRIPT",
                  }) as Route}
                  eyebrow="Mars Citizen"
                  title={ui.startMarsTitle}
                  description={ui.startMarsDesc}
                  locale={locale}
                />
                <StartCard
                  href={buildDashboardCreateHref({
                    contentLine: "MARKETING",
                    outputType: "PLATFORM_COPY",
                  }) as Route}
                  eyebrow="Marketing"
                  title={ui.startMarketingTitle}
                  description={ui.startMarketingDesc}
                  locale={locale}
                />
                <StartCard
                  href={(recentProjects[0] ? `/?projectId=${recentProjects[0].id}` : "/project-hub") as Route}
                  eyebrow="Recent"
                  title={ui.startRecentTitle}
                  description={ui.startRecentDesc}
                  locale={locale}
                />
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
