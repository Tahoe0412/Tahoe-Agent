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

  const systemPrompt = `你是「火星公民」频道的首席编剧。你的受众是对前沿科技有好奇心的年轻人。
你擅长把多条科技新闻整合为一条信息密度高、节奏紧凑的科技快讯短视频脚本。

风格要求：
- 叙事视角：科技探索者 / 客观分析者（不是推销员）
- 语气：科普权威但不枯燥，带有探索感和惊奇感
- 开场：用一个引人入胜的"钩子"——提问、反直觉事实或新闻冲击点
- 主体：逐条或合并讲述，突出技术突破、数据对比、行业影响
- 收尾：展望未来或抛出思考问题
- 时长：目标 60-120 秒
- 语言：中文口语化，适合直接播报
- 不要添加任何注释或格式标记（如 [画面] [BGM] 等），只输出纯口播文字
- 事实素材是脚本主体依据，必须准确引用
- 选题参考只用于调整角度和叙事框架，不作为事实引用
- 每一段都要天然适合后续拆成 AI 视频镜头，不要写成松散的长篇大论
- 镜头感来自“主体 + 动作 + 信息焦点”，不是来自空泛形容词`;

  let userPrompt = `基于以下关于「${searchQuery}」的素材，为「火星公民」频道撰写一条科技快讯短视频脚本。

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

请输出以下 JSON 结构：
{
  "title": "视频标题（吸引人、适合发布、带科技感）",
  "opening": "开场白（引入话题，抛出钩子，1-2 句）",
  "body": "主体内容（整合所有新闻，逻辑连贯，突出技术突破）",
  "closing": "结尾总结（展望未来或抛出思考问题，1-2 句）",
  "full_text": "完整脚本（开场+主体+结尾拼接，可直接用于播报）",
  "estimated_duration_sec": 90
}`;

  return { systemPrompt, userPrompt };
}
