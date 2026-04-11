import type { StyleReferenceInsight } from "@/lib/style-reference";
import type { WorkspaceMode } from "@/lib/workspace-mode";

/**
 * Props type for the ProjectContext component `project` prop,
 * exported to allow type-safe factory construction.
 */
export type ProjectContextProject = {
  id: string;
  title: string;
  topic_query: string;
  workspaceMode?: WorkspaceMode;
  introduction?: string | null;
  coreIdea?: string | null;
  originalScript?: string | null;
  styleReferenceSample?: string | null;
  styleReferenceInsight?: StyleReferenceInsight | null;
  writingMode?: string | null;
  writingModeLabel?: string | null;
  styleTemplate?: string | null;
  styleTemplateLabel?: string | null;
  copyLength?: string | null;
  copyLengthLabel?: string | null;
  usageScenario?: string | null;
  usageScenarioLabel?: string | null;
};

/**
 * Build the `project` prop for <ProjectContext> from a workspace query result.
 * Centralises the mapping so individual pages no longer need `as never` type escapes.
 */
export function buildProjectContextProject(workspace: {
  project: { id: string; title: string; topic_query: string };
  workspaceMode: WorkspaceMode;
  projectSummary: {
    introduction: string;
    coreIdea: string;
    originalScript: string;
    styleReferenceSample: string;
    styleReferenceInsight: StyleReferenceInsight | null;
    writingMode: string;
    writingModeLabel: string;
    styleTemplate: string;
    styleTemplateLabel: string;
    copyLength: string;
    copyLengthLabel: string;
    usageScenario: string;
    usageScenarioLabel: string;
  };
}): ProjectContextProject {
  return {
    id: workspace.project.id,
    title: workspace.project.title,
    topic_query: workspace.project.topic_query,
    workspaceMode: workspace.workspaceMode,
    introduction: workspace.projectSummary.introduction,
    coreIdea: workspace.projectSummary.coreIdea,
    originalScript: workspace.projectSummary.originalScript,
    styleReferenceSample: workspace.projectSummary.styleReferenceSample,
    styleReferenceInsight: workspace.projectSummary.styleReferenceInsight,
    writingMode: workspace.projectSummary.writingMode,
    writingModeLabel: workspace.projectSummary.writingModeLabel,
    styleTemplate: workspace.projectSummary.styleTemplate,
    styleTemplateLabel: workspace.projectSummary.styleTemplateLabel,
    copyLength: workspace.projectSummary.copyLength,
    copyLengthLabel: workspace.projectSummary.copyLengthLabel,
    usageScenario: workspace.projectSummary.usageScenario,
    usageScenarioLabel: workspace.projectSummary.usageScenarioLabel,
  };
}
