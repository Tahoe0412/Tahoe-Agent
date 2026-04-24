import { z } from "zod";
import type { StyleReferenceInsight } from "@/lib/style-reference";

export type AudienceReviewerId =
  | "feed_scanner"
  | "skeptical_reader"
  | "editor"
  | "sharer";

export type AudienceReviewer = {
  id: AudienceReviewerId;
  label: string;
  persona: string;
  score: number;
  likes: string[];
  concerns: string[];
  nextAction: string;
  verdict: string;
};

export type AudiencePanelReview = {
  averageScore: number;
  styleFitScore: number;
  publishReadiness: "READY" | "REVISION_FIRST";
  calibrationSummary: string;
  overallVerdict: string;
  reviewers: AudienceReviewer[];
};

export function normalizeAudiencePanelReview(value: unknown): AudiencePanelReview | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const reviewers = Array.isArray(source.reviewers)
    ? source.reviewers
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const review = item as Record<string, unknown>;
          const id = normalizeReviewerId(review.id);
          if (!id) {
            return null;
          }

          return {
            id,
            label: typeof review.label === "string" ? review.label.trim() : "",
            persona: typeof review.persona === "string" ? review.persona.trim() : "",
            score: clampScore(review.score),
            likes: normalizeStringList(review.likes),
            concerns: normalizeStringList(review.concerns),
            nextAction: typeof review.nextAction === "string" ? review.nextAction.trim() : "",
            verdict: typeof review.verdict === "string" ? review.verdict.trim() : "",
          } satisfies AudienceReviewer;
        })
        .filter(Boolean) as AudienceReviewer[]
    : [];

  return {
    averageScore: clampScore(source.averageScore),
    styleFitScore: clampScore(source.styleFitScore),
    publishReadiness: source.publishReadiness === "READY" ? "READY" : "REVISION_FIRST",
    calibrationSummary: typeof source.calibrationSummary === "string" ? source.calibrationSummary.trim() : "",
    overallVerdict: typeof source.overallVerdict === "string" ? source.overallVerdict.trim() : "",
    reviewers,
  };
}

export function getChineseMediaCalibrationNotes(params?: {
  styleReferenceInsight?: StyleReferenceInsight | null;
  target?: "MASTER_COPY" | "PACKAGING";
}) {
  const styleInsight = params?.styleReferenceInsight;
  const baseNotes = [
    "开头先给判断、场景或信息增量，不要一上来就空喊价值。",
    "每一段只推进一个关键信息单元，让读者能快速复述核心观点。",
    "多写事实、动作、对比、结果和观察，少写抽象口号与咨询腔总结。",
    "正文里尽量留下 1-2 句可被截图、引用或转述的句子。",
    "收尾要么收束判断，要么给明确动作，不要在结尾泄气。",
  ];

  if (params?.target === "MASTER_COPY") {
    baseNotes.splice(
      1,
      0,
      "头条号图文主稿不能像短摘要。除非任务明确要求短版，否则要展开成有起承转合的长文：钩子、事实、解释、判断、影响、收束都要完整。",
      "判断句要服务理解，不要只给情绪；好的判断通常写成“真正重要的不是 X，而是 Y”。",
    );
  }

  if (params?.target === "PACKAGING") {
    baseNotes.splice(
      1,
      2,
      "第一眼先让人知道为什么值得点开、收藏或转发，不要把标题和导语写成普通摘要。",
      "导语和亮点要有信息密度，尽量给到事实、结果、反差或判断，不要重复主题词。",
    );
  }

  if (!styleInsight) {
    return baseNotes;
  }

  return [
    ...baseNotes,
    `当前参考样稿的标题偏好：${(styleInsight.titleStyleLines ?? []).slice(0, 2).join(" ") || "标题要具体、克制、有信息增量。"}`,
    `当前参考样稿的开头偏好：${(styleInsight.openingStyleLines ?? []).slice(0, 2).join(" ") || "开头先建场景和判断，不要先做品牌自夸。"}`,
    `当前参考样稿的正文节奏：${(styleInsight.bodyRhythmLines ?? []).slice(0, 2).join(" ") || "正文长短句交替，靠具体细节推进。 "}`,
  ];
}

