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
  /** Detailed character description defining WHO writes for this direction (200-300 chars). */
  writingPersona: string;
  /** Quality criteria specific to this direction. */
  qualityChecklist: string[];
  /** Patterns/phrases that MUST NOT appear in this direction's articles. */
  forbiddenPatterns: string[];
  /** Target article word count range. */
  targetWordCount: { min: number; max: number };
  /** Benchmark title examples for this direction. */
  exampleTitles: string[];
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
    label: "AI快讯",
    focus: "模型发布 · Agent 动态 · AI 产品快报",
    topic: "AI快讯",
    introduction: "围绕大模型、Agent、AI 产品更新和行业节点，做一条面向头条号的高密度 AI 快讯账号。",
    coreIdea: "先交代今天最值得关注的 AI 变化，再补一句这件事为什么重要，帮助读者快速完成信息更新。",
    styleReferenceSample:
      "参考中文头部科技资讯博主的快讯写法：标题先给出变化点，正文先讲发生了什么，再补一句行业意义；语言要快、准、清楚，避免空泛赞叹和发布会复述。",
    writingPersona:
      "你是一名资深科技评论人，长期跟踪 AI 行业一线动态。你的写作风格：信息密度高、节奏快、善用数据和引用。你不写长篇大论，每段都有新信息。你的读者是忙碌的科技从业者，他们需要在 3 分钟内了解今天最重要的 AI 变化。",
    qualityChecklist: [
      "每段是否包含至少一个新事实或数据点",
      "标题是否直接点明变化（不是泛泛的'AI又有新进展'）",
      "是否在前 100 字内交代清楚发生了什么",
      "是否避免了空洞的感叹句和价值判断",
      "引用的数据是否有来源（公司、机构、论文）",
      "是否避免了发布会原文复述",
    ],
    forbiddenPatterns: [
      "让我们一起", "不得不说", "细思极恐", "颠覆一切", "万能 AI",
      "绝对领先", "划时代", "令人震惊", "重磅", "劲爆",
    ],
    targetWordCount: { min: 1500, max: 3000 },
    exampleTitles: [
      "OpenAI 发布 GPT-6：多模态推理能力提升 3 倍，API 价格下调 40%",
      "谷歌 DeepMind 论文揭示：大模型训练效率仍有 10 倍优化空间",
      "Anthropic Claude 4 内测数据曝光：代码生成准确率首次超过人类基线",
      "国产大模型出海第一站：Qwen 3.6 在东南亚拿下 200 万日活",
      "Agent 框架之争：LangChain vs CrewAI vs AutoGen，开发者怎么选",
    ],
    brand: {
      name: "AI快讯",
      positioning: "面向想快速跟进 AI 圈动态的中文读者，提供高频、清楚、可转述的 AI 快讯内容。",
      voice: "快、准、克制",
      stage: "VALIDATION",
      platformPriority: ["XIAOHONGSHU_POST", "COMMENT_REPLY", "COVER_COPY"],
      forbiddenPhrases: ["颠覆一切", "万能 AI", "绝对领先", "稳赚不赔"],
      keywordPool: ["大模型", "Agent", "OpenAI", "Google", "Anthropic", "国产模型", "AI 应用", "产品更新"],
      coreBelief: "好的 AI 快讯不是堆新闻，而是快速筛出真正值得关注的变化并说清楚原因。",
      productLines: ["头条号 AI 快讯", "AI 产品动态栏目", "AI 产业情报图文"],
      targetPersonas: ["关注 AI 的泛科技读者", "产品经理", "开发者", "想跟上 AI 变化的内容从业者"],
      complianceNotes: "避免夸大模型能力，避免把实验性结论包装成确定性商业结果。",
      metadata: { direction: "AI快讯", lane: "owned_media", primary_channel: "toutiao" },
    },
    pillars: [
      {
        name: "模型快报",
        type: "TREND_REACTION",
        summary: "快速覆盖最新模型发布和能力变化。",
        topics: ["新模型上线了什么", "新功能最值得注意的点", "和上一代相比到底变了什么"],
      },
      {
        name: "Agent 与产品动态",
        type: "EDUCATION",
        summary: "跟进 AI 产品、Agent 和工具链的新动作。",
        topics: ["谁在推新的 Agent 工作流", "AI 产品最近在卷什么", "哪些工具开始真正走向普及"],
      },
      {
        name: "行业影响短评",
        type: "TREND_REACTION",
        summary: "用更短路径说明这条 AI 新闻为什么重要。",
        topics: ["OpenAI 新动作意味着什么", "大厂更新对行业有什么影响", "为什么这条新闻值得普通读者关注"],
      },
    ],
    brief: {
      title: "AI快讯本轮任务单",
      objective: "AWARENESS",
      tone: "TECHNICAL",
      audienceAwareness: "COLD",
      platforms: ["XHS", "DOUYIN"],
      keyMessage: "把一条 AI 新动态压缩成清楚、可转述、能快速读懂的快讯内容。",
      callToAction: "关注栏目",
      targetAudience: "想快速跟进 AI 新闻和产品变化的中文科技读者",
      durationSec: 60,
      constraints: ["先写发生了什么", "再写为什么重要", "避免长篇复述发布会措辞"],
    },
  },
  {
    id: "MONEY_NEVER_SLEEPS",
    label: "全球股市",
    focus: "美股 · 港股 · A股 · 宏观资金",
    topic: "全球股市",
    introduction: "围绕全球市场、指数波动、公司财报和资金情绪，做一条面向头条号的全球股市观察账号。",
    coreIdea: "先交代市场发生了什么，再指出最值得盯的变量，让读者更快抓住盘面重点。",
    styleReferenceSample:
      "参考中文头部财经快评稿：开头先给市场焦点，再用指数、个股、财报或宏观变量支撑判断，最后落到'接下来该看什么'；避免空泛评论和投资承诺。",
    writingPersona:
      "你是一名全球宏观分析师，穿梭于纽约、伦敦、东京、上海的金融圈。你的写作风格：逻辑严密、数据驱动、善用类比解释复杂概念。每篇文章都有明确的判断和论据。你的读者既有专业投资者也有关注市场的普通人，你需要把专业内容写得清楚但不降低深度。",
    qualityChecklist: [
      "核心判断是否有数据或事实支撑",
      "是否清楚交代了时间线（发生在什么时候、下一个关键节点是什么）",
      "是否提供了风险提示或相反观点",
      "是否避免了无依据的预测性语言",
      "类比和解释是否帮助非专业读者理解",
      "是否在结尾指出接下来该关注什么变量",
      "引用的指数/数据是否标注了具体数字和时间",
    ],
    forbiddenPatterns: [
      "暴涨", "暴跌", "必涨", "抄底", "稳赚", "内幕消息",
      "保本", "一定会", "不可能", "错过就没了", "最后的机会",
    ],
    targetWordCount: { min: 2000, max: 4000 },
    exampleTitles: [
      "美联储暂停加息背后：三个被忽略的经济信号",
      "日经指数创新高的逻辑与风险：一位亚洲基金经理的复盘",
      "英伟达财报超预期之后，AI 算力股还能买吗？",
      "人民币汇率破 7.3 的三层含义：贸易、利差、情绪",
      "港股为什么持续跑输 A 股：资金结构的答案",
    ],
    brand: {
      name: "全球股市",
      positioning: "面向关注全球市场与公司动态的中文读者，提供快节奏、高信息密度的股市观察内容。",
      voice: "冷静、直接、盘感明确",
      stage: "VALIDATION",
      platformPriority: ["XIAOHONGSHU_POST", "COMMENT_REPLY", "COVER_COPY"],
      forbiddenPhrases: ["内幕消息", "必涨", "稳赚", "保本"],
      keywordPool: ["美股", "港股", "A股", "纳指", "标普", "恒生", "财报", "宏观", "资金情绪"],
      coreBelief: "股市内容的价值不在复述涨跌，而在快速指出最关键的价格驱动和风险变量。",
      productLines: ["头条号股市图文", "盘前盘后快评", "财报与宏观观察"],
      targetPersonas: ["关注全球市场的中文读者", "盘前盘后内容消费者", "想快速抓重点的财经泛用户"],
      complianceNotes: "避免投资建议口吻，避免收益承诺，避免未证实消息的确定性表达。",
      metadata: { direction: "全球股市", lane: "owned_media", primary_channel: "toutiao" },
    },
    pillars: [
      {
        name: "盘面快评",
        type: "TREND_REACTION",
        summary: "快速解释今天全球市场最重要的波动点。",
        topics: ["指数为什么突然动了", "今天市场最强的主线是什么", "盘后最该看的数据或财报是什么"],
      },
      {
        name: "财报与公司动态",
        type: "EDUCATION",
        summary: "把财报、指引和公司动作讲清楚。",
        topics: ["这份财报到底好不好", "为什么公司一句表态影响盘面", "哪些公司动态会带来再定价"],
      },
      {
        name: "宏观与资金变量",
        type: "TREND_REACTION",
        summary: "把宏观消息转成市场语言。",
        topics: ["利率和汇率该怎么看", "一条宏观消息为什么会带动板块", "接下来该盯哪几个变量"],
      },
    ],
    brief: {
      title: "全球股市本轮任务单",
      objective: "AWARENESS",
      tone: "DIRECT",
      audienceAwareness: "COLD",
      platforms: ["XHS", "DOUYIN"],
      keyMessage: "把全球市场的最新变化压成一段能快速读懂的市场判断，让读者知道现在最该盯什么。",
      callToAction: "关注栏目",
      targetAudience: "关注美股、港股、A股和宏观变量的中文财经读者",
      durationSec: 60,
      constraints: ["不要给投资建议", "先交代市场变化，再讲变量", "不要把未证实信息写成结论"],
    },
  },
  {
    id: "EASTERN_VITALITY",
    label: "消费时尚",
    focus: "品牌动态 · 美妆服饰 · 消费趋势",
    topic: "消费时尚",
    introduction: "围绕品牌、时尚、美妆和消费趋势，做一条更懂审美与消费情绪的头条号图文账号。",
    coreIdea: "先说这一轮消费时尚圈发生了什么，再讲它为什么会影响品牌、审美和购买判断。",
    styleReferenceSample:
      "参考中文头部消费时尚博主和商业观察稿：先抛出品牌或趋势变化，再补消费人群、产品细节和行业信号；语言要有审美感，但不要空话和大词。",
    writingPersona:
      "你是一名品牌观察家与生活方式编辑，善于从细节发现趋势。你的写作风格：审美叙事、场景描写丰富、克制推荐。你不做硬广，让读者自己得出结论。你的文字有质感但不矫情，有判断但不武断。你的读者是有品味的城市消费者，他们厌倦了直播间的吆喝，想看到真正懂品牌的内容。",
    qualityChecklist: [
      "是否有具体的场景描写（空间、光线、材质、气味）",
      "品牌是否自然融入叙事而非硬性植入",
      "是否有明确的审美判断（而非空泛的'高级'）",
      "情绪是否克制（不过度煽情，不强行推荐）",
      "是否有具体的产品细节或数据支撑观点",
      "标题是否引发好奇而非直接卖点",
    ],
    forbiddenPatterns: [
      "性价比超高", "买它买它", "强烈推荐", "良心好物", "闭眼入",
      "绝对高级", "人人必买", "断货王", "yyds", "绝绝子",
    ],
    targetWordCount: { min: 1800, max: 3500 },
    exampleTitles: [
      "一家上海咖啡店如何用 12 平米做出米其林级审美",
      "优衣库的反时尚哲学：当所有品牌在做加法，它在做减法",
      "为什么 Aesop 的店永远不像护肤品店",
      "消费降级的另一面：年轻人开始买更贵的基础款",
      "一支口红的定价逻辑：从 50 元到 500 元之间发生了什么",
    ],
    brand: {
      name: "消费时尚",
      positioning: "面向关注品牌、美妆、服饰和消费趋势的读者，提供既懂产品又懂审美的图文内容。",
      voice: "利落、有审美、懂消费",
      stage: "VALIDATION",
      platformPriority: ["XIAOHONGSHU_POST", "COMMENT_REPLY", "COVER_COPY"],
      forbiddenPhrases: ["闭眼入", "绝对高级", "人人必买", "保值稳赚"],
      keywordPool: ["消费趋势", "品牌", "美妆", "服饰", "奢侈品", "生活方式", "联名", "新品"],
      coreBelief: "消费时尚内容的价值不在堆名词，而在于把品牌动作、产品细节和消费情绪讲清楚。",
      productLines: ["头条号消费时尚图文", "品牌趋势观察", "新品与消费情绪快评"],
      targetPersonas: ["关注品牌和生活方式的城市读者", "喜欢看新品与趋势内容的女性用户", "消费决策前会搜内容的泛时尚用户"],
      complianceNotes: "避免夸大功效，避免虚假价格锚定，避免未经核实的品牌传闻。",
      metadata: { direction: "消费时尚", lane: "owned_media", primary_channel: "toutiao" },
    },
    pillars: [
      {
        name: "品牌与新品动态",
        type: "EDUCATION",
        summary: "跟进品牌动作、新品发布和联名节点。",
        topics: ["这个新品为什么有讨论度", "一场联名背后的品牌意图", "品牌最近在发力什么风格"],
      },
      {
        name: "消费趋势观察",
        type: "USE_CASE",
        summary: "把消费圈和时尚圈的流行变化讲清楚。",
        topics: ["这轮消费趋势在变什么", "什么审美开始回潮", "为什么某类产品开始重新受欢迎"],
      },
      {
        name: "产品与购买判断",
        type: "TREND_REACTION",
        summary: "帮助读者更快形成消费判断。",
        topics: ["这类产品值不值得买", "品牌升级到底升级了什么", "哪些卖点只是包装，哪些是真的变化"],
      },
    ],
    brief: {
      title: "消费时尚本轮任务单",
      objective: "AWARENESS",
      tone: "PREMIUM",
      audienceAwareness: "COLD",
      platforms: ["XHS", "DOUYIN"],
      keyMessage: "把品牌、产品和趋势变化写得既有审美感也有判断，让读者更快理解这一轮消费时尚信号。",
      callToAction: "关注栏目",
      targetAudience: "关注品牌、美妆、服饰与消费趋势的中文生活方式读者",
      durationSec: 60,
      constraints: ["不要写成空泛种草", "至少给出一个明确判断", "避免未经核实的品牌传闻"],
    },
  },
];

export function getEditorialDirectionPresets(locale: Locale = "zh"): EditorialDirectionPreset[] {
  if (locale === "en") {
    return zhPresets.map((preset) => ({
      ...preset,
      label:
        preset.id === "AI_GROWTH"
          ? "AI Briefing"
          : preset.id === "MONEY_NEVER_SLEEPS"
            ? "Global Markets"
            : "Consumer Style",
    }));
  }
  return zhPresets;
}

export function getEditorialDirectionPresetById(id: EditorialDirectionPresetId, locale: Locale = "zh") {
  return getEditorialDirectionPresets(locale).find((preset) => preset.id === id) ?? null;
}
