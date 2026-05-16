import { PageHeader } from "@/components/ui/page-header";
import { EmptyPanel, ErrorPanel } from "@/components/ui/state-panel";
import { ProjectContext } from "@/components/workspace/project-context";
import { DailyRunPackagingNotice } from "@/components/workspace/daily-run-packaging-notice";
import { buildProjectContextProject } from "@/lib/build-project-context";
import { PageStateView } from "@/components/workspace/page-state";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { ScriptLabWorkbench } from "@/components/workspace/script-lab-workbench";
import { ScriptPreviewPanel } from "@/components/workspace/script-preview-panel";
import { WorkspaceLayout } from "@/components/workspace/layout";
import type { PageState } from "@/lib/demo-workspace-data";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export default async function ScriptLabPage({
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
  const isOwnedMediaPackage = workspace?.fastPackage?.contentLine === "OWNED_MEDIA";
  const isOwnedMediaLine = isOwnedMediaPackage || workspace?.contentLine === "MARS_CITIZEN";
  const hasTitlePack = Boolean(workspace?.marsOutputs.latestVideoTitlePack);
  const hasPublishCopy = Boolean(workspace?.marsOutputs.latestPublishCopy);
  const hasImageBrief = Boolean(workspace?.scriptLabRows.length);
  const routesToStoryboard =
    workspace?.outputType === "STORYBOARD_SCRIPT" ||
    workspace?.outputType === "AD_STORYBOARD";
  const nextHref =
    isOwnedMediaLine
      ? projectId
        ? `/script-lab?projectId=${projectId}#publish-copy`
        : "/script-lab"
      : routesToStoryboard
      ? projectId
        ? `/scene-planner?projectId=${projectId}`
        : "/scene-planner"
      : projectId
        ? `/marketing-ops?projectId=${projectId}`
        : "/marketing-ops";
  const nextLabel =
    isOwnedMediaLine
      ? locale === "en"
        ? "Next: Publish copy"
        : "下一步：发布文案"
      : routesToStoryboard
      ? locale === "en"
        ? "Next: Image Brief"
        : "下一步：配图说明"
      : locale === "en"
        ? "Next: Write Marketing Copy"
        : "下一步：去写宣传文案";

  return (
    <WorkspaceLayout locale={locale}>
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow={text.pages.script.eyebrow}
          title={locale === "en" ? "Final Edit" : "成稿编辑"}
          description={
            locale === "en"
              ? "Check the draft, settle the title, and collect publish copy before release."
              : "核正文、定标题、收发布文案和配图说明；确认后就能发布。"
          }
          locale={locale}
          action={projectId ? <NextStepLink href={nextHref} label={nextLabel} /> : null}
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
              ? "The project list is temporarily unavailable, but Final Edit will be ready once workspace data recovers."
              : "当前项目列表暂时不可用，但成稿编辑页本身已可访问，等工作区数据恢复后即可继续选择项目。"}
          </div>
        ) : null}

        {loadFailed ? (
          <ErrorPanel
            title={locale === "en" ? "Final Edit Is Temporarily Unavailable" : "成稿编辑暂时不可用"}
            description={
              locale === "en"
                ? "Workspace data could not be loaded just now. Refresh the page or switch projects after the server recovers."
                : "当前工作区数据暂时没有成功加载。请稍后刷新，或在服务恢复后重新切换项目。"
            }
            action={<NextStepLink href={projectId ? `/script-lab?projectId=${projectId}` : "/script-lab"} label={locale === "en" ? "Retry Loading" : "重新加载"} />}
          />
        ) : state && state !== "ready" ? (
          <PageStateView state={state} locale={locale} />
        ) : !projectId ? (
          <EmptyPanel title={locale === "en" ? "Select a Project" : "等待选择项目"} description={locale === "en" ? "Select a project first to view final-edit data." : "请先选择项目，再查看成稿编辑内容。"} action={<NextStepLink href="/" label={locale === "en" ? "Back to Dashboard" : "先回总览选项目"} />} />
        ) : !workspace ? (
          <ErrorPanel
            title={locale === "en" ? "Edit Data Unavailable" : "无法读取成稿编辑内容"}
            description={
              locale === "en"
                ? "The project could not be found, or this output has not been prepared yet."
                : "当前项目没有成功加载，或这条产物还没有准备到脚本打磨这一步。"
            }
            action={<NextStepLink href={`/?projectId=${projectId}`} label={locale === "en" ? "Back to Dashboard" : "返回总览页"} />}
          />
        ) : workspace.scriptLabRows.length === 0 && workspace.latestScriptPreview ? (
          <>
            <DailyRunPackagingNotice
              isOwnedMediaPackage={isOwnedMediaPackage}
              packagingIncomplete
              packagingStatus={workspace.fastPackage?.packagingStatus}
              hasTitlePack={hasTitlePack}
              hasPublishCopy={hasPublishCopy}
              hasImageBrief={hasImageBrief}
              locale={locale}
            />
            <ScriptPreviewPanel script={workspace.latestScriptPreview} locale={locale} />
          </>
        ) : workspace.scriptLabRows.length === 0 ? (
          <EmptyPanel
            title={locale === "en" ? "No Script Draft Yet" : "还没有可打磨的脚本"}
            description={
              locale === "en"
                ? "Start by generating the first draft for this project, then come back here for the final edit."
                : "先为这个项目生成第一版正文，再回到这里做最后轻改。"
            }
            action={
              <NextStepLink
                href={`/?projectId=${projectId}`}
                label={locale === "en" ? "Generate First Draft" : "先生成第一版"}
              />
            }
          />
        ) : (
          <ScriptLabWorkbench
            projectId={projectId}
            rows={workspace.scriptLabRows}
            marsOutputs={workspace.marsOutputs}
            latestDraftPreview={workspace.latestScriptPreview}
            isOwnedMediaPackage={isOwnedMediaPackage}
            fastPackageStatus={workspace.fastPackage?.packagingStatus}
            locale={locale}
          />
        )}
      </div>
    </WorkspaceLayout>
  );
}
