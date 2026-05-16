import { PageHeader } from "@/components/ui/page-header";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { PageStateView } from "@/components/workspace/page-state";
import { ProjectContext } from "@/components/workspace/project-context";
import { buildProjectContextProject } from "@/lib/build-project-context";
import { RenderLabWorkbench } from "@/components/workspace/render-lab-workbench";
import type { PageState } from "@/lib/demo-workspace-data";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

export default async function RenderLabPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: PageState; projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { state, projectId } = await searchParams;
  const [recentProjectsResult, workspaceResult] = await Promise.allSettled([
    workspaceQueryService.listRecentProjects(),
    projectId ? workspaceQueryService.getProjectWorkspace(projectId) : Promise.resolve(null),
  ]);
  const recentProjects = recentProjectsResult.status === "fulfilled" ? recentProjectsResult.value : [];
  const workspace = workspaceResult.status === "fulfilled" ? workspaceResult.value : null;
  const recentProjectsUnavailable = recentProjectsResult.status === "rejected";
  const workspaceLoadFailed = workspaceResult.status === "rejected";
  const loadFailed = Boolean(projectId) && workspaceLoadFailed;
  const nextHref = !projectId
    ? "/"
    : workspace?.contentLine === "MARKETING"
      ? `/marketing-ops?projectId=${projectId}`
      : `/script-lab?projectId=${projectId}`;
  const nextLabel = !projectId
    ? locale === "en"
      ? "Back to Home"
      : "返回首页"
    : workspace?.contentLine === "MARKETING"
      ? locale === "en"
        ? "Back to Creative & Copy"
        : "返回创意与文案"
      : locale === "en"
        ? "Back to Draft & Packaging"
        : "返回主稿与发布包装";

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.renderLab.eyebrow}
          title={text.pages.renderLab.title}
          description={text.pages.renderLab.description}
          locale={locale}
          action={
            projectId ? (
              <NextStepLink href={nextHref} label={nextLabel} />
            ) : null
          }
        />
        <ProjectContext
          project={workspace ? buildProjectContextProject(workspace) : null}
          recentProjects={recentProjects.map((project) => ({ id: project.id, title: project.title, topic_query: project.topic_query, is_pinned: project.is_pinned }))}
          locale={locale}
          density="compact"
        />

        {recentProjectsUnavailable && !projectId ? (
          <div className="border-y border-[color:color-mix(in_srgb,var(--warning-text)_24%,transparent)] bg-transparent px-0 py-3 text-sm leading-7 text-[var(--warning-text)]">
            {locale === "en"
              ? "The project list is temporarily unavailable, but the image-production page will be ready once the workspace data recovers."
              : "当前项目列表暂时不可用，但图片生产页面本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}

        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Image Production Is Temporarily Unavailable" : "图片生产暂时不可用"}
            description={locale === "en" ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers." : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"}
            action={<NextStepLink href={projectId ? `/render-lab?projectId=${projectId}` : "/render-lab"} label={locale === "en" ? "Retry Loading" : "重新加载"} />}
          />
        ) : state && state !== "ready" ? (
          <PageStateView state={state} locale={locale} />
        ) : !projectId ? (
          <EmptyPanel
            title={locale === "en" ? "Select a Project" : "等待选择项目"}
            description={
              locale === "en"
                ? "Open a project first, then use this page to turn image briefs into concrete image jobs."
                : "请先选择项目，再把配图说明推进成具体的图片任务。"
            }
            action={<NextStepLink href="/" label={locale === "en" ? "Back to Home" : "先回首页选项目"} />}
          />
        ) : !workspace ? (
          <ErrorPanel
            title={locale === "en" ? "Image Production Data Unavailable" : "无法读取图片制作数据"}
            description={
              locale === "en"
                ? "The current project could not be found, or this output has not been prepared for image-production work yet."
                : "当前项目不存在，或这条内容还没有准备到图片制作这一步。"
            }
            action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Project" : "返回当前项目"} />}
          />
        ) : workspace.scenePlannerRows.length === 0 ? (
          <EmptyPanel
            title={locale === "en" ? "No Image Brief Ready Yet" : "还没有可进入图片生产的配图说明"}
            description={
              locale === "en"
                ? "Finish the first image brief first, then return here to refine prompts and create image jobs."
                : "先完成第一版配图说明，再回来细修提示词并创建图片任务。"
            }
            action={<NextStepLink href={`/scene-planner?projectId=${projectId}`} label={locale === "en" ? "Finish Image Brief First" : "先完成配图说明"} />}
          />
        ) : (
          <RenderLabWorkbench projectId={projectId} rows={workspace.scenePlannerRows} jobs={workspace.latestRenderJobs} locale={locale} />
        )}
      </div>
    </WorkspaceLayout>
  );
}
