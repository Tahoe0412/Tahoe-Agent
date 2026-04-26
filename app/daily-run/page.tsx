import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, CircleDashed, Clock3, FileText, Image as ImageIcon, PackageCheck, SearchCheck, TimerReset } from "lucide-react";
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
type DailyLaneId = "AI_GROWTH" | "MONEY_NEVER_SLEEPS" | "EASTERN_VITALITY";

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

function laneProject(project: DailyProject, laneId: DailyLaneId, laneLabel: string) {
  const haystack = [
    project.title,
    project.topic_query,
    project.output_type,
    project.workspace_mode,
    ...project.project_tags,
  ].join(" ").toLowerCase();

  if (haystack.includes(laneId.toLowerCase()) || haystack.includes(laneLabel.toLowerCase())) {
    return true;
  }

  if (laneId === "AI_GROWTH") {
    return /ai|openai|gpt|deepseek|qwen|agent|claude|gemini|人工智能|大模型/.test(haystack);
  }
  if (laneId === "MONEY_NEVER_SLEEPS") {
    return /stock|market|fed|nvidia|tesla|nasdaq|股市|美股|资本|金融|财报/.test(haystack);
  }
  return /fashion|luxury|brand|lvmh|hermes|runway|时尚|消费|品牌|秀场|奢侈/.test(haystack);
}

