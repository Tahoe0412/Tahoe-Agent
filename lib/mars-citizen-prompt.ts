import { buildOutputSpecificVisualInstruction } from "@/lib/visual-generation-prompt";

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

export function buildMarsCitizenNarrativePrompt(
  factItems: NewsItemForPrompt[],
  trendItems: TrendItemForPrompt[],
  searchQuery: string,
) {
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

  const systemPrompt = `你是「火星公民 / AI快讯」的头条号长文主编。你的任务不是写一段科技新闻摘要，而是把多条科技新闻整合成一篇可以直接发布的中文图文主稿。
你的读者想知道：今天发生了什么、它真正改变了什么、为什么和普通人有关、接下来该看什么。

风格要求：
- 叙事视角：有判断力的科技专栏作者，不是发布会转述员，也不是营销号
- 语气：有钩子、有解释、有节奏，但事实边界克制
- 第一屏：可以用类比、反问或场景切入，但必须在 3-5 个短段内交代清楚新闻事实
- 主体：拆成 3-5 个真正变化点，优先写功能变化、能力变化、效率变化、成本变化、行业意义
- 主体：每个变化点都要落到“普通用户、开发者、内容工作者或企业能感知到什么”，不能只写行业总结
- 收尾：要有明确判断句，最好能留下 1-2 句可截图、可转述的话
- 语言：中文头条号长图文语言，段落短，节奏清楚，适合手机阅读
- 篇幅：默认写 1800-2600 个中文字；如果素材不足，也不能低于 1200 字，而要把“不确定 / 还要观察”的边界写清楚
- 不要添加任何注释或格式标记（如 [画面] [BGM] 等）
- 事实素材是脚本主体依据，必须准确引用
- 正文里至少出现 2-3 次明确来源归因，例如“OpenAI 表示… / The Verge 提到… / 财联社援引第三方指标称…”
- 所有判断都必须能在给定素材里找到支撑，不要把标题党表述写进正文
- 选题参考只用于调整角度和叙事框架，不作为事实引用
- 不要把稿件写成“王炸 / 颠覆 / 毫无预警 / 直指超级应用”这类营销腔
- 如果素材里没有明确 benchmark、价格或性能数字，就不要自行补数字
- 每一段都要能回答一个实际问题，避免空泛总结
- 不要写成清单式短答。可以分段，但正文必须像一篇完整文章，有起承转合。`;

  let userPrompt = `基于以下关于「${searchQuery}」的素材，为「火星公民 / AI快讯」撰写一篇头条号科技快讯主稿。

【事实素材 — 请基于这些内容撰写主体，确保事实准确】
${factBlock}`;

  if (trendBlock) {
    userPrompt += `

【选题参考 — 以下是行业创作者近期关注方向，参考调整视频角度和叙事框架，不要直接引用为事实】
${trendBlock}`;
  }

  userPrompt += `

【目标产物要求】
${buildOutputSpecificVisualInstruction("NARRATIVE_SCRIPT", "MARS_CITIZEN")}

请严格按这个结构组织：
1. 标题要有一个鲜明判断或反差，不要只写“发布了什么”
2. 开头用 3-5 个短段完成：场景/类比/问题钩子 + 新闻事实落地
3. 中段拆 3-5 个真正变化点，每个变化点都解释“这对谁有什么影响”
4. 后段解释为什么这次更新重要：它改变的是参数、成本、工具链、工作方式，还是行业竞争逻辑
5. 结尾给“接下来该看什么”，并收束成一句明确判断

写作硬约束：
- 至少写出 3 个具体变化点或可感知影响
- 至少做 2 次显性来源归因
- 如果素材提到“同等 token 更智能 / token 总消耗下降 / 更会编程 / 更会使用计算机 / 向付费用户开放”等点，优先使用这些具体变化
- 不要用“更强”“更智能”这类空词替代具体变化
- 每个变化点后面至少补 1 句“普通用户能直接感知到的结果”，例如成本感受、响应感受、代码/数学任务体验、是否已经能用
- 如果素材没有给具体百分比，就不要编数字；但也不能停留在抽象判断，必须把变化改写成可感知的体验描述
- 不要把整篇写成媒体综述，正文必须像一篇可直接发布的头条号主稿
- 段落要短，允许连续短段制造节奏，但不能牺牲信息密度
- 文章必须有 3-6 句明确判断句，例如“真正的变化不是 X，而是 Y”
- 如果素材不足以支撑强结论，要主动写成“这件事现在最值得观察的是……”，不要强行下定论
- full_text 必须是完整长文，不要只把 opening/body/closing 简单压缩成摘要

不要使用以下表达：
- 王炸
- 毫无预警
- 无所不能
- 彻底颠覆
- 直指超级应用
- 你准备好了吗

请输出以下 JSON 结构：
{
  "title": "主标题（清楚说明这次更新最值得关注的点，不要标题党）",
  "opening": "文章开头，3-5 个短段，先建立阅读钩子，再落到新闻事实",
  "body": "主体内容，围绕 3-5 个变化点展开，逻辑连贯，有事实、有解释、有判断",
  "closing": "结尾，说明接下来该看什么，并给出明确收束判断",
  "full_text": "完整长文主稿，1800-2600 中文字，可直接作为头条号图文主稿初版",
  "estimated_duration_sec": 300
}`;

  return { systemPrompt, userPrompt };
}
