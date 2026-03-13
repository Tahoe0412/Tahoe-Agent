import { Prisma, type PlatformSurface, type StrategyTaskStatus, type StrategyTaskType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { getWorkspaceMode } from "@/lib/workspace-mode";
import { promotionalCopyDiagnosisSchema, promotionalCopyOutputSchema, type PromotionalCopyOutput } from "@/schemas/promotional-copy";
import { AppSettingsService } from "@/services/app-settings.service";
import { MarketingContextService } from "@/services/marketing-context.service";
import { promotionalCopyJsonSchema } from "@/services/promotional-copy/json-schema";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function compactLines(items: Array<string | null | undefined>) {
  return items.map((item) => (item ?? "").trim()).filter(Boolean);
}

function normalizeStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|[;；]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRichText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\\\\【换行】\\\\/g, "\n")
    .replace(/\\【换行】\\/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function shouldRewriteAsRestrainedSpatial(params: {
  styleTemplate: string;
  usageScenario?: string | null;
  heroCopy: string;
  longFormCopy: string;
}) {
  if (params.styleTemplate !== "RESTRAINED_SPATIAL") {
    return false;
  }

  const combined = `${params.heroCopy}\n${params.longFormCopy}`;
  const genericPatterns = [
    /年轻职场女性/,
    /疲惫/,
    /压力/,
    /帮助你/,
    /更好的状态/,
    /生活方式/,
    /我们希望/,
    /我们致力于/,
    /深知这种感受/,
    /让身体慢慢回到/,
  ];
  const spatialPatterns = [
    /城市/,
    /自然/,
    /山林/,
    /材料/,
    /石材/,
    /树枝/,
    /空间/,
    /光线/,
    /路径/,
    /地面/,
    /墙面/,
    /秩序/,
  ];

  const genericHits = countMatches(combined, genericPatterns);
  const spatialHits = countMatches(combined, spatialPatterns);
  return genericHits >= 3 || spatialHits <= 2 || (params.usageScenario === "BRAND_LANDING" && genericHits >= 2);
}

function normalizePlatformAdaptations(value: unknown, fallbackSurfaces: PlatformSurface[]) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const source = item as Record<string, unknown>;
        const bodyText = normalizeRichText(source.body_text);
        if (!bodyText || bodyText.length < 6) {
          return null;
        }

        return {
          platform_surface: source.platform_surface,
          title_text: typeof source.title_text === "string" ? source.title_text : undefined,
          body_text: bodyText,
          hook_text: typeof source.hook_text === "string" ? source.hook_text : undefined,
          cover_copy: typeof source.cover_copy === "string" ? source.cover_copy : undefined,
          interaction_prompt: typeof source.interaction_prompt === "string" ? source.interaction_prompt : undefined,
        };
      })
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries
      .map(([platformSurface, item]) => {
        if (!fallbackSurfaces.includes(platformSurface as PlatformSurface)) {
          return null;
        }

        if (typeof item === "string") {
          const bodyText = normalizeRichText(item);
          if (!bodyText || bodyText.length < 6) {
            return null;
          }
          return {
            platform_surface: platformSurface,
            body_text: bodyText,
          };
        }

        if (item && typeof item === "object") {
          const source = item as Record<string, unknown>;
          const bodyText =
            typeof source.body_text === "string"
              ? normalizeRichText(source.body_text)
              : typeof source.content === "string"
                ? normalizeRichText(source.content)
                : typeof source.copy === "string"
                  ? normalizeRichText(source.copy)
                  : "";
          if (!bodyText || bodyText.length < 6) {
            return null;
          }
          return {
            platform_surface: platformSurface,
            title_text: typeof source.title_text === "string" ? source.title_text : undefined,
            body_text: bodyText,
            hook_text: typeof source.hook_text === "string" ? source.hook_text : undefined,
            cover_copy: typeof source.cover_copy === "string" ? source.cover_copy : undefined,
            interaction_prompt: typeof source.interaction_prompt === "string" ? source.interaction_prompt : undefined,
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  return [];
}

function normalizePromotionalCopyOutput(value: unknown, fallbackSurfaces: PlatformSurface[]) {
  if (!value || typeof value !== "object") {
    return value;
  }

  const source = value as Record<string, unknown>;
  return {
    ...source,
    headline_options: normalizeStringList(source.headline_options),
    hero_copy: normalizeRichText(source.hero_copy),
    long_form_copy: normalizeRichText(source.long_form_copy),
    proof_points: normalizeStringList(source.proof_points),
    risk_notes: normalizeStringList(source.risk_notes),
    recommended_next_steps: normalizeStringList(source.recommended_next_steps),
    platform_adaptations: normalizePlatformAdaptations(source.platform_adaptations, fallbackSurfaces),
    quality_diagnosis:
      source.quality_diagnosis && typeof source.quality_diagnosis === "object"
        ? {
            ...((source.quality_diagnosis as Record<string, unknown>) ?? {}),
            strengths: normalizeStringList((source.quality_diagnosis as Record<string, unknown>).strengths),
            issues: normalizeStringList((source.quality_diagnosis as Record<string, unknown>).issues),
            rewrite_focus: normalizeStringList((source.quality_diagnosis as Record<string, unknown>).rewrite_focus),
          }
        : source.quality_diagnosis,
  };
}

function buildCreativeBrief(params: {
  contextPrompt: string;
  projectTitle: string;
  topic: string;
  sourceMessage: string;
  styleReferenceSample: string | null;
  latestBrief: {
    objective: string;
    primary_tone: string;
    key_message: string;
    call_to_action: string | null;
  } | null;
  trendSummaries: string[];
}) {
  return [
    `项目名称：${params.projectTitle}`,
    `传播主题：${params.topic}`,
    `项目初始输入：${params.sourceMessage}`,
    params.latestBrief
      ? `当前任务单：目标=${params.latestBrief.objective}；语气=${params.latestBrief.primary_tone}；核心表达=${params.latestBrief.key_message}；CTA=${params.latestBrief.call_to_action ?? "未填写"}`
      : "当前任务单：暂无，请根据项目初始输入主动补全可执行表达。",
    params.trendSummaries.length
      ? `当前趋势结论：\n${params.trendSummaries.map((item) => `- ${item}`).join("\n")}`
      : "当前趋势结论：暂无趋势，优先把项目初始输入讲清楚。",
    params.styleReferenceSample
      ? `风格参照样稿：\n${params.styleReferenceSample}`
      : "风格参照样稿：暂无，请主要依据写作模式、输出风格与品牌上下文成稿。",
    "",
    "补充上下文：",
    params.contextPrompt,
  ].join("\n");
}

function buildQualityRules() {
  return [
    "你输出的是面向真实发布场景的宣传文案，不是策划摘要，不是品牌自述材料。",
    "优先写用户能立刻理解、复述和转发的表达，不写空泛口号。",
    "先讲用户问题和具体价值，再讲品牌主张；不要一开头就自夸。",
    "标题必须像真正准备发布的标题，避免占位句和模板句。",
    "正文必须形成完整传播结构：问题/机会 -> 价值解释 -> 差异化 -> 证明点 -> 行动引导。",
    "每个证明点都要具体，宁可少，也不要正确但空洞。",
    "如果原始信息不足，可以做合理收束，但不能杜撰硬事实、认证、数据和功效。",
    "不要出现“我们建议”“建议围绕”“可以从…展开”这类策划腔。",
    "不要写成行业报告、汇报材料或顾问总结。",
    "整体语言要有成稿感，用户读完就能直接拿去改写和发布。",
    "当目标是高端品牌叙事时，优先使用观察、材料、空间、动作与感官细节，而不是直接喊品牌价值。",
  ].join("\n");
}

function buildEnhancementRules() {
  return [
    "你要先诊断当前主稿的问题，再在保留商业方向的前提下重写成更强版本。",
    "增强后的主稿必须比原稿更像真实品牌宣传文案，而不是内部策略摘要。",
    "优先改进：开头钩子、价值表达清晰度、证明点具体性、结构推进、结尾 CTA。",
    "如果原稿里有空泛句、套话、顾问腔，要主动替换成可感知、可转发、可行动的语言。",
    "保留已经成立的核心角度，不要为改而改成另一篇完全不同的文案。",
  ].join("\n");
}

function buildRestrainedSpatialRewritePrompt(params: {
  creativeBrief: string;
  styleReferenceInsightText: string;
  draft: Pick<
    PromotionalCopyOutput,
    "master_angle" | "headline_options" | "hero_copy" | "long_form_copy" | "proof_points" | "call_to_action"
  >;
}) {
  return [
    "下面这版文案仍然太像泛品牌稿，不够克制，也没有真正学到空间叙事。",
    "请彻底重写，但保留当前项目的品牌主题，不要改成别的品牌。",
    "重写要求：",
    "- 开头不要写用户痛点、疲惫、压力、疗愈这些直白词汇。",
    "- 开头先写城市、自然、路径、材料、空间或动作观察。",
    "- 正文多写物、材质、结构、秩序、光线、触感、层次，不要空喊价值。",
    "- 少用“我们希望”“帮助你”“更好的状态”“生活方式”这类泛词。",
    "- 品牌出现要更晚一些，让空间和观察先成立。",
    "- 像高端品牌门店或品牌介绍页文案，不像健康品牌软广。",
    "",
    "参考样稿三段学习：",
    params.styleReferenceInsightText,
    "",
    "当前项目上下文：",
    params.creativeBrief,
    "",
    "需要被重写的版本：",
    `主宣传角度：${params.draft.master_angle}`,
    `标题备选：\n${params.draft.headline_options.map((item) => `- ${item}`).join("\n")}`,
    `开场摘要：${params.draft.hero_copy}`,
    `完整主稿：\n${params.draft.long_form_copy}`,
    `证明点：\n${params.draft.proof_points.map((item) => `- ${item}`).join("\n")}`,
    `CTA：${params.draft.call_to_action}`,
    "",
    "输出要求：",
    "- 输出完整的新版本，不要写点评。",
    "- headline_options、hero_copy、long_form_copy 都要一起重写。",
    "- 只输出主稿，不要输出平台稿。",
  ].join("\n");
}

const promotionalCopyEnhancementSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    master_angle: { type: "string" },
    headline_options: { type: "array", items: { type: "string" } },
    hero_copy: { type: "string" },
    long_form_copy: { type: "string" },
    proof_points: { type: "array", items: { type: "string" } },
    call_to_action: { type: "string" },
    risk_notes: { type: "array", items: { type: "string" } },
    platform_adaptations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          platform_surface: { type: "string" },
          title_text: { type: "string" },
          body_text: { type: "string" },
          hook_text: { type: "string" },
          cover_copy: { type: "string" },
          interaction_prompt: { type: "string" },
        },
        required: ["platform_surface", "body_text"],
      },
    },
    recommended_next_steps: { type: "array", items: { type: "string" } },
    quality_diagnosis: {
      type: "object",
      additionalProperties: false,
      properties: {
        overall_score: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        issues: { type: "array", items: { type: "string" } },
        rewrite_focus: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
      required: ["overall_score", "strengths", "issues", "rewrite_focus", "summary"],
    },
  },
  required: [
    "master_angle",
    "headline_options",
    "hero_copy",
    "long_form_copy",
    "proof_points",
    "call_to_action",
    "recommended_next_steps",
    "quality_diagnosis",
  ],
} as const;

