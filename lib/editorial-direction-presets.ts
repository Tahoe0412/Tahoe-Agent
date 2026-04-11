import type { Locale } from "@/lib/locale-copy";
import type { PlatformSurface } from "@/lib/platform-surface";

export type EditorialDirectionPresetId = "AI_GROWTH" | "MONEY_NEVER_SLEEPS" | "EASTERN_VITALITY";

export type EditorialDirectionPreset = {
  id: EditorialDirectionPresetId;
  label: string;
  focus: string;
  topic: string;
  introduction: string;
  coreIdea: string;
  styleReferenceSample: string;
  brand: {
    name: string;
    positioning: string;
    voice: string;
    stage: "COLD_START" | "VALIDATION" | "SCALE";
    platformPriority: PlatformSurface[];
    forbiddenPhrases: string[];
    keywordPool: string[];
    coreBelief: string;
    productLines: string[];
    targetPersonas: string[];
    complianceNotes: string;
    metadata: Record<string, unknown>;
  };
  pillars: Array<{
    name: string;
    type:
      | "EDUCATION"
      | "BRAND_STORY"
      | "PRODUCT_VALUE"
      | "USE_CASE"
      | "TRUST_SIGNAL"
      | "FOUNDER_IP"
      | "USER_TESTIMONIAL"
      | "TREND_REACTION";
    summary: string;
    topics: string[];
  }>;
  brief: {
    title: string;
    objective: "AWARENESS" | "CONSIDERATION" | "CONVERSION" | "RETENTION" | "LAUNCH";
    tone: "PREMIUM" | "DIRECT" | "PLAYFUL" | "TECHNICAL" | "HUMAN" | "CINEMATIC";
    audienceAwareness: "COLD" | "WARM" | "HOT";
    platforms: Array<"XHS" | "DOUYIN" | "YOUTUBE" | "X" | "TIKTOK">;
    keyMessage: string;
    callToAction: string;
    targetAudience: string;
    durationSec: number;
    constraints: string[];
    campaignName?: string;
  };
};

