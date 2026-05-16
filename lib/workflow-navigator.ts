import type { WorkspaceQueryService } from "@/services/workspace-query.service";

type WorkspaceType = Awaited<ReturnType<WorkspaceQueryService["getProjectWorkspace"]>>;

export interface WorkflowStep {
  href: string;
  label: string;
}

/**
 * Determines the logical "next step" for a project based on its current state.
 * Extracted from Dashboard (app/page.tsx) to centralize business routing logic.
 */
export function getDashboardNextStep(
  workspace: WorkspaceType,
  locale: "zh" | "en",
): WorkflowStep {
  const t = locale === "zh";

  // No workspace/project -> Create one
  if (!workspace) {
    return {
      href: "#new-project",
      label: t ? "开始新项目" : "Start a New Project",
    };
  }

  const isStoryboardOutput =
    workspace.outputType === "STORYBOARD_SCRIPT" ||
    workspace.outputType === "AD_STORYBOARD";

  if (isStoryboardOutput) {
    if (workspace.scenePlannerRows.length === 0) {
      return {
        href: `/scene-planner?projectId=${workspace.project.id}`,
        label: t ? "去写配图 brief" : "Write Image Brief",
      };
    }

    return {
      href: `/render-lab?projectId=${workspace.project.id}`,
      label: t ? "去出图" : "Open Image Desk",
    };
  }

  if (workspace.contentLine === "MARS_CITIZEN") {
    if (workspace.scriptLabRows.length === 0) {
      return {
        href: `/script-lab?projectId=${workspace.project.id}`,
        label: t ? "去成稿编辑" : "Open Final Edit",
      };
    }

    if (workspace.scenePlannerRows.length === 0) {
      return {
        href: `/scene-planner?projectId=${workspace.project.id}`,
        label: t ? "去补配图 brief" : "Continue Image Brief",
      };
    }

    return {
      href: `/render-lab?projectId=${workspace.project.id}`,
      label: t ? "去准备生成" : "Prepare Render",
    };
  }

  return {
    href: `/marketing-ops?projectId=${workspace.project.id}`,
    label: t ? "去生成内容" : "Generate Content",
  };
}
