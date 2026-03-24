import type { CopyLength, UsageScenario } from "@/lib/copy-goal";
import type { StyleTemplate } from "@/lib/style-template";
import type { WritingMode } from "@/lib/writing-mode";
import type { WorkspaceMode } from "@/lib/workspace-mode";

function compact(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function splitTopicCandidates(topic: string) {
  return topic
    .split(/\s+OR\s+|[|｜、，,\/]+/gi)
    .map((item) => compact(item))
    .filter(Boolean);
}

function dedupe(items: string[]) {
  return Array.from(new Set(items));
}

function formatZhDate(date = new Date()) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function normalizeProjectTopic(topic: string, workspaceMode?: WorkspaceMode) {
  const source = compact(topic);
  if (!source) {
    return workspaceMode === "SHORT_VIDEO" ? "本期科技快讯选题" : "当前传播主题";
  }

  const candidates = dedupe(splitTopicCandidates(source));
  if (candidates.length <= 1) {
    return truncate(source, 120);
  }

  if (workspaceMode === "SHORT_VIDEO") {
    return truncate(`${candidates.slice(0, 4).join(" / ")} 最新动态`, 120);
  }

  return truncate(candidates.slice(0, 4).join(" / "), 120);
}

export function buildGeneratedProjectTitle(params: {
  title?: string | null;
  topicQuery?: string | null;
  workspaceMode?: WorkspaceMode;
  brandName?: string | null;
  date?: Date;
}) {
  const explicit = compact(params.title);
  if (explicit) {
    return truncate(explicit, 120);
  }

  const normalizedTopic = normalizeProjectTopic(params.topicQuery ?? "", params.workspaceMode);
  const brandName = compact(params.brandName) || (params.workspaceMode === "SHORT_VIDEO" ? "火星公民" : "");

  if (params.workspaceMode === "SHORT_VIDEO") {
    return truncate(`${brandName || "火星公民"}科技快讯 ${formatZhDate(params.date)}`, 120);
  }

  if (brandName) {
    return truncate(`${brandName}｜${normalizedTopic}`, 120);
  }

  return truncate(normalizedTopic, 120);
}

function getStylePositioning(styleTemplate: StyleTemplate) {
  switch (styleTemplate) {
    case "RATIONAL_PRO":
      return "理性、清楚、专业，不靠夸张词和情绪化口号取胜";
    case "WARM_HEALING":
      return "克制温和，有陪伴感，但仍保持信息清晰";
    case "LIGHT_LUXURY":
      return "简洁审美、质感表达、避免廉价促销感";
    case "HIGH_CONVERSION":
      return "结果导向、结构紧、动作明确，但避免生硬喊单";
    case "FOUNDER_VOICE":
      return "更像真实主理人表达，有判断、有观察、有态度";
    case "STORE_TRUST":
      return "强调信任建立、服务细节和真实体验感";
  }
}

function getWritingIntent(writingMode: WritingMode) {
  switch (writingMode) {
    case "BRAND_INTRO":
      return "建立品牌认知和长期印象";
    case "PRODUCT_PROMO":
      return "把主题讲清楚，并转成可直接使用的传播表达";
    case "CAMPAIGN_PROMO":
      return "围绕一个明确 campaign 角度组织传播节奏和卖点";
    case "RECRUITMENT":
      return "强调机会、环境、团队氛围和加入理由";
  }
}

function getScenarioLine(usageScenario: UsageScenario, copyLength: CopyLength) {
  const scenario =
    usageScenario === "XIAOHONGSHU_POST"
      ? "小红书正文"
      : usageScenario === "BRAND_LANDING"
        ? "品牌落地页"
        : usageScenario === "PRODUCT_DETAIL"
          ? "产品详情页"
          : usageScenario === "CAMPAIGN_LAUNCH"
            ? "活动发布"
            : usageScenario === "STORE_PROMOTION"
              ? "门店推广"
              : "主理人内容";
  const length =
    copyLength === "SHORT" ? "短版" : copyLength === "LONG" ? "长版" : "标准版";
  return `${scenario} ${length}`;
}

export function buildGeneratedProjectIntroduction(params: {
  topicQuery?: string | null;
  workspaceMode?: WorkspaceMode;
  brandName?: string | null;
  writingMode?: WritingMode;
  styleTemplate?: StyleTemplate;
  copyLength?: CopyLength;
  usageScenario?: UsageScenario;
  originalScript?: string | null;
}) {
  const topic = normalizeProjectTopic(params.topicQuery ?? "", params.workspaceMode);
  const brandName = compact(params.brandName) || (params.workspaceMode === "SHORT_VIDEO" ? "火星公民" : "当前品牌");
  const writingMode = params.writingMode ?? "PRODUCT_PROMO";
  const styleTemplate = params.styleTemplate ?? "RATIONAL_PRO";
  const copyLength = params.copyLength ?? "STANDARD";
  const usageScenario = params.usageScenario ?? "XIAOHONGSHU_POST";
  const sourceExcerpt = compact(params.originalScript).slice(0, 120);

  if (params.workspaceMode === "SHORT_VIDEO") {
    return [
      `本项目用于输出 ${brandName} 当期科技快讯内容，围绕「${topic}」整理最新动态、关键判断和可传播表达。`,
      "目标不是堆砌新闻点，而是把分散信息压缩成一条适合短视频表达的清晰主线：先说最值得关注的变化，再解释它为什么重要，最后给出用户能带走的结论。",
      `整体表达应保持${getStylePositioning(styleTemplate)}，最终优先适配短视频发布与后续包装使用。`,
      sourceExcerpt ? `当前已收集的原始材料可作为事实底稿继续展开：${sourceExcerpt}${sourceExcerpt.length >= 120 ? "…" : ""}` : "",
    ].filter(Boolean).join("\n\n");
  }

  return [
    `本项目围绕「${topic}」组织当前传播表达，主要服务于 ${brandName} 的 ${getScenarioLine(usageScenario, copyLength)} 输出。`,
    `本轮内容的核心任务是${getWritingIntent(writingMode)}，并把已有信息整理成可直接进入文案、创意或后续分镜的项目 brief。`,
    `整体风格应保持${getStylePositioning(styleTemplate)}，避免空泛概念、堆词和脱离真实素材的表达。`,
    sourceExcerpt ? `当前已收集的原始输入可作为第一手素材继续细化：${sourceExcerpt}${sourceExcerpt.length >= 120 ? "…" : ""}` : "",
  ].filter(Boolean).join("\n\n");
}

export function buildGeneratedCoreIdea(params: {
  topicQuery?: string | null;
  workspaceMode?: WorkspaceMode;
}) {
  const topic = normalizeProjectTopic(params.topicQuery ?? "", params.workspaceMode);
  return params.workspaceMode === "SHORT_VIDEO"
    ? `把「${topic}」讲成一条用户愿意看完、能快速获得判断的科技快讯。`
    : `把「${topic}」整理成一个可直接进入传播执行的清晰表达角度。`;
}

export function buildGeneratedStyleReferenceSample(params: {
  workspaceMode?: WorkspaceMode;
  styleTemplate?: StyleTemplate;
  brandName?: string | null;
}) {
  const brandName = compact(params.brandName) || (params.workspaceMode === "SHORT_VIDEO" ? "火星公民" : "品牌");
  const styleTemplate = params.styleTemplate ?? "RATIONAL_PRO";

  if (params.workspaceMode === "SHORT_VIDEO") {
    return [
      `今天这条，不是把 ${brandName} 相关信息再复述一遍，而是先抓住一个真正值得关心的变化。`,
      "我们先讲这件事到底发生了什么，再讲它为什么重要，最后再判断它会把接下来的技术竞速推向哪里。",
      "整条表达尽量短、准、清楚，不靠夸张口号撑节奏，而靠信息增量和判断力把人留下来。",
    ].join("\n\n");
  }

  if (styleTemplate === "HIGH_CONVERSION") {
    return [
      `${brandName} 这次要讲清楚的，不只是“我们是什么”，而是用户为什么现在就应该继续看下去。`,
      "先把最关键的问题和结果抛出来，再用具体事实、体验或对比把理由撑住，最后给一个明确动作。",
      "语气直接，但不要浮夸；重点是让人看完之后知道价值、相信价值、并愿意继续下一步。",
    ].join("\n\n");
  }

  return [
    `这次内容不急着喊结论，而是先把 ${brandName} 想表达的重点讲清楚。`,
    "好的表达应该先给读者一个容易进入的观察角度，再逐步展开事实、细节和判断，而不是一开始就堆满口号。",
    "整体语气保持克制、专业、清楚，让内容看起来像经过思考，而不是模板式宣传稿。",
  ].join("\n\n");
}
