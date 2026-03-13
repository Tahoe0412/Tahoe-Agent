import { generateStructuredJson } from "@/lib/openai-json";
import type { ModelRouteKey, ModelRouteConfig } from "@/lib/model-routing";
import { canUseModelRoute } from "@/lib/model-routing";
import type { LlmProvider } from "@prisma/client";

export type StyleReferenceInsight = {
  paragraphCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  rhythmLabel: string;
  toneLabels: string[];
  structureLabels: string[];
  titleStyleLines: string[];
  openingStyleLines: string[];
  bodyRhythmLines: string[];
  summaryLines: string[];
};

/** Normalize a StyleReferenceInsight so every array field is guaranteed to be a proper array.
 *  Call this once at the data boundary (workspace-query) instead of scattering ?? [] across UI. */
export function normalizeStyleReferenceInsight(
  input: StyleReferenceInsight | null | undefined,
): StyleReferenceInsight | null {
  if (!input) return null;
  return {
    paragraphCount: input.paragraphCount ?? 0,
    sentenceCount: input.sentenceCount ?? 0,
    averageSentenceLength: input.averageSentenceLength ?? 0,
    rhythmLabel: input.rhythmLabel ?? "",
    toneLabels: Array.isArray(input.toneLabels) ? input.toneLabels : [],
    structureLabels: Array.isArray(input.structureLabels) ? input.structureLabels : [],
    titleStyleLines: Array.isArray(input.titleStyleLines) ? input.titleStyleLines : [],
    openingStyleLines: Array.isArray(input.openingStyleLines) ? input.openingStyleLines : [],
    bodyRhythmLines: Array.isArray(input.bodyRhythmLines) ? input.bodyRhythmLines : [],
    summaryLines: Array.isArray(input.summaryLines) ? input.summaryLines : [],
  };
}

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitSentences(text: string) {
  return text
    .split(/[。！？!?；;\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function takeFirstSentence(text: string) {
  return splitSentences(text)[0] ?? "";
}

export function analyzeStyleReferenceSampleRuleBased(text: string | null | undefined): StyleReferenceInsight | null {
  const source = (text ?? "").trim();
  if (!source) {
    return null;
  }

  const paragraphs = splitParagraphs(source);
  const sentences = splitSentences(source);
  const averageSentenceLength =
    sentences.length > 0
      ? Math.round(sentences.reduce((sum, item) => sum + item.replace(/\s+/g, "").length, 0) / sentences.length)
      : 0;

  const rhythmLabel =
    averageSentenceLength <= 18
      ? "短句偏多，节奏快"
      : averageSentenceLength <= 32
        ? "长短句均衡，节奏稳定"
        : "长句偏多，解释展开感强";

  const toneLabels = [
    /(必须|立刻|马上|就是|一定|核心|关键|结果|转化)/.test(source) ? "推进感强" : null,
    /(陪伴|治愈|安心|温柔|松弛|感受|生活)/.test(source) ? "情绪感明显" : null,
    /(为什么|如何|到底|是不是|能不能|？|\?)/.test(source) ? "善用提问开场" : null,
    /(我们|我|作为|一路|亲自)/.test(source) ? "有人称视角" : null,
    /(数据|研究|验证|方法|结构|逻辑|专业)/.test(source) ? "理性解释偏强" : null,
    /(高级|质感|审美|轻盈|克制|体验)/.test(source) ? "审美表达偏强" : null,
  ].filter(Boolean) as string[];

  const structureLabels = [
    /(第一|第二|第三|1\.|2\.|3\.)/.test(source) ? "有明显分点结构" : null,
    /(因为|所以|不是|而是|先|再|最后)/.test(source) ? "偏因果推进" : null,
    paragraphs.length >= 3 ? "段落层次清楚" : null,
    /CTA|行动|现在|点击|私信|留言|收藏|转发/.test(source) ? "结尾有行动引导" : null,
  ].filter(Boolean) as string[];

  const firstParagraph = paragraphs[0] ?? "";
  const firstSentence = takeFirstSentence(source);
  const titleStyleLines = [
    /[，、：]/.test(firstSentence) ? "标题适合使用带停顿的观察式短句，不要直接喊卖点。" : "标题适合保持简洁克制，少用营销口号。",
    /(城市|自然|山林|空间|材料|光线|秩序|路径)/.test(firstSentence)
      ? "标题可优先借城市、自然、空间或材料意象切入。"
      : "标题不要先讲功能，优先建立场域和感受。",
    /(为什么|如何|到底|是不是|\?)/.test(firstSentence)
      ? "标题更适合用含蓄提问，而不是直接促销。"
      : "标题更适合陈述式观察，不要像硬广标题。",
  ];
  const openingStyleLines = [
    /(城市|街道|山林|庭院|自然|空间|门店|光线|材料)/.test(firstParagraph)
      ? "开头先写城市、空间、自然或材料观察，再慢慢引出品牌。"
      : "开头避免先讲产品卖点，先建立生活场景和观察。",
    /(我们|品牌|产品)/.test(firstSentence)
      ? "开头不要急着自我介绍，先让读者进入画面和气氛。"
      : "开头适合先给画面，再给品牌信息。",
    averageSentenceLength >= 24
      ? "开头可以用稍长句推进，但要保持节奏克制，不要像说明书。"
      : "开头句长适合长短交替，避免连续短促口号。",
  ];
  const bodyRhythmLines = [
    paragraphs.length >= 4
      ? `正文适合按\u201c观察场域 -> 材料细节 -> 空间/理念 -> 收束落点\u201d慢慢推进。`
      : "正文适合分成 3 到 4 层推进，不要一段里把所有价值说完。",
    averageSentenceLength >= 28
      ? "正文节奏偏长句展开，适合解释材料、工艺、路径和细微变化。"
      : "正文节奏适合长短句交替，用短句收束重点、长句铺陈细节。",
    /(树枝|石材|树脂|地板|柱|墙面|天花板|瓦片|种子|枝桠)/.test(source)
      ? "正文要多写具体物件、材质、结构和触感，少写抽象理念。"
      : "正文要增加具体物件、动作和感官细节，减少抽象价值词。",
  ];

  const summaryLines = [
    `样稿共 ${paragraphs.length} 段、约 ${sentences.length} 句，整体属于\u201c${rhythmLabel}\u201d。`,
    `语气特征：${(toneLabels.length > 0 ? toneLabels : ["表达克制"]).join("、")}。`,
    `结构特征：${(structureLabels.length > 0 ? structureLabels : ["自然铺陈"]).join("、")}。`,
    `标题风格：${titleStyleLines[0]}`,
    `开头风格：${openingStyleLines[0]}`,
    `正文节奏：${bodyRhythmLines[0]}`,
  ];

  return {
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    averageSentenceLength: clamp(averageSentenceLength, 0, 999),
    rhythmLabel,
    toneLabels: toneLabels.length > 0 ? toneLabels : ["表达克制"],
    structureLabels: structureLabels.length > 0 ? structureLabels : ["自然铺陈"],
    titleStyleLines,
    openingStyleLines,
    bodyRhythmLines,
    summaryLines,
  };
}

/** Backward-compatible sync alias for code paths that cannot await. */
export const analyzeStyleReferenceSample = analyzeStyleReferenceSampleRuleBased;

/* ───── LLM-based style analysis ───── */

import { z } from "zod";

const styleInsightZodSchema = z.object({
  paragraphCount: z.number(),
  sentenceCount: z.number(),
  averageSentenceLength: z.number(),
  rhythmLabel: z.string(),
  toneLabels: z.array(z.string()).min(1).max(6),
  structureLabels: z.array(z.string()).min(1).max(6),
  titleStyleLines: z.array(z.string()).min(1).max(4),
  openingStyleLines: z.array(z.string()).min(1).max(4),
  bodyRhythmLines: z.array(z.string()).min(1).max(4),
  summaryLines: z.array(z.string()).min(1).max(6),
});

const styleInsightJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "paragraphCount",
    "sentenceCount",
    "averageSentenceLength",
    "rhythmLabel",
    "toneLabels",
    "structureLabels",
    "titleStyleLines",
    "openingStyleLines",
    "bodyRhythmLines",
    "summaryLines",
  ],
  properties: {
    paragraphCount: { type: "number" },
    sentenceCount: { type: "number" },
    averageSentenceLength: { type: "number" },
    rhythmLabel: { type: "string" },
    toneLabels: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    structureLabels: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    titleStyleLines: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
    openingStyleLines: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
    bodyRhythmLines: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
    summaryLines: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
  },
} as const;

const styleInsightCache = new Map<string, StyleReferenceInsight>();

function cacheKey(text: string) {
  return text.slice(0, 200);
}

export async function analyzeStyleWithLLM(
  text: string | null | undefined,
  settings: {
    llmMockMode: boolean;
    llmProvider: LlmProvider;
    llmRouting: Record<ModelRouteKey, ModelRouteConfig>;
    openaiApiKey?: string | null;
    geminiApiKey?: string | null;
    deepseekApiKey?: string | null;
    qwenApiKey?: string | null;
  },
): Promise<StyleReferenceInsight | null> {
  const source = (text ?? "").trim();
  if (!source) {
    return null;
  }

  const key = cacheKey(source);
  const cached = styleInsightCache.get(key);
  if (cached) {
    return cached;
  }

  if (!canUseModelRoute("MARKETING_ANALYSIS", settings)) {
    return analyzeStyleReferenceSampleRuleBased(source);
  }

  try {
    const result = await generateStructuredJson<StyleReferenceInsight>({
      routeKey: "MARKETING_ANALYSIS",
      schemaName: "style_reference_insight",
      schema: styleInsightJsonSchema,
      zodSchema: styleInsightZodSchema,
      temperature: 0.15,
      systemPrompt: [
        "你是一名资深品牌文案风格分析师。",
        "你的任务是拆解一篇参考样稿的写作风格，生成一份结构化的风格学习指南。",
        "分析必须具体到标题怎么写、开头用什么策略、正文的段落节奏如何推进。",
        "不要泛泛而谈，每条都要能直接指导写作。",
        "输出必须是合法 JSON。",
      ].join(" "),
      userPrompt: [
        "请分析下面这篇参考样稿的写作风格，输出结构化的风格学习指南。",
        "",
        "分析维度：",
        "- paragraphCount：样稿段落数",
        "- sentenceCount：样稿句子数",
        "- averageSentenceLength：平均句长（字符数）",
        '- rhythmLabel：一句话描述整体节奏感（如「长短交替、观察式推进」）',
        '- toneLabels：2-4 个语气特征标签（如「克制冷静」「观察式」「有人称温度」）',
        '- structureLabels：2-4 个结构特征标签（如「因果推进」「分层叙事」「结尾有行动引导」）',
        '- titleStyleLines：2-3 条标题写法指令（学习这篇样稿的标题该怎么起）',
        '- openingStyleLines：2-3 条开头策略指令（学习这篇样稿的开头该怎么写）',
        '- bodyRhythmLines：2-3 条正文节奏指令（学习这篇样稿的段落怎么推进）',
        '- summaryLines：3-5 条整体风格摘要',
        '',
        '每条指令都要具体到「该做什么、不要做什么」，不要写成文学评论。',
        "",
        "参考样稿全文：",
        source,
      ].join("\n"),
    });

    styleInsightCache.set(key, result);
    if (styleInsightCache.size > 50) {
      const firstKey = styleInsightCache.keys().next().value;
      if (firstKey !== undefined) {
        styleInsightCache.delete(firstKey);
      }
    }
    return result;
  } catch {
    return analyzeStyleReferenceSampleRuleBased(source);
  }
}

export function formatStyleReferenceInsight(insight: StyleReferenceInsight | null) {
  if (!insight) return "N/A";
  return [
    `- 标题风格学习：${(insight.titleStyleLines ?? []).join(" ")}`,
    `- 开头风格学习：${(insight.openingStyleLines ?? []).join(" ")}`,
    `- 正文节奏学习：${(insight.bodyRhythmLines ?? []).join(" ")}`,
    `- 节奏特征：${insight.rhythmLabel ?? ""}`,
    `- 语气特征：${(insight.toneLabels ?? []).join("、")}`,
    `- 结构特征：${(insight.structureLabels ?? []).join("、")}`,
    `- 样稿规模：${insight.paragraphCount ?? 0} 段 / ${insight.sentenceCount ?? 0} 句`,
  ].join("\n");
}
