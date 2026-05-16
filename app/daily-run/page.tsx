import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, Clock3, FileText, SearchCheck, TimerReset } from "lucide-react";
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

  if (project.fast_package_content_line === "OWNED_MEDIA") {
    if (project.storyboard_count === 0 || project.strategy_task_count < 2) {
      return "PACKAGE";
    }
    return "READY";
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
  const isOwnedMediaPackage = project.fast_package_content_line === "OWNED_MEDIA";

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
        label: locale === "en" ? "Complete article package" : "补齐文章包",
        href: `/script-lab${projectQuery}` as Route,
      };
    case "READY":
    default:
      return {
        label: locale === "en" ? "Final edit" : "最后轻改",
        href: (isOwnedMediaPackage ? `/script-lab${projectQuery}` : `/${projectQuery}`) as Route,
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
          eyebrow={isEn ? "Daily Desk" : "日更主线"}
          title={isEn ? "Today’s Topics" : "今日选题"}
          description={
            isEn
              ? "Pick one topic for each account, then generate three publishable article packages."
              : "三个账号各定一题，再生成三篇可发布图文。"
          }
          locale={locale}
        />

        {workspaceDataUnavailable ? (
          <ErrorPanel
            title={isEn ? "Daily Desk Is In Limited Mode" : "今日选题当前处于降级模式"}
            description={
              isEn
                ? "Project data did not fully load. The page shell still renders, but queue counts and next actions may be incomplete."
                : "项目数据暂时没有完整加载成功。页面仍可用，但队列计数和下一步建议可能不完整。"
            }
            locale={locale}
          />
        ) : null}

        <div className="grid gap-3 border-y border-[var(--border)] py-4 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-2)]">
            <span className="inline-flex items-center gap-1.5 rounded-[14px] border border-[var(--border)] px-3 py-1.5">
              <Clock3 className="size-3.5" />
              90m
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-[14px] border border-[var(--border)] px-3 py-1.5">
              <FileText className="size-3.5" />
              {isEn ? "3 posts" : "3 篇"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-[14px] border border-[var(--border)] px-3 py-1.5">
              <CheckCircle2 className="size-3.5" />
              {isEn ? `${readyCount} ready` : `${readyCount} 已可发`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-[var(--text-1)] lg:justify-end">
            {presets.map((preset) => (
              <span key={preset.id} className="rounded-[14px] bg-[var(--surface-muted)] px-3 py-1.5">
                {preset.label}
              </span>
            ))}
          </div>
        </div>

        <DailyRunSignalPanel locale={locale} />

        <PanelCard
          title={isEn ? "Account lanes" : "三线进度"}
          description={isEn ? "Open an existing package only when it needs a final edit." : "已有稿件只在需要定稿时打开。"}
        >
            <div className="divide-y divide-[var(--border)]">
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
                            {latestMeta ? <span className={`rounded-[14px] px-2 py-1 ${latestMeta.tone}`}>{latestMeta.label}</span> : null}
                            <span>{isEn ? "Ready packages" : "可发包"} {laneReadyCount}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm leading-6 text-[var(--text-2)]">
                          {isEn ? "No active package yet. Start from the topic search above." : "还没有今日稿，从上方热点搜索开始。"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      {latestAction ? (
                        <Link href={latestAction.href} className="inline-flex items-center gap-2 rounded-[14px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-1)] transition hover:border-[var(--accent)]">
                          {latestStage === "READY" ? (isEn ? "Final check" : "最终检查") : latestAction.label}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : null}
                      <a href="#daily-run-signals" className="inline-flex items-center gap-2 rounded-[14px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]">
                        {isEn ? "Pick topic" : "去选题"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
        </PanelCard>

        <div className="grid border-t border-[var(--border)] md:grid-cols-3">
          {[
            {
              key: "active",
              icon: TimerReset,
              title: isEn ? "Needs action" : "待处理",
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
                  <div className="flex size-9 items-center justify-center rounded-[14px] border border-[var(--border)] text-[var(--text-2)]">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-2xl font-semibold text-[var(--text-1)]">{stage.count}</div>
                </div>
                <div className="mt-4 text-sm font-medium text-[var(--text-1)]">{stage.title}</div>
              </div>
            );
          })}
        </div>

        <DetailPanel title={isEn ? "Details" : "详情"}>
            <div>
              <div className="text-sm font-medium text-[var(--text-1)]">{isEn ? "Production unit" : "生产单元"}</div>
              <div className="mt-2">{isEn ? "Treat one publishable article package as the unit: title, draft, image, packaging." : "以一篇可发布图文包为单位：标题、主稿、配图、包装一起看。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-1)]">{isEn ? "Current heuristic" : "当前启发式"}</div>
              <div className="mt-2">{isEn ? "Today’s Topics creates the quick package first. Open specialist pages only when one part needs repair." : "今日选题先生成快速发布包。只有某个部分明显不行时，再进入对应页面返修。"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text-1)]">{isEn ? "Main goal" : "当前目标"}</div>
              <div className="mt-2">{isEn ? "Keep three daily posts achievable within 90 minutes, with one final editorial pass instead of repeated reviews." : "保证 90 分钟内能完成三个号，一次最终编辑审查替代多轮逐项审核。"}</div>
            </div>
        </DetailPanel>

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
                      <span className={`inline-flex rounded-[14px] px-3 py-1 text-xs font-medium ${meta.tone}`}>{meta.label}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
                      <span>{isEn ? "Updated" : "最后修改"} {formatRunDate(project.updated_at, locale)}</span>
                      <span>{isEn ? "Scripts" : "主稿"} {project.script_count}</span>
                      <span>{isEn ? "Image briefs" : "配图说明"} {project.storyboard_count}</span>
                      <span>{isEn ? "Image jobs" : "图片任务"} {project.render_job_count}</span>
                      <span>{isEn ? "Packages" : "包装产物"} {project.strategy_task_count}</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <Link href={action.href} className="inline-flex items-center gap-2 rounded-[14px] border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-1)] transition hover:border-[var(--accent)]">
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