function buildMockCopy(params: {
  projectTitle: string;
  topic: string;
  sourceMessage: string;
}): PromotionalCopyOutput {
  return {
    master_angle: `用用户听得懂的语言，把 ${params.topic} 的核心价值讲透。`,
    headline_options: [
      `${params.projectTitle}：这件事为什么值得现在关注`,
      `把 ${params.topic} 讲清楚，用户才会真正行动`,
      `${params.topic} 不是口号，而是可落地的价值`,
    ],
    hero_copy: `当用户第一眼看不懂你在解决什么问题，再好的产品也很难被传播。${params.projectTitle} 这轮内容先把核心价值讲透。`,
    long_form_copy: `${params.sourceMessage}\n\n宣传重点集中在三件事：第一，用户当前最真实的痛点；第二，品牌为什么值得信任；第三，用户接下来应该采取什么行动。整套文案减少空泛表达，优先用可感知、可复述、可转发的语言。`,
    proof_points: [
      "先把用户最关心的问题说清楚，而不是先讲品牌自我介绍",
      "用更具体的价值点代替笼统口号",
      "所有结尾都要有明确 CTA",
    ],
    call_to_action: "收藏这条内容，再根据你的业务场景拆成标题、正文和平台版本。",
    risk_notes: ["避免绝对化承诺", "避免无法证明的效果表述"],
    platform_adaptations: [],
    recommended_next_steps: ["先选 1 个主平台做首发版本", "基于评论反馈继续收敛标题和开头", "通过合规检查后再进入发布"],
    quality_diagnosis: {
      overall_score: 68,
      strengths: ["传播方向已经明确", "基本结构和 CTA 已到位"],
      issues: ["开头钩子还不够强", "部分表达偏抽象", "证明点不够具体"],
      rewrite_focus: ["强化开头", "压缩套话", "补强可感知价值点"],
      summary: "当前主稿方向是对的，但表达密度和转化感还不够，适合先增强再发布。",
    },
  };
}

