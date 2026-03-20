import {
  contentLineFromWorkspaceMode,
  getOutputTypeMeta,
  isContentLine,
  isOutputType,
  type ContentLine,
  type OutputType,
} from "./content-line";
import { isWorkspaceMode, type WorkspaceMode } from "./workspace-mode";

export type WorkflowKind = ContentLine;

type IntentLike = {
  contentLine?: unknown;
  outputType?: unknown;
  workspaceMode?: unknown;
};

type MetadataLike = {
  content_line?: unknown;
  output_type?: unknown;
  workspace_mode?: unknown;
} | null | undefined;

const compatibleWorkspaceModes: Record<ContentLine, WorkspaceMode[]> = {
  MARS_CITIZEN: ["SHORT_VIDEO"],
  MARKETING: ["COPYWRITING", "PROMOTION"],
};

const outputTypeToWorkspaceMode: Record<OutputType, WorkspaceMode> = {
  NARRATIVE_SCRIPT: "SHORT_VIDEO",
  STORYBOARD_SCRIPT: "SHORT_VIDEO",
  VIDEO_TITLE: "SHORT_VIDEO",
  VIDEO_DESCRIPTION: "SHORT_VIDEO",
  PUBLISH_COPY: "SHORT_VIDEO",
  PLATFORM_COPY: "COPYWRITING",
  AD_SCRIPT: "PROMOTION",
  AD_STORYBOARD: "PROMOTION",
  AD_CREATIVE: "PROMOTION",
};

export interface ResolvedProjectIntent {
  contentLine: ContentLine;
  outputType: OutputType;
  workspaceMode: WorkspaceMode;
  workflowKind: WorkflowKind;
}

export function workflowKindFromContentLine(contentLine: ContentLine): WorkflowKind {
  return contentLine;
}

export function workspaceModeFromContentLine(contentLine: ContentLine): WorkspaceMode {
  return contentLine === "MARS_CITIZEN" ? "SHORT_VIDEO" : "COPYWRITING";
}

export function workspaceModeFromOutputType(outputType: OutputType): WorkspaceMode {
  return outputTypeToWorkspaceMode[outputType];
}

export function getDefaultOutputTypeForContentLine(contentLine: ContentLine): OutputType {
  return contentLine === "MARS_CITIZEN" ? "NARRATIVE_SCRIPT" : "AD_SCRIPT";
}

export function deriveProjectTitle(input: {
  title?: string | null;
  topic?: string | null;
}) {
  const title = input.title?.trim();
  if (title) {
    return title.slice(0, 120);
  }

  const topic = input.topic?.trim();
  if (topic) {
    return topic.slice(0, 120);
  }

  return "Untitled Project";
}

export function buildDashboardCreateHref(input: {
  title?: string | null;
  topic?: string | null;
  contentLine?: ContentLine;
  outputType?: OutputType;
}) {
  const params = new URLSearchParams();

  const title = input.title?.trim();
  if (title) {
    params.set("title", title);
  }

  const topic = input.topic?.trim();
  if (topic) {
    params.set("topic", topic);
  }

  if (input.contentLine) {
    params.set("contentLine", input.contentLine);
  }

  if (input.outputType) {
    params.set("outputType", input.outputType);
  }

  const query = params.toString();
  return `/${query ? `?${query}` : ""}#new-project`;
}

export function isWorkspaceModeCompatibleWithContentLine(
  contentLine: ContentLine,
  workspaceMode: WorkspaceMode,
) {
  return compatibleWorkspaceModes[contentLine].includes(workspaceMode);
}

export function isOutputTypeCompatibleWithContentLine(
  contentLine: ContentLine,
  outputType: OutputType,
) {
  return getOutputTypeMeta(outputType, "en").contentLine === contentLine;
}

export function resolveContentLine(input: IntentLike): ContentLine {
  if (isContentLine(input.contentLine)) {
    return input.contentLine;
  }

  if (isWorkspaceMode(input.workspaceMode)) {
    return contentLineFromWorkspaceMode(input.workspaceMode);
  }

  return "MARS_CITIZEN";
}

export function resolveWorkspaceMode(
  contentLine: ContentLine,
  requestedWorkspaceMode?: unknown,
  requestedOutputType?: unknown,
): WorkspaceMode {
  if (
    isWorkspaceMode(requestedWorkspaceMode) &&
    isWorkspaceModeCompatibleWithContentLine(contentLine, requestedWorkspaceMode)
  ) {
    return requestedWorkspaceMode;
  }

  if (
    requestedOutputType != null &&
    requestedOutputType !== "" &&
    isOutputType(requestedOutputType) &&
    isOutputTypeCompatibleWithContentLine(contentLine, requestedOutputType)
  ) {
    return workspaceModeFromOutputType(requestedOutputType);
  }

  return workspaceModeFromContentLine(contentLine);
}

export function resolveOutputType(
  contentLine: ContentLine,
  requestedOutputType?: unknown,
): OutputType {
  if (requestedOutputType == null || requestedOutputType === "") {
    return getDefaultOutputTypeForContentLine(contentLine);
  }

  if (!isOutputType(requestedOutputType)) {
    throw new Error(`Unsupported output type: ${String(requestedOutputType)}.`);
  }

  if (!isOutputTypeCompatibleWithContentLine(contentLine, requestedOutputType)) {
    throw new Error(`Output type ${requestedOutputType} is not valid for content line ${contentLine}.`);
  }

  return requestedOutputType;
}

export function coerceOutputType(
  contentLine: ContentLine,
  requestedOutputType?: unknown,
): OutputType {
  if (
    requestedOutputType != null &&
    requestedOutputType !== "" &&
    isOutputType(requestedOutputType) &&
    isOutputTypeCompatibleWithContentLine(contentLine, requestedOutputType)
  ) {
    return requestedOutputType;
  }

  return getDefaultOutputTypeForContentLine(contentLine);
}

export function resolveProjectIntent(input: IntentLike): ResolvedProjectIntent {
  const contentLine = resolveContentLine(input);
  const outputType = resolveOutputType(contentLine, input.outputType);
  const workspaceMode = resolveWorkspaceMode(contentLine, input.workspaceMode, outputType);

  return {
    contentLine,
    outputType,
    workspaceMode,
    workflowKind: workflowKindFromContentLine(contentLine),
  };
}

export function resolveProjectIntentFromMetadata(metadata: MetadataLike): ResolvedProjectIntent {
  const contentLine = resolveContentLine({
    contentLine: metadata?.content_line,
    workspaceMode: metadata?.workspace_mode,
  });
  const outputType = coerceOutputType(contentLine, metadata?.output_type);
  const workspaceMode = resolveWorkspaceMode(contentLine, metadata?.workspace_mode, outputType);

  return {
    contentLine,
    outputType,
    workspaceMode,
    workflowKind: workflowKindFromContentLine(contentLine),
  };
}
