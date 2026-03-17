/**
 * LLM prompt template for generating a "news roundup" short-video script.
 * Fixed style: 新闻盘点 / 热点整合类
 */

export interface NewsItemForPrompt {
  title: string;
  source: string;
  published_at: string;
  snippet: string;
}

export function buildNewsScriptPrompt(items: NewsItemForPrompt[], searchQuery: string) {
  const newsBlock = items
    .map(
      (item, i) =>
        `${i + 1}. 【${item.source}】${item.title}\n   时间：${item.published_at}\n   摘要：${item.snippet}`,
    )
    .join("\n\n");

  const systemPrompt = `你是一位专业的短视频脚本编剧，擅长把多条新闻整合为一条节奏紧凑、信息密度高的新闻盘点短视频脚本。

输出要求：
- 风格：新闻盘点 / 热点整合类（"今天关于 XX 又有几条大新闻"）
- 结构：开场引入 → 逐条/合并讲述 → 总结收尾
- 时长：目标 60-120 秒
- 语言：中文口语化，适合直接播报
- 不要添加任何注释或格式标记（如 [画面] [BGM] 等），只输出纯口播文字`;

  const userPrompt = `基于以下 ${items.length} 条关于"${searchQuery}"的新闻素材，撰写一条短视频新闻盘点脚本。

【新闻素材】
${newsBlock}

请输出以下 JSON 结构：
{
  "title": "视频标题（吸引人、适合发布）",
  "opening": "开场白（引入话题，吸引注意，1-2 句）",
  "body": "主体内容（整合所有新闻，逻辑连贯）",
  "closing": "结尾总结（观点或引导互动，1-2 句）",
  "full_text": "完整脚本（开场+主体+结尾拼接，可直接用于播报）",
  "estimated_duration_sec": 90
}`;

  return { systemPrompt, userPrompt };
}
