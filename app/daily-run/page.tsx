import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CircleDashed, FileText, Image as ImageIcon, PackageCheck, SearchCheck } from "lucide-react";
import { DailyRunSignalPanel } from "@/components/daily-run/daily-run-signal-panel";
import { DetailPanel } from "@/components/ui/detail-panel";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { ErrorPanel } from "@/components/ui/state-panel";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { getEditorialDirectionPresets } from "@/lib/editorial-direction-presets";
import { getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

type DailyProject = Awaited<ReturnType<WorkspaceQueryService["listProjects"]>>[number];

type RunStage = "DRAFT" | "REVIEW" | "IMAGE" | "PACKAGE" | "READY";

function formatRunDate(value: Date | string, locale: "zh" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function inferRunStage(project: DailyProject): RunStage {
  if (project.script_count === 0) {
    return "DRAFT";
  }

  if (project.storyboard_count === 0) {
    return "REVIEW";
  }

  if (project.render_job_count === 0) {
    return "IMAGE";
  }

  if (project.strategy_task_count === 0) {
    return "PACKAGE";
  }

  return "READY";
}

function nextAction(project: DailyProject, locale: "zh" | "en") {
  const stage = inferRunStage(project);
  const projectQuery = `?projectId=${project.id}`;

  switch (stage) {
    case "DRAFT":
      return {
        label: locale === "en" ? "Generate draft" : "生成主稿",
        href: `/script-lab${projectQuery}` as Route,
      };
    case "REVIEW":
      return {
        label: locale === "en" ? "Review draft" : "审核主稿",
        href: `/script-lab${projectQuery}` as Route,
      };
    case "IMAGE":
      return {
        label: locale === "en" ? "Produce image" : "去出图",
        href: `/render-lab${projectQuery}` as Route,
      };
    case "PACKAGE":
      return {
        label: locale === "en" ? "Publish package" : "生成发布包装",
        href: `/script-lab${projectQuery}` as Route,
      };
    case "READY":
    default:
      return {
        label: locale === "en" ? "Open project" : "打开项目",
        href: `/${projectQuery}` as Route,
      };
  }
}

function stageMeta(stage: RunStage, locale: "zh" | "en") {
  if (locale === "en") {
    switch (stage) {
      case "DRAFT":
        return { label: "Draft", tone: "text-[var(--slate-blue)] bg-[var(--slate-blue-soft)]" };
      case "REVIEW":
        return { label: "Review", tone: "text-[var(--plum)] bg-[var(--plum-soft)]" };
      case "IMAGE":
        return { label: "Image", tone: "text-[var(--terracotta)] bg-[var(--terracotta-soft)]" };
      case "PACKAGE":
        return { label: "Package", tone: "text-[var(--sage)] bg-[var(--sage-soft)]" };
      default:
        return { label: "Ready", tone: "text-[var(--ok-text)] bg-[color:color-mix(in_srgb,var(--ok-bg)_78%,transparent)]" };
    }
  }

  switch (stage) {
    case "DRAFT":
      return { label: "待起稿", tone: "text-[var(--slate-blue)] bg-[var(--slate-blue-soft)]" };
    case "REVIEW":
      return { label: "待审核", tone: "text-[var(--plum)] bg-[var(--plum-soft)]" };
    case "IMAGE":
      return { label: "待配图", tone: "text-[var(--terracotta)] bg-[var(--terracotta-soft)]" };
    case "PACKAGE":
      return { label: "待包装", tone: "text-[var(--sage)] bg-[var(--sage-soft)]" };
    default:
      return { label: "可发布", tone: "text-[var(--ok-text)] bg-[color:color-mix(in_srgb,var(--ok-bg)_78%,transparent)]" };
  }
}

function stageCount(projects: DailyProject[], stage: RunStage) {
  return projects.filter((project) => inferRunStage(project) === stage).length;
}

export default async function DailyRunPage() {
  const locale = await getLocale();
  const isEn = locale === "en";
  const presets = getEditorialDirectionPresets(locale);
  const [projectsResult, recentProjectsResult] = await Promise.allSettled([
    workspaceQueryService.listProjects(18),
    workspaceQueryService.listRecentProjects(8),
  ]);

  const projects = projectsResult.status === "fulfilled" ? projectsResult.value : [];
  const recentProjects = recentProjectsResult.status === "fulfilled" ? recentProjectsResult.value : [];
  const workspaceDataUnavailable = projectsResult.status === "rejected" || recentProjectsResult.status === "rejected";

  const stages = [
    {
      key: "DRAFT" as const,
      icon: SearchCheck,
      title: isEn ? "Select and draft" : "选题与起稿",
      count: stageCount(projects, "DRAFT"),
    },
    {
      key: "REVIEW" as const,
      icon: FileText,
      title: isEn ? "Review" : "审核主稿",
      count: stageCount(projects, "REVIEW"),
    },
    {
      key: "IMAGE" as const,
      icon: ImageIcon,
      title: isEn ? "Image" : "配图生产",
      count: stageCount(projects, "IMAGE"),
    },
    {
      key: "PACKAGE" as const,
      icon: PackageCheck,
      title: isEn ? "Package" : "发布包装",
      count: stageCount(projects, "PACKAGE"),
    },
    {
      key: "READY" as const,
      icon: CircleDashed,
      title: isEn ? "Ready" : "可发布",
      count: stageCount(projects, "READY"),
    },
  ];

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={isEn ? "Daily Run" : "每日运行"}
          title={isEn ? "Daily Run" : "每日运行台"}
          description={
            isEn
              ? "See which account should move today, what each project is blocked on, and what the next action is."
              : "先看今天该推哪条线、每个项目卡在哪一步、下一步该做什么。"
          }
          locale={locale}
        />

        {workspaceDataUnavailable ? (
          <ErrorPanel
            title={isEn ? "Daily Run Is In Limited Mode" : "每日运行台当前处于降级模式"}
            description={
              isEn
                ? "Project data did not fully load. The page shell still renders, but queue counts and next actions may be incomplete."
                : "项目数据暂时没有完整加载成功。页面仍可用，但队列计数和下一步建议可能不完整。"
            }
            locale={locale}
          />
        ) : null}

        <DailyRunSignalPanel locale={locale} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="theme-panel-muted rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-[var(--text-2)]">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-2xl font-semibold text-[var(--text-1)]">{stage.count}</div>
                </div>
                <div className="mt-4 text-sm font-medium text-[var(--text-1)]">{stage.title}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <PanelCard
            title={isEn ? "Account lanes" : "账号分栏"}
            description={isEn ? "Three lanes, three editorial jobs." : "三条线，三种不同的编辑工作。"}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {presets.map((preset) => (
                <div key={preset.id} className="theme-panel-muted rounded-xl p-5">
                  <div className="text-base font-semibold text-[var(--text-1)]">{preset.label}</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{preset.focus}</div>
                  <div className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">
                    {isEn ? "Today's editorial job" : "今天的编辑任务"}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-1)]">
                    {preset.id === "AI_GROWTH"
                      ? isEn
                        ? "Filter AI change into one clear update."
                        : "把 AI 变化筛成一条清楚快讯。"
                      : preset.id === "MONEY_NEVER_SLEEPS"
                        ? isEn
                          ? "Explain the key market variable."
                          : "讲清今天最关键的市场变量。"
                        : isEn
                          ? "Judge the brand or consumer signal."
                          : "判断品牌或消费信号的意义。"}
                  </div>
                  <div className="mt-5 flex gap-3">
                    <Link href="/today" className="inline-flex items-center rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-white/18 hover:text-[var(--text-1)]">
                      {isEn ? "Go to topics" : "去选题"}
                    </Link>
                    <Link href="/" className="inline-flex items-center rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-white/18 hover:text-[var(--text-1)]">
                      {isEn ? "New project" : "新建项目"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>

          <DetailPanel title={isEn ? "Operating rules" : "运行规则"}>
            <div>
              <div className="text-sm font-medium text-[color:rgba(246,240,232,0.88)]">{isEn ? "Production unit" : "生产单元"}</div>
              <div className="mt-2">{isEn ? "Treat one publishable article package as the unit: title, draft, image, packaging." : "以一篇可发布图文包为单位：标题、主稿、配图、包装一起看。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[color:rgba(246,240,232,0.88)]">{isEn ? "Current heuristic" : "当前启发式"}</div>
              <div className="mt-2">{isEn ? "This first version infers stage from existing project artifacts. Topic intake will be merged next." : "第一版先用现有项目产物推断阶段。今日信号与账号分发会在下一步并进来。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[color:rgba(246,240,232,0.88)]">{isEn ? "Main goal" : "当前目标"}</div>
              <div className="mt-2">{isEn ? "Make daily status and next action obvious before adding more automation." : "先把每天的状态和下一步做清楚，再谈更多自动化。"}</div>
            </div>
          </DetailPanel>
        </div>

        <PanelCard
          title={isEn ? "Work queue" : "当前队列"}
          description={isEn ? "Recent projects, sorted into the next production step." : "把最近项目按下一步动作分到当前队列里。"}
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-sm leading-6 text-[var(--text-2)]">
                {isEn ? "No projects yet. Start from Today or create a new project from the dashboard." : "还没有项目。先去今日选题，或者从首页新建项目。"}
              </div>
            ) : (
              projects.slice(0, 12).map((project) => {
                const stage = inferRunStage(project);
                const meta = stageMeta(stage, locale);
                const action = nextAction(project, locale);
                return (
                  <div key={project.id} className="theme-panel-muted rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-[var(--text-1)]">{project.title}</div>
                        <div className="mt-2 text-sm leading-6 text-[var(--text-2)] line-clamp-2">{project.topic_query}</div>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.tone}`}>{meta.label}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
                      <span>{isEn ? "Updated" : "最后修改"} {formatRunDate(project.updated_at, locale)}</span>
                      <span>{isEn ? "Scripts" : "主稿"} {project.script_count}</span>
                      <span>{isEn ? "Image briefs" : "配图说明"} {project.storyboard_count}</span>
                      <span>{isEn ? "Image jobs" : "图片任务"} {project.render_job_count}</span>
                      <span>{isEn ? "Packages" : "包装产物"} {project.strategy_task_count}</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <Link href={action.href} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text-1)] transition hover:border-white/20">
                        {action.label}
                        <ArrowRight className="size-4" />
                      </Link>
                      <Link href={`/?projectId=${project.id}` as Route} className="text-xs text-[var(--text-3)] transition hover:text-[var(--text-1)]">
                        {isEn ? "Open summary" : "看总览"}
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PanelCard>

        <PanelCard
          title={isEn ? "Recent activity" : "最近活动"}
          description={isEn ? "Keep the last active items visible without turning this page into another dashboard." : "保留最近活动，但不要把这页重新堆成第二个总览。"}
        >
          <div className="grid gap-3">
            {recentProjects.length === 0 ? (
              <div className="text-sm text-[var(--text-2)]">{isEn ? "No recent project activity yet." : "当前还没有最近项目活动。"}</div>
            ) : (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/?projectId=${project.id}` as Route}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/8 px-4 py-3 text-sm transition hover:border-white/14 hover:bg-white/4"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[var(--text-1)]">{project.title}</div>
                    <div className="mt-1 truncate text-[var(--text-3)]">{project.topic_query}</div>
                    <div className="mt-1 text-xs text-[var(--text-3)]">
                      {isEn ? "Updated" : "最后修改"} {formatRunDate(project.updated_at, locale)}
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-[var(--text-3)]" />
                </Link>
              ))
            )}
          </div>
        </PanelCard>
      </div>
    </WorkspaceLayout>
  );
}
