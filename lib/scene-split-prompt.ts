import type { ScriptRewriteOutput } from "@/schemas/script-production";

/**
 * Build prompts for splitting a full script into ScriptScene units.
 *
 * The output schema is the same as script-rewriter (ScriptRewriteOutput):
 * `{ scenes: ScriptSceneOutput[] }`
 */
export function buildSceneSplitPrompt(input: {
  fullText: string;
  title: string;
  newsCount?: number;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = [
    "你是一个专业的短视频脚本分镜师。",
    "你的任务是把一份完整的视频口播脚本拆分成多个独立的 ScriptScene（场景单元），每个 scene 是一段连贯的拍摄/画面单元。",
    "",
    "输出格式必须是严格 JSON，结构为 { scenes: [...] }。",
    "",
    "每个 scene 必须包含：",
    "- scene_order: 整数，从 1 开始递增",
    "- original_text: 该段的原始文本",
    "- rewritten_for_ai: 改写后的 AI 视频制作描述（明确主体、动作、结果，适合 AI 视频生成）",
    `- shot_goal: 该段的拍摄目标（如"建立 Hook"、"展示核心信息"、"引导互动"）`,
    "- duration_sec: 建议时长（秒，通常 5-15 秒）",
    "- continuity_group: 叙事弧标签（如 intro_arc, body_arc_1, body_arc_2, cta_arc）",
    "- visual_priority: 视觉优先元素数组（如 [\"headline_text\", \"news_footage\"]）",
    "- avoid: 应避免的元素数组（如 [\"visual_noise\", \"tiny_text\"]）",
    "",
    "拆分规则：",
    "1. 开场部分独立为 1 个 scene（hook + 引入）",
    "2. 正文每条新闻/论点拆为 1-2 个 scene",
    "3. 结尾独立为 1 个 scene（总结 + CTA）",
    "4. 总 scene 数量控制在 4-10 个之间",
    "5. 每个 scene 的 original_text 必须是原文的精确片段或合理组合，不要凭空生成新内容",
    "6. continuity_group 使用英文下划线格式（intro_arc, body_arc_1 等）",
    "7. rewritten_for_ai 要做到：每段清晰描述画面内容，去除口语化表达，让 AI 视频工具能直接使用",
  ].join("\n");

  const userPrompt = [
    `# 脚本标题：${input.title}`,
    input.newsCount ? `# 整合了 ${input.newsCount} 条新闻` : "",
    "",
    "请将以下完整脚本拆分为独立的 scene 单元：",
    "",
    "---",
    input.fullText,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  return { systemPrompt, userPrompt };
}

/** Type alias — output shape is same as script-rewriter */
export type SceneSplitOutput = ScriptRewriteOutput;