export function buildAudiencePanelPrompt(params: {
  topic: string;
  draftTypeLabel: string;
  title?: string | null;
  heroCopy?: string | null;
  bodyCopy: string;
  proofPoints?: string[];
  callToAction?: string | null;
  styleReferenceInsight?: StyleReferenceInsight | null;
}) {
  const calibrationNotes = getChineseMediaCalibrationNotes({
    styleReferenceInsight: params.styleReferenceInsight,
    target: params.draftTypeLabel === "发布包装" ? "PACKAGING" : "MASTER_COPY",
  });

  return {
    systemPrompt: [
      "你是一组中文内容评审子代理的协调者。",
      "你的任务不是重写文案，而是模拟 4 位不同性格的真实观众，对文案做打分和判断。",
      "评审标准要向中文头部高质量内容靠拢：信息增量、判断力、证据感、节奏、可复述性、可转发性。",
      "把“证明点”视为编辑台已经收集好的 source packet。你的职责是评估文案是否忠实使用这些 source packet，而不是对 source packet 本身做外部事实核验。",
      "你只能基于题目、正文、证明点和提供的素材包做评审，不要调用外部世界知识去否定一条刚发布的新消息。",
      "如果证明点已经给出明确来源、标题或发布时间，你要评估文案是否准确使用这些来源，而不是擅自断言事件不存在、来源是伪造或新闻是编造。",
      "当证明点不足时，指出“证据链不够完整”“还缺关键事实”或“主张超出了已给素材”，不要编造额外事实、额外检索结果或额外 benchmark。",
      "如果 source packet 已经提供来源名、标题、相对时间或摘要，这些都算有效证据锚点；不要因为缺少 URL、原文全文、精确百分比或论文名就直接判定稿件失真。",
      "评审重点是：稿件有没有超出 source packet 的边界、有没有把 source packet 里的变化点说清楚、有没有让普通读者读懂为什么重要。",
      "如果 source packet 只给出定性变化（例如更高效、更会编程、更低成本、已向付费用户开放），你可以提醒稿件补‘用户可感知例子’，但不要强行要求不存在于 source packet 的百分比、benchmark 名称或 API 指标。",
      "只有当稿件主动写出 source packet 中没有出现的具体数字、型号、对比基线或产品命名时，才把它视为证据越界。",
      "输出必须是合法 JSON。",
    ].join(" "),
    userPrompt: [
      `评审对象：${params.draftTypeLabel}`,
      `传播主题：${params.topic}`,
      params.title?.trim() ? `标题：${params.title.trim()}` : "",
      params.heroCopy?.trim() ? `开头：${params.heroCopy.trim()}` : "",
      `正文：\n${params.bodyCopy.trim()}`,
      params.proofPoints?.length ? `证明点：\n${params.proofPoints.map((item) => `- ${item}`).join("\n")}` : "",
      params.callToAction?.trim() ? `CTA：${params.callToAction.trim()}` : "",
      "",
      "中文高质量内容校准：",
      ...calibrationNotes.map((item) => `- ${item}`),
      "",
      "请用 4 位观众评分：",
      "- feed_scanner：刷信息流很快的人，只看第一屏值不值得停下。",
      "- skeptical_reader：天然怀疑的人，只相信具体事实、证据和逻辑。",
      "- editor：挑剔编辑，只看结构、语言、重复度和表达完成度。",
      "- sharer：愿意转发给朋友的人，只在有洞察、记忆点或情绪价值时才会分享。",
      "",
      "输出要求：",
      "- averageScore：4 位评分平均分（0-100）",
      "- styleFitScore：与高质量中文媒体写法的贴合度（0-100）",
      "- publishReadiness：READY 或 REVISION_FIRST",
      "- calibrationSummary：一句话总结这篇稿件与高质量中文媒体写法的距离",
      "- overallVerdict：一句话说明这篇稿件当前最核心的判断",
      "- reviewers：固定输出 4 位，每位包含 id、label、persona、score、likes、concerns、nextAction、verdict",
      "- likes / concerns 各写 1-3 条，必须具体，不要写空话。",
    ].filter(Boolean).join("\n"),
  };
}

export const audiencePanelReviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["averageScore", "styleFitScore", "publishReadiness", "calibrationSummary", "overallVerdict", "reviewers"],
  properties: {
    averageScore: { type: "number" },
    styleFitScore: { type: "number" },
    publishReadiness: { type: "string", enum: ["READY", "REVISION_FIRST"] },
    calibrationSummary: { type: "string" },
    overallVerdict: { type: "string" },
    reviewers: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "persona", "score", "likes", "concerns", "nextAction", "verdict"],
        properties: {
          id: { type: "string", enum: ["feed_scanner", "skeptical_reader", "editor", "sharer"] },
          label: { type: "string" },
          persona: { type: "string" },
          score: { type: "number" },
          likes: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          concerns: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          nextAction: { type: "string" },
          verdict: { type: "string" },
        },
      },
    },
  },
} as const;

export const audienceReviewerSchema = z.object({
  id: z.enum(["feed_scanner", "skeptical_reader", "editor", "sharer"]),
  label: z.string().min(2).max(80),
  persona: z.string().min(6).max(200),
  score: z.number().min(0).max(100),
  likes: z.array(z.string().min(4).max(200)).min(1).max(3),
  concerns: z.array(z.string().min(4).max(200)).min(1).max(3),
  nextAction: z.string().min(4).max(200),
  verdict: z.string().min(4).max(200),
});

export const audiencePanelReviewSchema = z.object({
  averageScore: z.number().min(0).max(100),
  styleFitScore: z.number().min(0).max(100),
  publishReadiness: z.enum(["READY", "REVISION_FIRST"]),
  calibrationSummary: z.string().min(8).max(260),
  overallVerdict: z.string().min(8).max(260),
  reviewers: z.array(audienceReviewerSchema).length(4),
});

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeReviewerId(value: unknown): AudienceReviewerId | null {
  return value === "feed_scanner" || value === "skeptical_reader" || value === "editor" || value === "sharer"
    ? value
    : null;
}

function clampScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
}