function countActivePackages(projects: DailyProject[]) {
  return projects.filter((project) => inferRunStage(project) !== "READY").length;
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
  const readyCount = stageCount(projects, "READY");
  const activeCount = countActivePackages(projects);
  const todayLanes = presets.map((preset) => {
    const laneProjects = projects.filter((project) => laneProject(project, preset.id, preset.label));
    const latestProject = laneProjects[0] ?? null;
    const latestStage = latestProject ? inferRunStage(latestProject) : null;
    return {
      preset,
      latestProject,
      latestStage,
      readyCount: laneProjects.filter((project) => inferRunStage(project) === "READY").length,
    };
  });

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={isEn ? "Daily Run" : "每日运行"}
          title={isEn ? "Daily Run" : "每日运行台"}
          description={
            isEn
              ? "A 90-minute daily mode for three accounts: pick one topic, generate the package, lightly edit, publish."
              : "每天 90 分钟跑三个号：选题、一键成包、轻改、发布。"
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

        <PanelCard
          title={isEn ? "90-minute three-article mode" : "90 分钟今日三篇"}
          description={
            isEn
              ? "The default workflow is no longer full-process perfection. Each account gets one publishable package and one final pass."
              : "默认不再追求全流程完美。每个号只要一篇可发图文包，再做一次最终轻审。"
          }
        >
          <div className="grid border-t border-[var(--border)] lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border-b border-[var(--border)] py-5 pr-0 lg:border-b-0 lg:border-r lg:pr-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="border-r border-[var(--border)] pr-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">
                    <Clock3 className="size-3.5" />
                    {isEn ? "Time" : "总时长"}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[var(--text-1)]">90m</div>
                </div>
                <div className="border-r border-[var(--border)] px-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">
                    <FileText className="size-3.5" />
                    {isEn ? "Target" : "目标"}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[var(--text-1)]">3</div>
                </div>
                <div className="pl-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">
                    <CheckCircle2 className="size-3.5" />
                    {isEn ? "Ready" : "可发"}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[var(--text-1)]">{readyCount}</div>
                </div>
              </div>
              <div className="mt-5 border-y border-dashed border-[var(--border)] py-4 text-sm leading-6 text-[var(--text-2)]">
                {isEn
                  ? "Quality target: good enough to publish, not perfect. One final check replaces repeated artifact-level reviews."
                  : "质量目标：能发、比普通 AI 稿好，不追求满分。一轮总审代替每个产物反复审核。"}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-[var(--text-2)]">
                <div>{isEn ? "1. Pick one topic per account." : "1. 每个号只选一个题。"} </div>
                <div>{isEn ? "2. Generate draft + title + publish copy + image brief together." : "2. 主稿、标题、发布文案、配图说明一起生成。"} </div>
                <div>{isEn ? "3. Edit only the final package." : "3. 只改最终成品，不逐步完美化。"} </div>
              </div>
            </div>

            <div className="divide-y divide-[var(--border)] lg:pl-6">
              {todayLanes.map(({ preset, latestProject, latestStage, readyCount: laneReadyCount }) => {
                const latestAction = latestProject ? nextAction(latestProject, locale) : null;
                const latestMeta = latestStage ? stageMeta(latestStage, locale) : null;
                return (
                  <div key={preset.id} className="grid gap-4 py-5 md:grid-cols-[0.65fr_1fr_auto] md:items-center">
                    <div>
                      <div className="text-base font-semibold text-[var(--text-1)]">{preset.label}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">30 min / article</div>
                    </div>
                    <div className="min-w-0">
                      {latestProject ? (
                        <>
                          <div className="truncate text-sm font-medium text-[var(--text-1)]">{latestProject.title}</div>
                          <div className="mt-1 line-clamp-1 text-sm text-[var(--text-2)]">{latestProject.topic_query}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
                            {latestMeta ? <span className={`rounded-md px-2 py-1 ${latestMeta.tone}`}>{latestMeta.label}</span> : null}
                            <span>{isEn ? "Ready packages" : "可发包"} {laneReadyCount}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm leading-6 text-[var(--text-2)]">
                          {isEn ? "No active package detected. Start from the signal search below." : "还没有识别到今日包，从下方信号搜索直接起稿。"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      {latestAction ? (
                        <Link href={latestAction.href} className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-1)] transition hover:border-[var(--accent)]">
                          {latestStage === "READY" ? (isEn ? "Final check" : "最终检查") : latestAction.label}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : null}
                      <a href="#daily-run-signals" className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]">
                        {isEn ? "Pick topic" : "去选题"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PanelCard>

        <DailyRunSignalPanel locale={locale} />

        <div className="grid border-t border-[var(--border)] md:grid-cols-3">
          {[
            {
              key: "active",
              icon: TimerReset,
              title: isEn ? "Needs action" : "需要动作",
              count: activeCount,
            },
            {
              key: "ready",
              icon: CheckCircle2,
              title: isEn ? "Ready to publish" : "可发布",
              count: readyCount,
            },
            {
              key: "draft",
              icon: SearchCheck,
              title: isEn ? "No draft yet" : "待起稿",
              count: stageCount(projects, "DRAFT"),
            },
          ].map((stage) => {
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="border-b border-[var(--border)] p-4 md:border-r md:last:border-r-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-2)]">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-2xl font-semibold text-[var(--text-1)]">{stage.count}</div>
                </div>
                <div className="mt-4 text-sm font-medium text-[var(--text-1)]">{stage.title}</div>
              </div>
            );
          })}
        </div>

        <details className="theme-panel px-0 py-0">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-[var(--text-1)]">
            {isEn ? "Show full production stages and deep-work entrances" : "展开完整阶段和深水区入口"}
          </summary>
          <div className="grid border-t border-[var(--border)] md:grid-cols-2 xl:grid-cols-5">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="border-b border-[var(--border)] p-4 xl:border-r xl:last:border-r-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-2)]">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-2xl font-semibold text-[var(--text-1)]">{stage.count}</div>
                </div>
                <div className="mt-4 text-sm font-medium text-[var(--text-1)]">{stage.title}</div>
              </div>
            );
          })}
          </div>
        </details>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <PanelCard
            title={isEn ? "Deep-work entrances" : "深水区入口"}
            description={isEn ? "Use these only when the quick package needs manual repair." : "只有快速包需要返修时再进入这些页面。"}
          >
            <div className="grid border-t border-[var(--border)] md:grid-cols-3">
              {presets.map((preset) => (
                <div key={preset.id} className="border-b border-[var(--border)] p-5 md:border-r md:last:border-r-0">
                  <div className="text-base font-semibold text-[var(--text-1)]">{preset.label}</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{isEn ? "Default path: use the quick package first." : "默认路径：先用快速包，不手动拆流程。"}</div>
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
                    <a href="#daily-run-signals" className="inline-flex items-center rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]">
                      {isEn ? "Pick topic" : "去选题"}
                    </a>
                    <Link href="/script-lab" className="inline-flex items-center rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]">
                      {isEn ? "Repair draft" : "修主稿"}
                    </Link>
                    <Link href="/scene-planner" className="inline-flex items-center rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]">
                      {isEn ? "Repair image" : "修配图"}
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
              <div className="mt-2">{isEn ? "Daily Run now creates the quick package first. Use deep-work pages only when one part needs repair." : "每日运行台现在先生成快速发布包。只有某个部分明显不行时，再进深水区返修。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[color:rgba(246,240,232,0.88)]">{isEn ? "Main goal" : "当前目标"}</div>
              <div className="mt-2">{isEn ? "Keep three daily posts achievable within 90 minutes, with one final editorial pass instead of repeated reviews." : "保证 90 分钟内能完成三个号，一次最终编辑审查替代多轮逐项审核。"}</div>
            </div>
          </DetailPanel>
        </div>

        <PanelCard
          title={isEn ? "Work queue" : "当前队列"}
          description={isEn ? "Recent projects, sorted into the next production step." : "把最近项目按下一步动作分到当前队列里。"}
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {projects.length === 0 ? (
              <div className="border-y border-dashed border-[var(--border)] py-8 text-sm leading-6 text-[var(--text-2)]">
                {isEn ? "No projects yet. Start from Today or create a new project from the dashboard." : "还没有项目。先去今日选题，或者从首页新建项目。"}
              </div>
            ) : (
              projects.slice(0, 12).map((project) => {
                const stage = inferRunStage(project);
                const meta = stageMeta(stage, locale);
                const action = nextAction(project, locale);
                return (
                  <div key={project.id} className="border-y border-[var(--border)] py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-[var(--text-1)]">{project.title}</div>
                        <div className="mt-2 text-sm leading-6 text-[var(--text-2)] line-clamp-2">{project.topic_query}</div>
                      </div>
                      <span className={`inline-flex rounded-md px-3 py-1 text-xs font-medium ${meta.tone}`}>{meta.label}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
                      <span>{isEn ? "Updated" : "最后修改"} {formatRunDate(project.updated_at, locale)}</span>
                      <span>{isEn ? "Scripts" : "主稿"} {project.script_count}</span>
                      <span>{isEn ? "Image briefs" : "配图说明"} {project.storyboard_count}</span>
                      <span>{isEn ? "Image jobs" : "图片任务"} {project.render_job_count}</span>
                      <span>{isEn ? "Packages" : "包装产物"} {project.strategy_task_count}</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <Link href={action.href} className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-1)] transition hover:border-[var(--accent)]">
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
                  className="flex items-center justify-between gap-4 border-t border-[var(--border)] py-3 text-sm transition hover:bg-[var(--surface-muted)]"
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