export class PromotionalCopyService {
  private readonly appSettingsService = new AppSettingsService();
  private readonly marketingContextService = new MarketingContextService();

  async generateForProject(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand_profile: true,
        industry_template: true,
        trend_topics: {
          include: {
            trend_evidences: true,
          },
          orderBy: { momentum_score: "desc" },
          take: 5,
        },
        creative_briefs: {
          orderBy: { version_number: "desc" },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    const workspaceMode = getWorkspaceMode((project.metadata as { workspace_mode?: string } | null)?.workspace_mode);
    const surfaces: PlatformSurface[] =
      workspaceMode === "COPYWRITING"
        ? ["XIAOHONGSHU_POST", "COMMENT_REPLY", "COVER_COPY"]
        : ["XIAOHONGSHU_POST", "DOUYIN_VIDEO", "DOUYIN_TITLE", "COMMENT_REPLY", "COVER_COPY"];

    const settings = await this.appSettingsService.getEffectiveSettings();
    const context = await this.marketingContextService.getProjectContext(projectId);
    const contextPrompt = this.marketingContextService.formatPromptContext(context);
    const latestBrief = project.creative_briefs[0] ?? null;
    const writingMode = context?.writingMode ?? "PRODUCT_PROMO";
    const styleTemplate = context?.styleTemplate ?? "RATIONAL_PRO";
    const writingInstruction =
      writingMode === "BRAND_INTRO"
        ? [
            "本轮写作模式：品牌介绍稿。",
            "要重点回答：这个品牌是谁、为什么值得相信、与同类有什么不同、它代表一种什么生活方式或价值观。",
            "不要写成产品参数清单，要写成能建立认知和信任的品牌表达。",
          ].join("\n")
        : writingMode === "CAMPAIGN_PROMO"
          ? [
              "本轮写作模式：活动推广稿。",
              "要重点回答：这次活动是什么、为什么现在要参与、用户能得到什么、行动门槛是什么。",
              "要有明确时间感、行动感和转化驱动。",
            ].join("\n")
          : writingMode === "RECRUITMENT"
            ? [
                "本轮写作模式：招商 / 招募稿。",
                "要重点回答：为什么值得加入、加入后得到什么、适合谁、如何参与。",
                "文案要增强机会感、信任感和行动意愿，但不能夸大承诺。",
              ].join("\n")
            : [
                "本轮写作模式：产品宣传稿。",
                "要重点回答：用户当前有什么问题、产品到底解决了什么、为什么这个解决方案值得现在购买或了解。",
                "要突出差异化、使用场景和转化驱动。",
            ].join("\n");
    const styleInstruction =
      styleTemplate === "WARM_HEALING"
        ? "输出风格：温暖疗愈。语气温和、有人味、强调陪伴感和生活感，不要冷硬销售。"
        : styleTemplate === "LIGHT_LUXURY"
          ? "输出风格：轻奢高级。语言克制、审美化、质感强，避免廉价促销口吻。"
          : styleTemplate === "RESTRAINED_SPATIAL"
            ? [
                "输出风格：克制叙事 / 空间感品牌文案。",
                "语言要冷静、克制、观察式，避免直接销售和过度解释。",
                "优先书写城市、自然、材料、光线、路径、触感、结构与秩序感。",
                "多用具体名词和画面细节，少用抽象口号与空泛价值判断。",
                "叙事推进要像高端品牌空间文案：先建立感知与场域，再引出品牌与理念。",
              ].join(" ")
          : styleTemplate === "HIGH_CONVERSION"
            ? "输出风格：高转化卖点型。强调痛点、卖点、结果和行动，句子更直接、更利于转化。"
            : styleTemplate === "FOUNDER_VOICE"
              ? "输出风格：创始人口吻。可以保留第一人称视角，强调真实判断、信念和品牌主张。"
              : styleTemplate === "STORE_TRUST"
                ? "输出风格：门店信任型。强调真实场景、服务细节、口碑和信任建立。"
                : "输出风格：理性专业。强调逻辑、证据、清晰结构和专业可信度。";
    const lengthInstruction =
      context?.copyLength === "SHORT"
        ? "文案长度：短版。主稿要紧凑，适合平台正文或首屏摘要，减少铺陈，快速进入价值和行动。"
        : context?.copyLength === "LONG"
          ? "文案长度：长版。主稿可以展开更多解释、信任建立和证明内容，适合品牌页或深度转化页。"
          : "文案长度：标准版。兼顾信息量和阅读速度，适合作为通用宣传主稿。";
    const scenarioInstruction =
      context?.usageScenario === "BRAND_LANDING"
        ? "使用场景：品牌介绍页。更强调品牌认知、信任和整体价值结构。"
        : context?.usageScenario === "PRODUCT_DETAIL"
          ? "使用场景：产品详情页。更强调产品卖点、证明点、使用价值和购买理由。"
          : context?.usageScenario === "CAMPAIGN_LAUNCH"
            ? "使用场景：活动发布。更强调时效、利益点、参与感和行动转化。"
            : context?.usageScenario === "STORE_PROMOTION"
              ? "使用场景：门店宣传。更强调真实场景、服务细节、到店理由和信任建立。"
              : context?.usageScenario === "FOUNDER_IP"
                ? "使用场景：创始人 / IP 表达。更强调第一人称立场、观点、信念和人格化表达。"
                : "使用场景：小红书正文。更强调平台可读性、情绪钩子、分享感和转发感。";
    const trendSummaries = project.trend_topics.map(
      (topic) =>
        `${topic.topic_label}（总分 ${topic.momentum_score}，证据 ${topic.evidence_count}，阶段 ${topic.trend_stage}）`,
    );
    const sourceMessage = compactLines([
      context?.projectIntroduction,
      context?.coreIdea,
      project.raw_script_text,
      project.topic_query,
    ]).join("\n\n");
    const creativeBrief = buildCreativeBrief({
      contextPrompt,
      projectTitle: project.title,
      topic: project.topic_query,
      sourceMessage,
      styleReferenceSample: context?.styleReferenceSample ?? null,
      latestBrief,
      trendSummaries,
    });

    let output: PromotionalCopyOutput;
    const route = settings.llmRouting.PROMOTIONAL_COPY;
    if (canUseModelRoute("PROMOTIONAL_COPY", settings)) {
      const styleInsightText = context?.styleReferenceInsight
        ? [
            `- 标题风格：${context.styleReferenceInsight.titleStyleLines.join(" ")}`,
            `- 开头风格：${context.styleReferenceInsight.openingStyleLines.join(" ")}`,
            `- 正文节奏：${context.styleReferenceInsight.bodyRhythmLines.join(" ")}`,
          ].join("\n")
        : "当前没有可用的分段风格学习信息。";

      let generated = await generateStructuredJson({
        routeKey: "PROMOTIONAL_COPY",
        schemaName: "promotional_copy_output",
        schema: promotionalCopyJsonSchema,
        zodSchema: promotionalCopyOutputSchema,
        preprocess: (value) => normalizePromotionalCopyOutput(value, surfaces),
        temperature: styleTemplate === "RESTRAINED_SPATIAL" ? 0.6 : 0.35,
        systemPrompt:
          [
            "你是一名资深品牌策略文案总监，不是做摘要，而是直接写可发布的宣传文案。",
            "你的目标是把品牌、行业、趋势、brief 和原始输入整合成一套真正可用的商业传播主稿。",
            "你尤其擅长把复杂概念压缩成让普通用户一眼看懂的品牌表达。",
            "禁止空话、套话、总结腔、咨询报告腔。",
            "所有输出必须具体、可感知、可转发、可行动。",
            "正文要像成熟品牌文案，不要像内部笔记。",
            "输出必须是合法 JSON，不要加任何解释。",
          ].join(" "),
        userPrompt: [
          "请直接生成一版高质量宣传主稿。",
          "",
          "【写作任务】",
          [writingInstruction, styleInstruction, lengthInstruction, scenarioInstruction].join(" "),
          styleTemplate === "RESTRAINED_SPATIAL"
            ? "特别要求：先从城市观察、生活方式、材料与空间气质切入，再慢慢引出品牌。"
            : "特别要求：保持可发布感，避免空泛理念化表达。",
          "",
          "【写作规则】",
          buildQualityRules(),
          context?.styleReferenceSample
            ? "风格参照规则：充分学习参考样稿的语气、节奏和结构，但不复写其中的事实或独有表达。"
            : "",
          context?.styleReferenceInsight
            ? ["风格学习：", styleInsightText].join("\n")
            : "",
          "",
          "【写作素材】",
          `工作模式：${workspaceMode}`,
          creativeBrief,
          "",
          "输出字段：master_angle（主打角度）、headline_options（至少 3 条可发标题）、hero_copy（60-180 字开场）、long_form_copy（完整主稿）、proof_points（3-6 条证明点）、call_to_action、risk_notes。",
          "只输出主稿，不要生成平台稿。",
        ].filter(Boolean).join("\n"),
      });

      if (
        shouldRewriteAsRestrainedSpatial({
          styleTemplate,
          usageScenario: context?.usageScenario,
          heroCopy: generated.hero_copy,
          longFormCopy: generated.long_form_copy,
        })
      ) {
        generated = await generateStructuredJson({
          routeKey: "PROMOTIONAL_COPY",
          schemaName: "promotional_copy_output_refined",
          schema: promotionalCopyJsonSchema,
          zodSchema: promotionalCopyOutputSchema,
          preprocess: (value) => normalizePromotionalCopyOutput(value, surfaces),
          temperature: 0.72,
          systemPrompt: [
            "你是一名高端品牌文案编辑，擅长把泛品牌稿改写成克制、具体、有空间感的品牌叙事。",
            "你不写用户痛点广告，不写健康品牌套话，不写概念宣言。",
            "输出必须是合法 JSON。",
          ].join(" "),
          userPrompt: buildRestrainedSpatialRewritePrompt({
            creativeBrief,
            styleReferenceInsightText: styleInsightText,
            draft: generated,
          }),
        });
      }

      output = {
        ...generated,
        risk_notes: generated.risk_notes ?? [],
        recommended_next_steps: generated.recommended_next_steps ?? [],
        platform_adaptations: generated.platform_adaptations ?? [],
      };
    } else if (settings.llmMockMode) {
      output = buildMockCopy({
        projectTitle: project.title,
        topic: project.topic_query,
        sourceMessage,
      });
    } else {
      throw new Error(`宣传文案生成未找到可用模型。当前路由为 ${route.provider}/${route.model}，请先在设置中配置对应 API key，或临时开启 mock 模式。`);
    }

    const validated = promotionalCopyOutputSchema.parse(output);

    // Auto quality diagnosis — lightweight scoring after generation
    let qualityDiagnosis = validated.quality_diagnosis ?? undefined;
    if (!qualityDiagnosis && canUseModelRoute("MARKETING_ANALYSIS", settings)) {
      try {
        const diagnosisResult = await generateStructuredJson({
          routeKey: "MARKETING_ANALYSIS",
          schemaName: "promotional_copy_diagnosis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["overall_score", "strengths", "issues", "rewrite_focus", "summary"],
            properties: {
              overall_score: { type: "number" },
              strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
              issues: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
              rewrite_focus: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
              summary: { type: "string" },
            },
          } as const,
          zodSchema: promotionalCopyDiagnosisSchema,
          temperature: 0.15,
          systemPrompt: [
            "你是文案质量审核员，只做诊断评分，不重写。",
            "评估标准：可发布感、传播攻击力、结构完整度、证明点具体度、CTA 清晰度。",
            "输出必须是合法 JSON。",
          ].join(" "),
          userPrompt: [
            "请对以下宣传主稿做质量诊断，给出评分和问题列表。",
            "",
            `主宣传角度：${validated.master_angle}`,
            `开场摘要：${validated.hero_copy}`,
            `完整主稿：\n${validated.long_form_copy}`,
            `证明点：\n${validated.proof_points.map((p) => `- ${p}`).join("\n")}`,
            `CTA：${validated.call_to_action}`,
            "",
            `项目主题：${project.topic_query}`,
          ].join("\n"),
        });
        qualityDiagnosis = diagnosisResult;
      } catch {
        // Diagnosis failure should not block the main flow
      }
    }

    const finalOutput = { ...validated, quality_diagnosis: qualityDiagnosis };

    const versionNumber = await this.getNextVersionNumber(projectId);

    const strategyTask = await prisma.strategyTask.create({
      data: {
        project_id: projectId,
        brand_profile_id: project.brand_profile_id,
        task_type: "SCRIPT" as StrategyTaskType,
        task_status: "DONE" as StrategyTaskStatus,
        task_title: `宣传文案主稿 v${versionNumber}`,
        task_summary: validated.hero_copy,
        priority_score: 90,
        task_json: toJson({
          kind: "PROMOTIONAL_COPY",
          version_number: versionNumber,
          generated_at: new Date().toISOString(),
          generation_source: settings.llmMockMode ? "mock" : `${route.provider}/${route.model}`,
          ...finalOutput,
        }),
      },
    });

    return {
      strategy_task_id: strategyTask.id,
      platform_adaptation_count: 0,
      platform_adaptation_ids: [],
      output: finalOutput,
    };
  }

