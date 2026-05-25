import { buildOutputSpecificVisualInstruction } from "@/lib/visual-generation-prompt";
import {
  getOwnedMediaDirectionConfig,
  type OwnedMediaEditorialDirection,
} from "@/lib/owned-media-directions";

/**
 * LLM prompt template for Mars Citizen / owned-media narrative articles.
 * Generates a Toutiao-first long-form article draft, with enough argument,
 * factual grounding, and reader-facing interpretation to publish as image/text.
 */

export interface NewsItemForPrompt {
  title: string;
  source: string;
  published_at: string;
  snippet: string;
}

export interface TrendItemForPrompt {
  title: string;
  source: string;
  snippet: string;
}

function buildOwnedMediaOutputInstruction(direction: OwnedMediaEditorialDirection) {
  if (direction === "AI快讯") {
    return buildOutputSpecificVisualInstruction("NARRATIVE_SCRIPT", "MARS_CITIZEN");
  }
  if (direction === "全球股市") {
    return "输出目标：形成一篇头条号财经热点长文。文章要解释市场变量、事实依据、风险边界和后续观察点；配图应服务于指数、公司、宏观变量或资金情绪的清晰表达。";
  }
  return "输出目标：形成一篇头条号消费时尚热点长文。文章要解释品牌动作、产品细节、审美趋势、人群变化和消费判断；配图应服务于品牌/产品/秀场/生活方式信号的一致表达。";
}