const zhPresets: EditorialDirectionPreset[] = [
  {
    id: "AI_GROWTH",
    label: "AI增长官",
    focus: "大模型 · Agent · AI 商业应用",
    topic: "AI增长官",
    introduction: "围绕大模型、Agent、AI 产品与商业应用，做一条面向头条号的科技判断栏目。",
    coreIdea: "先给行业判断，再解释技术变化会怎样影响产品、团队和商业机会。",
    styleReferenceSample:
      "参考中文科技商业深度稿：先抛一个明确判断，再用产品案例、公司动作和行业变化把判断压实；避免空泛口号，尽量让读者读完后知道下一步该观察什么。",
    brand: {
      name: "AI增长官",
      positioning: "面向技术管理者、创业者和产品团队，提供关于大模型、Agent 与 AI 商业化的高密度判断内容。",
      voice: "专业、克制、判断明确",
      stage: "VALIDATION",
      platformPriority: ["XIAOHONGSHU_POST", "COMMENT_REPLY", "COVER_COPY"],
      forbiddenPhrases: ["颠覆一切", "万能 AI", "绝对领先", "稳赚不赔"],
      keywordPool: ["大模型", "Agent", "AI 应用", "AI 创业", "OpenAI", "Google", "国产模型", "AI 商业化"],
      coreBelief: "好的 AI 内容不是复述发布会，而是把技术变化翻译成产品和商业判断。",
      productLines: ["头条号科技图文", "行业解读专栏", "咨询型内容服务"],
      targetPersonas: ["技术创业者", "AI 产品经理", "增长负责人", "想用 AI 提效的中小企业主"],
      complianceNotes: "避免夸大模型能力，避免把实验性结论包装成确定性商业结果。",
      metadata: { direction: "AI增长官", lane: "owned_media", primary_channel: "toutiao" },
    },
    pillars: [
      {
        name: "模型与产品判断",
        type: "EDUCATION",
        summary: "把模型更新、产品动作和商业含义串成一个判断。",
        topics: ["新模型值不值得跟", "Agent 产品化的门槛", "AI 工具真正替代了哪些岗位动作"],
      },
      {
        name: "商业应用拆解",
        type: "USE_CASE",
        summary: "用真实案例解释 AI 在企业里的落地方式。",
        topics: ["销售团队如何用 AI", "内容团队的 Agent 工作流", "中小公司如何做低成本 AI 自动化"],
      },
      {
        name: "行业事件快评",
        type: "TREND_REACTION",
        summary: "对重要 AI 公司、融资和产品事件做短评。",
        topics: ["OpenAI 新动作怎么看", "大厂 AI 发布会后的真实影响", "AI 创业公司谁在跑通收入"],
      },
    ],
    brief: {
      title: "AI增长官本轮任务单",
      objective: "AWARENESS",
      tone: "TECHNICAL",
      audienceAwareness: "COLD",
      platforms: ["XHS", "DOUYIN"],
      keyMessage: "把技术发布、产品动作或行业事件转成一个清晰判断，并说明它对产品、团队或商业机会意味着什么。",
      callToAction: "关注栏目",
      targetAudience: "关注 AI 商业化与产品落地的中文科技读者",
      durationSec: 60,
      constraints: ["不要复述发布会文案", "至少给出一个明确判断", "尽量用真实公司、产品或场景支撑"],
    },
  },
  {
    id: "MONEY_NEVER_SLEEPS",
    label: "金钱不眠",
    focus: "金融 · 股市 · 资本 · 财经人物",
    topic: "金钱不眠",
    introduction: "围绕市场、资本、公司动态和财经人物，做一条有判断力的财经图文栏目。",
    coreIdea: "不要只复述新闻，要把信息变成对资金、行业和普通读者有意义的判断。",
    styleReferenceSample:
      "参考中文头部财经分析稿：先抛出资金或行业判断，再给市场动作、公司变化和人物背景，最后落到‘这意味着什么’；避免只做流水账。",
    brand: {
      name: "金钱不眠",
      positioning: "面向关注资本市场、公司动向和财经人物的读者，提供更快进入重点的财经判断内容。",
      voice: "冷静、直接、信息密度高",
      stage: "VALIDATION",
      platformPriority: ["XIAOHONGSHU_POST", "COMMENT_REPLY", "COVER_COPY"],
      forbiddenPhrases: ["内幕消息", "必涨", "稳赚", "保本"],
      keywordPool: ["股市", "美股", "港股", "资本市场", "上市公司", "巴菲特", "马斯克", "宏观"],
      coreBelief: "财经内容的价值不在于更快复述信息，而在于更快指出资金和行业真正关注的变量。",
      productLines: ["头条号财经图文", "市场快评", "人物与资本关系解读"],
      targetPersonas: ["财经内容消费者", "二级市场关注者", "对资本故事敏感的泛商业读者"],
      complianceNotes: "避免投资建议口吻，避免收益承诺，避免未证实消息的确定性表达。",
      metadata: { direction: "金钱不眠", lane: "owned_media", primary_channel: "toutiao" },
    },
    pillars: [
      {
        name: "资本事件判断",
        type: "TREND_REACTION",
        summary: "用更短路径解释一则资本新闻真正重要的点。",
        topics: ["融资为什么重要", "一笔并购背后的行业信号", "大佬发声到底影响了什么"],
      },
      {
        name: "市场叙事拆解",
        type: "EDUCATION",
        summary: "把复杂市场叙事拆成普通读者也能跟上的框架。",
        topics: ["为什么这轮板块轮动关键", "财报季该看什么", "宏观消息为什么带动股价"],
      },
      {
        name: "人物与公司动态",
        type: "FOUNDER_IP",
        summary: "关注财经人物、企业家和关键管理层动作。",
        topics: ["谁在重新定价行业", "企业家公开表态后的市场含义", "人物决策与公司走势的关系"],
      },
    ],
    brief: {
      title: "金钱不眠本轮任务单",
      objective: "AWARENESS",
      tone: "DIRECT",
      audienceAwareness: "COLD",
      platforms: ["XHS", "DOUYIN"],
      keyMessage: "把资本、公司和人物动态从新闻变成判断，让读者知道哪些变量最值得盯。",
      callToAction: "关注栏目",
      targetAudience: "关注市场、公司和财经人物的中文财经读者",
      durationSec: 60,
      constraints: ["不要给投资建议", "先写判断，再补事实", "不要把未经证实的信息写成结论"],
    },
  },
  {
    id: "EASTERN_VITALITY",
    label: "东方元气",
    focus: "食养 · 疗愈 · 心理健康",
    topic: "东方元气",
    introduction: "围绕食养、节气、疗愈体验和心理支持，做一条温和但有方法论的生活栏目。",
    coreIdea: "写法要克制、具体、可实践，让读者读完能带走一个明确做法或新理解。",
    styleReferenceSample:
      "参考中文高质量生活疗愈稿：用温和、清楚、可执行的表达组织内容，避免空灵鸡汤，最好给出一个明确做法、一段具体感受或一个可实践提醒。",
    brand: {
      name: "东方元气",
      positioning: "面向关注食养、节气、疗愈和心理韧性的读者，提供温和但具体的身心内容。",
      voice: "温和、清楚、节制",
      stage: "VALIDATION",
      platformPriority: ["XIAOHONGSHU_POST", "COMMENT_REPLY", "COVER_COPY"],
      forbiddenPhrases: ["包治百病", "根治", "绝对有效", "替代医学诊疗"],
      keywordPool: ["节气", "食养", "睡眠", "疗愈", "情绪修复", "心理健康", "呼吸练习", "身心平衡"],
      coreBelief: "疗愈与生活方式内容的价值，不在制造神秘感，而在于给出温和、真实、可实践的方法。",
      productLines: ["头条号生活图文", "节气专题", "疗愈与心理陪伴内容"],
      targetPersonas: ["高压工作的城市读者", "关注情绪和睡眠的女性用户", "喜欢节气与身心内容的人群"],
      complianceNotes: "避免医疗承诺，避免替代专业诊疗建议，心理健康话题需保守表达。",
      metadata: { direction: "东方元气", lane: "owned_media", primary_channel: "toutiao" },
    },
    pillars: [
      {
        name: "节气与食养",
        type: "EDUCATION",
        summary: "把节气、饮食和身体感受连起来。",
        topics: ["这个节气适合怎么吃", "换季时最容易忽略的身体信号", "一日饮食里最值得改的一件事"],
      },
      {
        name: "心理修复提醒",
        type: "USE_CASE",
        summary: "给读者一个当下就能用的小方法。",
        topics: ["情绪过载时怎么做", "睡前的修复动作", "高压工作者的一次微调练习"],
      },
      {
        name: "疗愈体验观察",
        type: "BRAND_STORY",
        summary: "用更克制的方式写体验、场景和感受。",
        topics: ["一次疗愈游学真正有用的部分", "安静环境为什么能帮人恢复", "如何区分有效疗愈与空泛包装"],
      },
    ],
    brief: {
      title: "东方元气本轮任务单",
      objective: "AWARENESS",
      tone: "HUMAN",
      audienceAwareness: "COLD",
      platforms: ["XHS", "DOUYIN"],
      keyMessage: "给读者一个温和但具体的身心提醒，让内容读完以后能落成一个方法或体感理解。",
      callToAction: "关注栏目",
      targetAudience: "关注节气食养、疗愈体验和心理韧性的中文生活方式读者",
      durationSec: 60,
      constraints: ["不要写成空泛鸡汤", "至少留一个可执行动作", "避免医疗化承诺"],
    },
  },
];

export function getEditorialDirectionPresets(locale: Locale = "zh"): EditorialDirectionPreset[] {
  if (locale === "en") {
    return zhPresets.map((preset) => ({
      ...preset,
      label:
        preset.id === "AI_GROWTH"
          ? "AI Growth"
          : preset.id === "MONEY_NEVER_SLEEPS"
            ? "Money Never Sleeps"
            : "Eastern Vitality",
    }));
  }
  return zhPresets;
}

export function getEditorialDirectionPresetById(id: EditorialDirectionPresetId, locale: Locale = "zh") {
  return getEditorialDirectionPresets(locale).find((preset) => preset.id === id) ?? null;
}
