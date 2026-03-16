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

  // Step 1: Brief is required for everything
  if (!workspace.latestBrief) {
    return {
      href: `/brief-studio?projectId=${workspace.project.id}`,
      label: t ? "先写任务单" : "Fill the Brief",
    };
  }

  // Step 2: Trends/Research (Optional but recommended first step after brief)
  if (workspace.trendRows.length === 0) {
    return {
      href: `/trend-explorer?projectId=${workspace.project.id}`,
      label: t ? "去看趋势主题" : "Generate Trends",
    };
  }

  // Step 3: Mode-specific execution
  if (workspace.workspaceMode === "SHORT_VIDEO") {
    // 3a. Needs script scenes
    if (workspace.scriptLabRows.length === 0) {
      return {
        href: `/script-lab?projectId=${workspace.project.id}`,
        label: t ? "去生成脚本镜头" : "Generate Script Scenes",
      };
    }

    // 3b. Has scenes, needs storyboard/assets
    return {
      href: `/scene-planner?projectId=${workspace.project.id}`,
      label: t ? "去补素材与分镜" : "Continue Storyboard",
    };
  }

  // DEFAULT (COPYWRITING / PROMOTION modes)
  // Needs master copy
  return {
    href: `/marketing-ops?projectId=${workspace.project.id}`,
    label: t ? "去生成宣传主稿" : "Continue Copy Drafting",
  };
}