export function buildOwnedMediaNarrativePrompt(
  factItems: NewsItemForPrompt[],
  trendItems: TrendItemForPrompt[],
  searchQuery: string,
  editorialDirection: OwnedMediaEditorialDirection = "AI快讯",
) {
  const direction = getOwnedMediaDirectionConfig(editorialDirection);
  const factBlock = factItems
    .map(
      (item, i) =>
        `${i + 1}. 【${item.source}】${item.title}\n   时间：${item.published_at}\n   摘要：${item.snippet}`,
    )
    .join("\n\n");

  const trendBlock = trendItems.length > 0
    ? trendItems
        .map(
          (item, i) =>
            `${i + 1}. ${item.source} 热门话题: ${item.title}\n   趋势信号: ${item.snippet}`,
        )
        .join("\n\n")
    : "";

const systemPrompt = `你是「${direction.label}」的头条号长文主编，账号角色是：${direction.accountRole}。
你的任务不是写一段新闻摘要，而是把多条材料整合成一篇可以直接发布的中文热点长文图文主稿。
读者承诺：${direction.readerPromise}
本账号每篇文章必须回答的核心问题：${direction.coreQuestion}

账号人设包装：
${direction.personaFrame.map((item) => `- ${item}`).join("\n")}

参考写法的结构经验（只学习方法，不模仿或复制具体作者语气）：
- 学习头部科技/财经/时尚商业内容的结构能力：事实钉牢、交叉验证、变量解释、强第一屏、短段落、明确判断、图文一致。
- 只化用选题和文章结构纪律，不复制具体文章，不模仿特定作者个人风格。
- 最终成稿要有作者视角：读者读完应该记得一个判断，而不是只记得几条材料摘要。

风格要求：
- 叙事视角：有判断力的中文图文专栏作者，不是通稿转述员，也不是营销号
- 语气：有钩子、有解释、有节奏，但事实边界克制
- 第一屏：可以用类比、反问、场景、盘面反常或品牌细节切入，但必须在 3-5 个短段内交代清楚核心事实
- 第一屏禁止从“今天，某公司发布了……”这种通稿句直接开头。先写冲突、反差、使用场景、市场变量或消费信号，再落到事实。
- 主体必须按本账号文章弧线推进：
${direction.writingArc.map((item, index) => `${index + 1}. ${item}`).join("\n")}
- 收尾：要有明确判断句，最好能留下 1-2 句可截图、可转述的话
- 语言：中文头条号长图文语言，段落短，节奏清楚，适合手机阅读
- 允许短句、反问、类比和轻微口语，但每一处口语都必须服务理解，不能灌水。
- 允许写“我更愿意把它理解成……”这类作者判断，但不能把文章写成个人日记。
- 篇幅：目标写到约 2000 个中文字，正常范围 1900-2300 字；低于 1700 字视为没有展开。素材不足时也尽量写到 1500 字以上，并把“不确定 / 还要观察”的边界写清楚
- 深度：不要只写“发生了什么”。每一篇都必须有“事实 -> 变量/机制 -> 对人的影响 -> 作者判断”的完整链条。
- 不要添加任何注释或格式标记（如 [画面] [BGM] 等）
- 事实素材是脚本主体依据，必须准确引用
- 正文里至少出现 2-3 次明确来源归因，例如“OpenAI 表示… / The Verge 提到… / 财联社援引第三方指标称…”
- 所有判断都必须能在给定素材里找到支撑，不要把标题党表述写进正文
- 选题参考只用于调整角度和叙事框架，不作为事实引用
- 不要把稿件写成夸张营销腔或未经核实的结论
- 如果素材里没有明确 benchmark、价格或性能数字，就不要自行补数字
- 每一段都要能回答一个实际问题，避免空泛总结
- 不要写成清单式短答。可以分段，但正文必须像一篇完整文章，有起承转合。

账号合规边界：
${direction.complianceNotes}

质量检查标准：
${direction.qualityRubric.map((item) => `- ${item}`).join("\n")}`;

  let userPrompt = `基于以下关于「${searchQuery}」的素材，为「${direction.label}」撰写一篇头条号热点长文主稿。

【事实素材 — 请基于这些内容撰写主体，确保事实准确】
${factBlock}`;

  if (trendBlock) {
    userPrompt += `

【选题参考 — 以下是行业创作者近期关注方向，参考调整视频角度和叙事框架，不要直接引用为事实】
${trendBlock}`;
  }

  userPrompt += `

【目标产物要求】
${buildOwnedMediaOutputInstruction(direction.label)}

请严格按这个结构组织：
1. 标题要有一个鲜明判断或反差，不要只写“发布了什么”
2. 开头用 3-5 个短段完成：场景/类比/问题钩子 + 新闻事实落地；不要用通稿腔开头
3. 中段拆 3-5 个真正变化点或解释变量，每个点都解释“这对谁有什么影响”，不能只罗列事实
4. 用一个独立段落把热点放回账号人设里：AI快讯要回到产品/工具链，全球股市要回到变量/风险，消费时尚要回到品牌/审美/人群
5. 后段解释为什么这次热点重要：它改变的是能力、成本、盘面变量、品牌策略、消费情绪还是竞争逻辑
6. 结尾给“接下来该看什么”，并收束成一句明确判断

写作硬约束：
- 文章必须先确立一个核心隐喻、核心变量或核心判断。全文围绕它推进，不能散成材料拼贴。
- 至少写出 3 个具体变化点或可感知影响
- 至少做 2 次显性来源归因
- 至少写 1 个“账号人设段落”：用本账号的固定视角解释为什么这条新闻值得写，而不是任何账号都能发
- 至少写 1 个“反直觉判断”：指出读者第一眼可能误解的地方，再给出更准确的解释
- 不要用“更强”“更高级”“更有潜力”这类空词替代具体变化
- 每个变化点后面至少补 1 句读者能直接感知到的结果，例如成本感受、使用体验、盘面风险、产品选择、审美变化或后续观察点
- 如果素材没有给具体百分比，就不要编数字；但也不能停留在抽象判断，必须把变化改写成可感知的体验描述
- 不要把整篇写成媒体综述，正文必须像一篇可直接发布的头条号主稿
- 段落要短，允许连续短段制造节奏，但不能牺牲信息密度
- 文章必须有 3-6 句明确判断句，例如“真正的变化不是 X，而是 Y”
- 至少写出 2 个“人话翻译”段落：把专业概念、市场变量、品牌动作或消费趋势翻译成现实里的例子。
- 至少保留 1 个“作者判断”段落：不是复述来源，而是说明你如何理解这件事。
- 避免机械小标题堆叠。可以不用小标题；如果必须用小标题，也要像文章自然转场，而不是“第一、第二、第三”。
- 禁止连续三段都使用“这意味着 / 从这个角度看 / 对于普通用户而言 / 总的来说”这类 AI 式转接。
- 如果素材不足以支撑强结论，要主动写成“这件事现在最值得观察的是……”，不要强行下定论
- full_text 必须是完整长文，不要只把 opening/body/closing 简单压缩成摘要
- full_text 目标 1900-2300 中文字，结构完整，不能输出 800-1200 字的短评

不要使用以下表达：
${[
  ...direction.forbiddenPhrases,
  "毫无预警",
  "值得注意的是",
  "不难发现",
  "总的来说",
  "这意味着",
  "持续发力",
].map((item) => `- ${item}`).join("\n")}

请输出以下 JSON 结构（注意每个字段的字数要求）：
{
  "title": "主标题（清楚说明这次更新最值得关注的点，不要标题党）",
  "opening": "文章开头，3-5 个短段，先建立阅读钩子再落到新闻事实。最少 300 中文字。",
  "body": "主体内容，围绕 3-5 个变化点展开，逻辑连贯，有事实、有解释、有判断。这是文章最长的部分，最少 1200 中文字。",
  "closing": "结尾，说明接下来该看什么，并给出明确收束判断。最少 200 中文字。",
  "full_text": "将 opening、body、closing 完整拼接（用两个换行符分隔），形成可直接发布的完整长文。总字数目标 1900-2300 中文字。不要只复制 opening，必须包含全部三段。",
  "estimated_duration_sec": 300
}

关键：full_text 必须是 opening + body + closing 的完整拼接，不能只输出其中一段。如果 full_text 少于 1500 字，说明你没有完成任务。`;

  return { systemPrompt, userPrompt };
}

export function buildMarsCitizenNarrativePrompt(
  factItems: NewsItemForPrompt[],
  trendItems: TrendItemForPrompt[],
  searchQuery: string,
) {
  return buildOwnedMediaNarrativePrompt(factItems, trendItems, searchQuery, "AI快讯");
}
