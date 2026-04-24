import { buildOutputSpecificVisualInstruction } from "@/lib/visual-generation-prompt";

/**
 * LLM prompt template for Mars Citizen (火星公民) science narrative script.
 * Generates a science news / deep-dive short-video script with an authoritative,
 * exploratory tone suitable for tech news, robotics, and Mars colonization topics.
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

  const systemPrompt = `你是「火星公民 / AI快讯」的主稿编辑。你的任务是把多条科技新闻整合成一篇适合头条号发布的高信息密度科技快讯主稿。
你的读者想快速知道：今天发生了什么、真正变化点是什么、为什么值得关注。

风格要求：
- 叙事视角：客观分析者 / 科技编辑（不是推销员）
- 语气：快、准、克制，先给事实，再给判断
- 开头：第一句直接交代“今天发生了什么”，不要先用夸张设问
- 主体：拆成 2-4 个真正变化点，优先写功能变化、能力变化、效率变化、成本变化、行业意义
- 主体：每个变化点都要落到“普通用户能感知到什么”，不能只写行业总结
- 收尾：一句判断或“接下来该看什么”，不要空泛抒情
- 语言：中文图文主稿语言，适合头条号阅读，也适合后续拆成口播
- 不要添加任何注释或格式标记（如 [画面] [BGM] 等）
- 事实素材是脚本主体依据，必须准确引用
- 正文里至少出现 2-3 次明确来源归因，例如“OpenAI 表示… / The Verge 提到… / 财联社援引第三方指标称…”
- 所有判断都必须能在给定素材里找到支撑，不要把标题党表述写进正文
- 选题参考只用于调整角度和叙事框架，不作为事实引用
- 不要把稿件写成“王炸 / 颠覆 / 毫无预警 / 直指超级应用”这类营销腔
- 如果素材里没有明确 benchmark、价格或性能数字，就不要自行补数字
- 每一段都要能回答一个实际问题，避免空泛总结`;

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
1. 开头一句先交代今天发生了什么
2. 中段拆 2-4 个真正变化点
3. 后段解释为什么这次更新重要
4. 结尾给“接下来该看什么”

写作硬约束：
- 至少写出 3 个具体变化点或可感知影响
- 至少做 2 次显性来源归因
- 如果素材提到“同等 token 更智能 / token 总消耗下降 / 更会编程 / 更会使用计算机 / 向付费用户开放”等点，优先使用这些具体变化
- 不要用“更强”“更智能”这类空词替代具体变化
- 每个变化点后面至少补 1 句“普通用户能直接感知到的结果”，例如成本感受、响应感受、代码/数学任务体验、是否已经能用
- 如果素材没有给具体百分比，就不要编数字；但也不能停留在抽象判断，必须把变化改写成可感知的体验描述
- 不要把整篇写成媒体综述，正文必须像一篇可直接发布的头条号主稿

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
  "opening": "开头 1-2 句，直接说清今天发生了什么",
  "body": "主体内容（围绕 2-4 个变化点展开，逻辑连贯，有判断）",
  "closing": "结尾 1-2 句，说明接下来该看什么或这件事为什么重要",
  "full_text": "完整主稿（开头+主体+结尾拼接，可直接作为头条号主稿初版）",
  "estimated_duration_sec": 90
}`;

  return { systemPrompt, userPrompt };
}
