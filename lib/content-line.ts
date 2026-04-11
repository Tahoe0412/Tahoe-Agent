/**
 * Content Line and Output Type definitions.
 *
 * ContentLine is the top-level classification distinguishing public-facing
 * science content (Mars Citizen) from enterprise-facing marketing content.
 *
 * OutputType describes the specific deliverable within each content line.
 */

// ---------------------------------------------------------------------------
// Content Line
// ---------------------------------------------------------------------------

export type ContentLine = "MARS_CITIZEN" | "MARKETING";

export const contentLineList: ContentLine[] = ["MARS_CITIZEN", "MARKETING"];

export function isContentLine(value: unknown): value is ContentLine {
  return typeof value === "string" && contentLineList.includes(value as ContentLine);
}

export function getContentLine(input: unknown): ContentLine {
  return isContentLine(input) ? input : "MARS_CITIZEN";
}

// ---------------------------------------------------------------------------
// Output Type
// ---------------------------------------------------------------------------

/** Mars Citizen output types */
export type MarsCitizenOutputType =
  | "NARRATIVE_SCRIPT"
  | "STORYBOARD_SCRIPT"
  | "VIDEO_TITLE"
  | "VIDEO_DESCRIPTION"
  | "PUBLISH_COPY";

/** Marketing output types */
export type MarketingOutputType =
  | "PLATFORM_COPY"
  | "AD_SCRIPT"
  | "AD_STORYBOARD"
  | "AD_CREATIVE";

export type OutputType = MarsCitizenOutputType | MarketingOutputType;

export const marsCitizenOutputTypes: MarsCitizenOutputType[] = [
  "NARRATIVE_SCRIPT",
  "STORYBOARD_SCRIPT",
  "VIDEO_TITLE",
  "VIDEO_DESCRIPTION",
  "PUBLISH_COPY",
];

export const marketingOutputTypes: MarketingOutputType[] = [
  "PLATFORM_COPY",
  "AD_SCRIPT",
  "AD_STORYBOARD",
  "AD_CREATIVE",
];

export const allOutputTypes: OutputType[] = [
  ...marsCitizenOutputTypes,
  ...marketingOutputTypes,
];

export function isOutputType(value: unknown): value is OutputType {
  return typeof value === "string" && allOutputTypes.includes(value as OutputType);
}

export function getOutputTypesForLine(line: ContentLine): OutputType[] {
  return line === "MARS_CITIZEN" ? marsCitizenOutputTypes : marketingOutputTypes;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

import { Rocket, Briefcase, LucideIcon } from "lucide-react";

interface ContentLineMeta {
  label: string;
  description: string;
  icon: LucideIcon;
}

interface OutputTypeMeta {
  label: string;
  description: string;
  contentLine: ContentLine;
}

export function getContentLineMeta(
  line: ContentLine,
  locale: "zh" | "en" = "zh",
): ContentLineMeta {
  const zh: Record<ContentLine, ContentLineMeta> = {
    MARS_CITIZEN: {
      label: "内容矩阵",
      description: "头条号图文矩阵",
      icon: Rocket,
    },
    MARKETING: {
      label: "商业服务",
      description: "客户内容与广告服务",
      icon: Briefcase,
    },
  };

  const en: Record<ContentLine, ContentLineMeta> = {
    MARS_CITIZEN: {
      label: "Owned Media",
      description: "Toutiao-first article and image publishing",
      icon: Rocket,
    },
    MARKETING: {
      label: "Commercial Services",
      description: "Client-facing content and ad work",
      icon: Briefcase,
    },
  };

  return (locale === "en" ? en : zh)[line];
}

export function getOutputTypeMeta(
  type: OutputType,
  locale: "zh" | "en" = "zh",
): OutputTypeMeta {
  const zh: Record<OutputType, OutputTypeMeta> = {
    NARRATIVE_SCRIPT: { label: "主稿 / 长文", description: "文章主稿", contentLine: "MARS_CITIZEN" },
    STORYBOARD_SCRIPT: { label: "配图说明", description: "封面与组图 brief", contentLine: "MARS_CITIZEN" },
    VIDEO_TITLE: { label: "内容标题", description: "标题包", contentLine: "MARS_CITIZEN" },
    VIDEO_DESCRIPTION: { label: "内容摘要", description: "摘要与导语", contentLine: "MARS_CITIZEN" },
    PUBLISH_COPY: { label: "发布文案", description: "平台发布文案", contentLine: "MARS_CITIZEN" },
    PLATFORM_COPY: { label: "平台文案", description: "平台正文", contentLine: "MARKETING" },
    AD_SCRIPT: { label: "广告主稿", description: "广告正文", contentLine: "MARKETING" },
    AD_STORYBOARD: { label: "广告配图说明", description: "广告配图 brief", contentLine: "MARKETING" },
    AD_CREATIVE: { label: "广告创意", description: "创意方向", contentLine: "MARKETING" },
  };

  const en: Record<OutputType, OutputTypeMeta> = {
    NARRATIVE_SCRIPT: { label: "Master Draft", description: "Article draft", contentLine: "MARS_CITIZEN" },
    STORYBOARD_SCRIPT: { label: "Image Brief", description: "Cover and image brief", contentLine: "MARS_CITIZEN" },
    VIDEO_TITLE: { label: "Content Title", description: "Title pack", contentLine: "MARS_CITIZEN" },
    VIDEO_DESCRIPTION: { label: "Content Summary", description: "Summary and lead", contentLine: "MARS_CITIZEN" },
    PUBLISH_COPY: { label: "Publish Copy", description: "Publishing copy", contentLine: "MARS_CITIZEN" },
    PLATFORM_COPY: { label: "Platform Copy", description: "Platform post copy", contentLine: "MARKETING" },
    AD_SCRIPT: { label: "Ad Master Draft", description: "Ad draft", contentLine: "MARKETING" },
    AD_STORYBOARD: { label: "Ad Image Brief", description: "Ad image brief", contentLine: "MARKETING" },
    AD_CREATIVE: { label: "Ad Creative", description: "Creative direction", contentLine: "MARKETING" },
  };

  return (locale === "en" ? en : zh)[type];
}

// ---------------------------------------------------------------------------
// WorkspaceMode → ContentLine mapping
// ---------------------------------------------------------------------------

import type { WorkspaceMode } from "./workspace-mode";

const workspaceModeToContentLine: Record<WorkspaceMode, ContentLine> = {
  SHORT_VIDEO: "MARS_CITIZEN",
  COPYWRITING: "MARKETING",
  PROMOTION: "MARKETING",
};

/**
 * Derive the ContentLine from a WorkspaceMode.
 * Used for backwards compatibility with existing projects that don't have `content_line` set.
 */
export function contentLineFromWorkspaceMode(mode: WorkspaceMode): ContentLine {
  return workspaceModeToContentLine[mode];
}
