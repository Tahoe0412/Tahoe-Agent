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
      label: "内容矩阵",
      description: "适合做选题研究、文章主稿、配图说明与发布包装。",
      titleDefault: "内容矩阵项目",
      topicDefault: "本期图文选题方向",
      sourceScriptDefault:
        "背景材料：\n围绕一个核心主题整理素材、事实、判断和表达角度，目标是形成一篇更适合图文发布的高质量主稿，并为后续配图留出清晰视觉方向。",
      platforms: ["X", "XHS", "DOUYIN"] satisfies SupportedPlatform[],
      displayPlatforms: ["头条号", "微信公众号", "小红书", "知乎"],
    },
    COPYWRITING: {
      label: "文案写作",
      description: "适合做品牌文案、平台稿、标题钩子和转化表达。",
      titleDefault: "品牌文案项目",
      topicDefault: "品牌核心信息表达",
      sourceScriptDefault:
        "原始文案需求：\n我们希望把一个核心卖点整理成更适合品牌传播和内容发布的文案，包括标题、正文结构、卖点表达和行动引导。",
      platforms: ["X", "YOUTUBE", "XHS"] satisfies SupportedPlatform[],
      displayPlatforms: ["小红书", "微信公众号", "X", "YouTube"],
    },
    PROMOTION: {
      label: "宣传推广",
      description: "适合做产品宣传、活动物料和平台适配传播内容。",
      titleDefault: "宣传推广项目",
      topicDefault: "新品宣传与平台推广",
      sourceScriptDefault:
        "推广需求：\n我们希望围绕一个产品或活动做整套宣传内容，明确目标用户、平台重点、核心卖点、风险边界和发布前准备。",
      platforms: ["X", "XHS", "DOUYIN"] satisfies SupportedPlatform[],
      displayPlatforms: ["全平台分发"],
    },
  } as const;

  const en = {
    SHORT_VIDEO: {
      label: "Owned Media",
      description: "For topic research, master drafts, image briefs, and publishing packages.",
      titleDefault: "Owned Media Project",
      topicDefault: "Current article/image direction",
      sourceScriptDefault:
        "Background material:\nOrganize source facts, judgments, and framing around one topic so the project can turn into a stronger article draft and a clearer image direction.",
      platforms: ["X", "XHS", "DOUYIN"] satisfies SupportedPlatform[],
      displayPlatforms: ["Toutiao", "WeChat", "Xiaohongshu", "Zhihu"],
    },
    COPYWRITING: {
      label: "Copywriting",
      description: "For brand copy, platform-ready drafts, hooks, and conversion messaging.",
      titleDefault: "Brand Copy Project",
      topicDefault: "Brand message system",
      sourceScriptDefault:
        "Copy brief:\nWe want to turn one core product or brand message into stronger titles, body copy, supporting points, and a clear CTA.",
      platforms: ["X", "YOUTUBE", "XHS"] satisfies SupportedPlatform[],
      displayPlatforms: ["Xiaohongshu", "WeChat", "X", "YouTube"],
    },
    PROMOTION: {
      label: "Promotion",
      description: "For product promotion, campaign messaging, and cross-platform launch preparation.",
      titleDefault: "Promotion Project",
      topicDefault: "Launch and promotion strategy",
      sourceScriptDefault:
        "Promotion brief:\nWe want to build a full set of messaging around one product or campaign, including audience, key value, platform focus, and publishing prep.",
      platforms: ["X", "XHS", "DOUYIN"] satisfies SupportedPlatform[],
      displayPlatforms: ["All Platforms"],
    },
  } as const;

  return (locale === "en" ? en : zh)[mode];
}