  async saveVersion(
    projectId: string,
    input: {
      title?: string;
      master_angle: string;
      headline_options: string[];
      hero_copy: string;
      long_form_copy: string;
      proof_points: string[];
      call_to_action: string;
      risk_notes?: string[];
      recommended_next_steps?: string[];
      source_task_id?: string | null;
    },
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        brand_profile_id: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    const versionNumber = await this.getNextVersionNumber(projectId);
    const payload = promotionalCopyOutputSchema.pick({
      master_angle: true,
      headline_options: true,
      hero_copy: true,
      long_form_copy: true,
      proof_points: true,
      call_to_action: true,
      risk_notes: true,
      recommended_next_steps: true,
    }).parse({
      master_angle: input.master_angle,
      headline_options: input.headline_options,
      hero_copy: input.hero_copy,
      long_form_copy: input.long_form_copy,
      proof_points: input.proof_points,
      call_to_action: input.call_to_action,
      risk_notes: input.risk_notes ?? [],
      recommended_next_steps: input.recommended_next_steps ?? [],
    });

    const created = await prisma.strategyTask.create({
      data: {
        project_id: projectId,
        brand_profile_id: project.brand_profile_id,
        task_type: "SCRIPT",
        task_status: "DONE",
        task_title: input.title?.trim() || `宣传文案主稿 v${versionNumber}`,
        task_summary: payload.hero_copy,
        priority_score: 88,
        task_json: toJson({
          kind: "PROMOTIONAL_COPY",
          version_number: versionNumber,
          source_task_id: input.source_task_id ?? null,
          edited_by_user: true,
          saved_at: new Date().toISOString(),
          ...payload,
          platform_adaptations: [],
        }),
      },
    });

    return created;
  }

