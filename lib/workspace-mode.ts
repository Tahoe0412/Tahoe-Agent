import type { SupportedPlatform } from "@/types/platform-data";

export type WorkspaceMode = "SHORT_VIDEO" | "COPYWRITING" | "PROMOTION";

export const workspaceModeList: WorkspaceMode[] = ["SHORT_VIDEO", "COPYWRITING", "PROMOTION"];

export function isWorkspaceMode(value: unknown): value is WorkspaceMode {
  return typeof value === "string" && workspaceModeList.includes(value as WorkspaceMode);
}

export function getWorkspaceMode(input: unknown): WorkspaceMode {
  return isWorkspaceMode(input) ? input : "SHORT_VIDEO";
}

export function getWorkspaceModeMeta(mode: WorkspaceMode, locale: "zh" | "en" = "zh") {
  const zh = {
    SHORT_VIDEO: {
      label: "短视频",
      description: "适合做趋势研究、脚本拆解、分镜规划与素材编排。",
      titleDefault: "短视频内容项目",
      topicDefault: "品牌短视频内容方向",
      sourceScriptDefault:
        "原始脚本：\n我们要围绕一个核心主题，做一条更适合短视频传播的内容，重点强调钩子、节奏、镜头表达和转化动作。",
      platforms: ["YOUTUBE", "X", "TIKTOK"] satisfies SupportedPlatform[],
    },
    COPYWRITING: {
      label: "文案写作",
      description: "适合做品牌文案、平台稿、标题钩子和转化表达。",
      titleDefault: "品牌文案项目",
      topicDefault: "品牌核心信息表达",
      sourceScriptDefault:
        "原始文案需求：\n我们希望把一个核心卖点整理成更适合品牌传播和内容发布的文案，包括标题、正文结构、卖点表达和行动引导。",
      platforms: ["X", "YOUTUBE"] satisfies SupportedPlatform[],
    },
    PROMOTION: {
      label: "宣传推广",
      description: "适合做产品宣传、活动物料和平台适配传播内容。",
      titleDefault: "宣传推广项目",
      topicDefault: "新品宣传与平台推广",
      sourceScriptDefault:
        "推广需求：\n我们希望围绕一个产品或活动做整套宣传内容，明确目标用户、平台重点、核心卖点、风险边界和发布前准备。",
      platforms: ["YOUTUBE", "X", "TIKTOK"] satisfies SupportedPlatform[],
    },
  } as const;

  const en = {
    SHORT_VIDEO: {
      label: "Short Video",
      description: "For trend research, script breakdown, storyboard planning, and asset orchestration.",
      titleDefault: "Short Video Project",
      topicDefault: "Brand short-form direction",
      sourceScriptDefault:
        "Source script:\nWe want to turn one core idea into a short-form video with a stronger hook, cleaner pacing, and clearer visual actions.",
      platforms: ["YOUTUBE", "X", "TIKTOK"] satisfies SupportedPlatform[],
    },
    COPYWRITING: {
      label: "Copywriting",
      description: "For brand copy, platform-ready drafts, hooks, and conversion messaging.",
      titleDefault: "Brand Copy Project",
      topicDefault: "Brand message system",
      sourceScriptDefault:
        "Copy brief:\nWe want to turn one core product or brand message into stronger titles, body copy, supporting points, and a clear CTA.",
      platforms: ["X", "YOUTUBE"] satisfies SupportedPlatform[],
    },
    PROMOTION: {
      label: "Promotion",
      description: "For product promotion, campaign messaging, and cross-platform launch preparation.",
      titleDefault: "Promotion Project",
      topicDefault: "Launch and promotion strategy",
      sourceScriptDefault:
        "Promotion brief:\nWe want to build a full set of messaging around one product or campaign, including audience, key value, platform focus, and publishing prep.",
      platforms: ["YOUTUBE", "X", "TIKTOK"] satisfies SupportedPlatform[],
    },
  } as const;

  return (locale === "en" ? en : zh)[mode];
}
