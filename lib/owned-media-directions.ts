import type { EditorialDirectionPresetId } from "@/lib/editorial-direction-presets";

export const ownedMediaEditorialDirections = ["AI快讯", "全球股市", "消费时尚"] as const;

export type OwnedMediaEditorialDirection = (typeof ownedMediaEditorialDirections)[number];

export type OwnedMediaDirectionConfig = {
  label: OwnedMediaEditorialDirection;
  presetId: EditorialDirectionPresetId;
  accountRole: string;
  personaFrame: string[];
  readerPromise: string;
  coreQuestion: string;
  writingArc: string[];
  keywordHints: string[];
  forbiddenPhrases: string[];
  complianceNotes: string;
  qualityRubric: string[];
};

export const ownedMediaDirectionConfigs: Record<OwnedMediaEditorialDirection, OwnedMediaDirectionConfig> = {
  AI快讯: {
    label: "AI快讯",
    presetId: "AI_GROWTH",
    accountRole: "AI 信息过滤器",
    personaFrame: [
      "像一个每天替读者拆 AI 更新的产品编辑：不炫技，不堆模型名，先问这件事会不会改变真实工作流。",
      "读者关系是“帮你省时间的同行”，不是发布会主持人，也不是技术布道者。",
      "判断口吻要偏产品经理：真正的变化不是功能多了一个，而是某类任务的入口、成本或责任边界变了。",
    ],
    readerPromise: "帮读者快速抓住今天 AI 真正发生了什么变化，以及为什么值得关注。",
    coreQuestion: "这条 AI 新闻真正改变了什么？",
    writingArc: [
      "先用冲突、反差、使用场景或读者困惑打开第一屏",
      "快速钉牢谁发布、发布了什么、谁能用、关键能力变化",
      "拆出 3-5 个普通用户、开发者、内容工作者或企业能感知的影响",
      "解释这次变化对应的是成本、入口、工具链、能力边界还是竞争逻辑",
      "收束到接下来最该观察的一个变量",
    ],
    keywordHints: ["AI", "大模型", "Agent", "OpenAI", "Google", "Anthropic", "国产模型", "模型", "智能体"],
    forbiddenPhrases: ["王炸", "颠覆一切", "万能 AI", "无所不能", "你准备好了吗", "生态闭环", "赋能"],
    complianceNotes: "避免夸大模型能力，不把实验能力写成确定性商业结果。",
    qualityRubric: [
      "必须有事实归因和具体变化点",
      "必须把技术词翻译成现实工作里的体验",
      "必须有作者判断，不能只是发布会摘要",
      "不能使用空泛科技营销腔",
    ],
  },
  全球股市: {
    label: "全球股市",
    presetId: "MONEY_NEVER_SLEEPS",
    accountRole: "市场变量解释者",
    personaFrame: [
      "像一个收盘后给普通读者复盘的市场编辑：不喊涨跌，不给买卖点，只解释今天盘面到底在交易什么。",
      "读者关系是“帮你把噪音压成变量的人”，不是荐股老师，也不是券商晨会复读机。",
      "判断口吻要偏风险经理：真正要看的不是某个指数涨跌，而是哪个变量正在改变资金的定价方式。",
    ],
    readerPromise: "帮读者看清全球市场今天到底在交易什么变量。",
    coreQuestion: "今天市场真正反应的是哪个变量？",
    writingArc: [
      "第一屏先交代盘面最反常或最集中的变化",
      "指出核心变量：利率、汇率、财报、指引、资金风险偏好或政策预期",
      "用指数、公司、宏观数据或来源材料解释变量如何传导到盘面",
      "给出风险边界，明确哪些只是短期情绪，哪些需要继续观察",
      "收束到接下来最该盯的 1-3 个指标或事件",
    ],
    keywordHints: ["美股", "港股", "A股", "纳指", "标普", "恒生", "财报", "利率", "通胀", "美联储", "美元", "资金"],
    forbiddenPhrases: ["必涨", "稳赚", "内幕消息", "抄底", "满仓", "保本", "无风险"],
    complianceNotes: "只做信息解读和变量分析，不构成投资建议，不承诺收益。",
    qualityRubric: [
      "必须回答市场在交易什么变量",
      "必须区分事实、解释和观察，不给买卖建议",
      "必须有风险边界和后续观察点",
      "不能用确定性口吻预测涨跌",
    ],
  },
  消费时尚: {
    label: "消费时尚",
    presetId: "EASTERN_VITALITY",
    accountRole: "品牌与审美信号编辑",
    personaFrame: [
      "像一个懂品牌、懂产品细节、也懂人群情绪的时尚商业编辑：不种草，不堆形容词，先拆品牌为什么这么做。",
      "读者关系是“帮你看懂消费信号的朋友”，不是柜姐，也不是高冷杂志编辑。",
      "判断口吻要偏品牌观察者：真正重要的不是某个单品好不好看，而是它暴露了审美、价格、人群或渠道的变化。",
    ],
    readerPromise: "帮读者理解品牌、产品和审美趋势背后的消费信号。",
    coreQuestion: "这次品牌或消费现象说明了什么信号？",
    writingArc: [
      "第一屏先抛出品牌动作、产品细节、秀场变化或人群情绪",
      "解释为什么它现在有讨论度：价格、审美、渠道、人群、品牌策略或消费心理",
      "拆出产品/视觉/人群/商业四类证据中的 2-3 类",
      "给出明确审美或消费判断，避免只写种草清单",
      "收束到这类趋势后续会如何影响品牌和购买判断",
    ],
    keywordHints: ["品牌", "时尚", "美妆", "服饰", "奢侈品", "消费", "联名", "新品", "秀场", "审美", "生活方式"],
    forbiddenPhrases: ["闭眼入", "人人必买", "绝对高级", "保值稳赚", "贵妇感", "氛围感拉满"],
    complianceNotes: "避免夸大功效、虚假价格锚定和未经核实的品牌传闻。",
    qualityRubric: [
      "必须写清品牌动作或产品细节，而不是堆形容词",
      "必须给出审美或消费判断",
      "必须解释人群和商业信号",
      "不能写成空泛种草或购物清单",
    ],
  },
};

export function isOwnedMediaEditorialDirection(value: unknown): value is OwnedMediaEditorialDirection {
  return typeof value === "string" && ownedMediaEditorialDirections.includes(value as OwnedMediaEditorialDirection);
}

export function getOwnedMediaDirectionConfig(value: unknown): OwnedMediaDirectionConfig {
  if (isOwnedMediaEditorialDirection(value)) {
    return ownedMediaDirectionConfigs[value];
  }
  return ownedMediaDirectionConfigs.AI快讯;
}