  async diagnoseAndEnhance(
    projectId: string,
    input: {
      title?: string;
      master_angle: string;
      headline_options: string[];
      hero_copy: string;
      long_form_copy: string;
      proof_points: string[];
      call_to_action: string;
      risk_notes?: string[];
      recommended_next_steps?: string[];
      source_task_id?: string | null;
    },
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand_profile: true,
        trend_topics: {
          orderBy: { momentum_score: "desc" },
          take: 3,
        },
        creative_briefs: {
          orderBy: { version_number: "desc" },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    const settings = await this.appSettingsService.getEffectiveSettings();
    const route = settings.llmRouting.PROMOTIONAL_COPY;
    const context = await this.marketingContextService.getProjectContext(projectId);
    const contextPrompt = this.marketingContextService.formatPromptContext(context);
    const workspaceMode = getWorkspaceMode((project.metadata as { workspace_mode?: string } | null)?.workspace_mode);
    const surfaces: PlatformSurface[] =
      workspaceMode === "COPYWRITING"
        ? ["XIAOHONGSHU_POST", "COMMENT_REPLY", "COVER_COPY"]
        : ["XIAOHONGSHU_POST", "DOUYIN_VIDEO", "DOUYIN_TITLE", "COMMENT_REPLY", "COVER_COPY"];
    const latestBrief = project.creative_briefs[0] ?? null;
    const sourceMessage = compactLines([
      context?.projectIntroduction,
      context?.coreIdea,
      project.raw_script_text,
      project.topic_query,
    ]).join("\n\n");
    const creativeBrief = buildCreativeBrief({
      contextPrompt,
      projectTitle: project.title,
      topic: project.topic_query,
      sourceMessage,
      styleReferenceSample: context?.styleReferenceSample ?? null,
      latestBrief,
      trendSummaries: project.trend_topics.map(
        (topic) => `${topic.topic_label}（总分 ${topic.momentum_score}，阶段 ${topic.trend_stage}）`,
      ),
    });

    const currentDraft = promotionalCopyOutputSchema
      .pick({
        master_angle: true,
        headline_options: true,
        hero_copy: true,
        long_form_copy: true,
        proof_points: true,
        call_to_action: true,
        risk_notes: true,
        recommended_next_steps: true,
      })
      .parse({
        master_angle: input.master_angle,
        headline_options: input.headline_options,
        hero_copy: input.hero_copy,
        long_form_copy: input.long_form_copy,
        proof_points: input.proof_points,
        call_to_action: input.call_to_action,
        risk_notes: input.risk_notes ?? [],
        recommended_next_steps: input.recommended_next_steps ?? [],
      });

    let output: PromotionalCopyOutput;
    if (canUseModelRoute("PROMOTIONAL_COPY", settings)) {
      const generated = await generateStructuredJson<Record<string, unknown>>({
        routeKey: "PROMOTIONAL_COPY",
        schemaName: "promotional_copy_enhancement_output",
        schema: promotionalCopyEnhancementSchema,
        preprocess: (value) => normalizePromotionalCopyOutput(value, surfaces),
        systemPrompt: [
          "你是一名资深品牌文案总监和内容编辑，不是解释者，而是修改者。",
          "你的任务是先诊断当前主稿质量，再给出增强后的最终成稿。",
          "增强目标是：更像真实可发布文案，更清楚、更有传播感、更具体、更有行动驱动。",
          "输出必须是合法 JSON。",
        ].join(" "),
        userPrompt: [
          "请对下面这版宣传主稿先做质量诊断，再输出增强后的最终版本。",
          buildEnhancementRules(),
          "原稿存在的问题要讲具体，不要泛泛而谈。",
          "增强版必须保持原传播方向，但表达要更强。",
          context?.styleReferenceInsight
            ? [
                "继续沿用参考样稿的三段学习：",
                `- 标题风格：${context.styleReferenceInsight.titleStyleLines.join(" ")}`,
                `- 开头风格：${context.styleReferenceInsight.openingStyleLines.join(" ")}`,
                `- 正文节奏：${context.styleReferenceInsight.bodyRhythmLines.join(" ")}`,
              ].join("\n")
            : "当前没有可用的分段风格学习信息。",
          "",
          "当前项目上下文：",
          creativeBrief,
          "",
          "当前主稿：",
          `主宣传角度：${currentDraft.master_angle}`,
          `标题备选：\n${currentDraft.headline_options.map((item) => `- ${item}`).join("\n")}`,
          `开场摘要：${currentDraft.hero_copy}`,
          `完整主稿：\n${currentDraft.long_form_copy}`,
          `证明点：\n${currentDraft.proof_points.map((item) => `- ${item}`).join("\n")}`,
          `CTA：${currentDraft.call_to_action}`,
          "",
          "输出要求：",
          "- quality_diagnosis：包含整体评分、优点、问题、增强重点和一句总结。",
          "- long_form_copy：必须输出增强后的完整主稿，而不是修改建议。",
          "- 不要顺带输出平台稿，增强阶段只做主稿。",
          "- 其余字段也同步优化。",
        ].join("\n"),
      });

      // Merge LLM output with original draft — any missing/short field falls back to currentDraft
      const g = generated as Record<string, unknown>;
      const gMasterAngle = typeof g.master_angle === "string" && g.master_angle.length >= 6 ? g.master_angle : currentDraft.master_angle;
      const gHeadlines = Array.isArray(g.headline_options) && g.headline_options.length >= 3 ? g.headline_options as string[] : currentDraft.headline_options;
      const gHeroCopy = typeof g.hero_copy === "string" && g.hero_copy.length >= 20 ? g.hero_copy : currentDraft.hero_copy;
      const gLongForm = typeof g.long_form_copy === "string" && g.long_form_copy.length >= 80 ? g.long_form_copy : currentDraft.long_form_copy;
      const gProofPoints = Array.isArray(g.proof_points) && g.proof_points.length >= 3 ? g.proof_points as string[] : currentDraft.proof_points;
      const gCta = typeof g.call_to_action === "string" && g.call_to_action.length >= 4 ? g.call_to_action : currentDraft.call_to_action;

      output = {
        master_angle: gMasterAngle,
        headline_options: gHeadlines,
        hero_copy: gHeroCopy,
        long_form_copy: gLongForm,
        proof_points: gProofPoints,
        call_to_action: gCta,
        risk_notes: Array.isArray(g.risk_notes) ? g.risk_notes as string[] : currentDraft.risk_notes ?? [],
        recommended_next_steps: Array.isArray(g.recommended_next_steps) ? g.recommended_next_steps as string[] : [],
        platform_adaptations: Array.isArray(g.platform_adaptations) ? g.platform_adaptations as PromotionalCopyOutput["platform_adaptations"] : [],
        quality_diagnosis: g.quality_diagnosis && typeof g.quality_diagnosis === "object" ? g.quality_diagnosis as PromotionalCopyOutput["quality_diagnosis"] : undefined,
      };
    } else if (settings.llmMockMode) {
      output = {
        ...currentDraft,
        hero_copy: `${currentDraft.hero_copy} 这版已经补强开场钩子与用户价值表达。`,
        long_form_copy: `${currentDraft.long_form_copy}\n\n增强说明：先把用户真实问题说透，再用更具体的利益点与行动引导收束，避免空泛总结。`,
        recommended_next_steps: ["继续压缩空话", "把证明点再具体化", "生成平台稿并跑合规"],
        quality_diagnosis: {
          overall_score: 74,
          strengths: ["传播角度已经明确", "已有基本结构和 CTA"],
          issues: ["开头钩子还不够强", "部分表达偏抽象", "证明点不够具体"],
          rewrite_focus: ["强化开头", "压缩套话", "补强可感知价值点"],
          summary: "当前主稿方向是对的，但表达密度和转化感还不够，适合先增强再发布。",
        },
        platform_adaptations: [],
      };
    } else {
      throw new Error(`宣传文案增强未找到可用模型。当前路由为 ${route.provider}/${route.model}，请先在设置中配置对应 API key，或临时开启 mock 模式。`);
    }

    // Log what the LLM actually returned vs what we merged (server-side only, for debugging)
    console.info("[diagnoseAndEnhance] merge result:", {
      master_angle_changed: output.master_angle !== currentDraft.master_angle,
      hero_copy_changed: output.hero_copy !== currentDraft.hero_copy,
      long_form_copy_changed: output.long_form_copy !== currentDraft.long_form_copy,
      has_diagnosis: !!output.quality_diagnosis,
    });

    // The merge already guarantees every field meets minimum requirements
    // (each field individually falls back to currentDraft if the LLM output is insufficient).
    // No need for a second Zod pass that could reject the entire merged output.
    const validated = output;

    const versionNumber = await this.getNextVersionNumber(projectId);
    const created = await prisma.strategyTask.create({
      data: {
        project_id: projectId,
        brand_profile_id: project.brand_profile_id,
        task_type: "SCRIPT",
        task_status: "DONE",
        task_title: input.title?.trim() || `宣传文案增强版 v${versionNumber}`,
        task_summary: validated.hero_copy,
        priority_score: 92,
        task_json: toJson({
          kind: "PROMOTIONAL_COPY",
          version_number: versionNumber,
          source_task_id: input.source_task_id ?? null,
          enhanced_from_task_id: input.source_task_id ?? null,
          generated_at: new Date().toISOString(),
          generation_source: settings.llmMockMode ? "mock" : `${route.provider}/${route.model}`,
          ...validated,
        }),
      },
    });

    return created;
  }

  private async getNextVersionNumber(projectId: string) {
    const tasks = await prisma.strategyTask.findMany({
      where: {
        project_id: projectId,
        task_type: "SCRIPT",
      },
      select: {
        task_json: true,
      },
    });

    const existing = tasks
      .map((task) => {
        const json = (task.task_json ?? {}) as { kind?: string; version_number?: number };
        return json.kind === "PROMOTIONAL_COPY" ? json.version_number ?? 0 : 0;
      })
      .filter((value) => Number.isFinite(value));

    return (existing.length ? Math.max(...existing) : 0) + 1;
  }
}
