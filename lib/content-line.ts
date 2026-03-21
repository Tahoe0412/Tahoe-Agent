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
      label: "火星公民",
      description: "每期视频一个项目 — 自动产出脚本、分镜、标题、简介、发布文案",
      icon: Rocket,
    },
    MARKETING: {
      label: "商业线",
      description: "面向企业客户的营销内容 — 小红书/抖音文案、商业广告创意与广告视频",
      icon: Briefcase,
    },
  };

  const en: Record<ContentLine, ContentLineMeta> = {
    MARS_CITIZEN: {
      label: "Mars Citizen",
      description: "Public-facing science content brand — tech news, deep science explainers, robotics & Mars colonization videos",
      icon: Rocket,
    },
    MARKETING: {
      label: "Marketing",
      description: "Enterprise marketing content — Xiaohongshu/Douyin copy, commercial ad creatives & video ads",
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
    NARRATIVE_SCRIPT: { label: "叙事脚本", description: "可直接播报的完整口播稿", contentLine: "MARS_CITIZEN" },
    STORYBOARD_SCRIPT: { label: "AI 视频分镜", description: "AI 视频生成的画面指令分镜稿", contentLine: "MARS_CITIZEN" },
    VIDEO_TITLE: { label: "视频标题", description: "适合发布的吸引人标题", contentLine: "MARS_CITIZEN" },
    VIDEO_DESCRIPTION: { label: "视频简介", description: "视频简介 / 描述文字", contentLine: "MARS_CITIZEN" },
    PUBLISH_COPY: { label: "发布文案", description: "多平台发布文案", contentLine: "MARS_CITIZEN" },
    PLATFORM_COPY: { label: "平台文案", description: "小红书 / 抖音帖子文案", contentLine: "MARKETING" },
    AD_SCRIPT: { label: "广告脚本", description: "商业广告口播 / 配音脚本", contentLine: "MARKETING" },
    AD_STORYBOARD: { label: "广告分镜", description: "商业广告分镜脚本", contentLine: "MARKETING" },
    AD_CREATIVE: { label: "广告创意", description: "广告创意 Brief / 策略方案", contentLine: "MARKETING" },
  };

  const en: Record<OutputType, OutputTypeMeta> = {
    NARRATIVE_SCRIPT: { label: "Narrative Script", description: "Complete voiceover script ready for recording", contentLine: "MARS_CITIZEN" },
    STORYBOARD_SCRIPT: { label: "AI Video Storyboard", description: "Visual prompt storyboard for AI video generation", contentLine: "MARS_CITIZEN" },
    VIDEO_TITLE: { label: "Video Title", description: "Catchy, platform-ready video title", contentLine: "MARS_CITIZEN" },
    VIDEO_DESCRIPTION: { label: "Video Description", description: "Video description / metadata text", contentLine: "MARS_CITIZEN" },
    PUBLISH_COPY: { label: "Publish Copy", description: "Multi-platform publishing copy", contentLine: "MARS_CITIZEN" },
    PLATFORM_COPY: { label: "Platform Copy", description: "Xiaohongshu / Douyin post copy", contentLine: "MARKETING" },
    AD_SCRIPT: { label: "Ad Script", description: "Commercial ad voiceover / narration script", contentLine: "MARKETING" },
    AD_STORYBOARD: { label: "Ad Storyboard", description: "Commercial ad storyboard script", contentLine: "MARKETING" },
    AD_CREATIVE: { label: "Ad Creative", description: "Ad creative brief / strategy", contentLine: "MARKETING" },
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
