import type { ContentLine, OutputType } from "@/lib/content-line";

export function buildOutputTypeCopyInstruction(
  contentLine: ContentLine,
  outputType: OutputType,
  locale: "zh" | "en" = "zh",
) {
  const zh = {
    NARRATIVE_SCRIPT: "目标产物：头条号长图文主稿。需要有鲜明判断、事实支撑、普通读者能理解的解释，以及适合手机阅读的短段落节奏。",
    STORYBOARD_SCRIPT: "目标产物：分镜脚本。语言要天然适合拆成镜头、画面和动作，不要写成大段散文。",
    VIDEO_TITLE: "目标产物：视频标题。优先写传播钩子、反差感和科技感，不要写成普通摘要句。",
    VIDEO_DESCRIPTION: "目标产物：视频简介。要兼顾信息交代、发布说明和轻 CTA。",
    PUBLISH_COPY: "目标产物：多平台发布文案。要突出标题、导语、亮点总结和发布时的 CTA。",
    PLATFORM_COPY: "目标产物：平台文案。像真实要发在小红书 / 抖音上的正文，标题、开头和正文都要可直接使用。",
    AD_SCRIPT: "目标产物：广告脚本。每段都要服务转化，并天然适合后续拆成 AI 广告镜头。",
    AD_STORYBOARD: "目标产物：广告分镜。每个镜头都要有明确卖点动作、情绪和转化作用。",
    AD_CREATIVE: "目标产物：广告创意。重点是角度、受众、钩子、卖点结构和可执行创意方向。",
  } as const;

  const en = {
    NARRATIVE_SCRIPT: "Target output: Toutiao-first long-form article draft. It needs a clear judgment, factual grounding, reader-facing interpretation, and short mobile-friendly paragraphs.",
    STORYBOARD_SCRIPT: "Target output: storyboard script. Language should split naturally into shots, visuals, and actions.",
    VIDEO_TITLE: "Target output: video title. Favor hook, contrast, and science intrigue over generic summary wording.",
    VIDEO_DESCRIPTION: "Target output: video description. Balance context, publish framing, and a light CTA.",
    PUBLISH_COPY: "Target output: multi-platform publish copy. Emphasize title, lead-in, key highlights, and release CTA.",
    PLATFORM_COPY: "Target output: platform copy. It should read like a real post ready for Xiaohongshu or Douyin.",
    AD_SCRIPT: "Target output: ad script. Every section should support conversion and be easy to split into AI ad shots later.",
    AD_STORYBOARD: "Target output: ad storyboard. Every shot must carry a clear selling action, emotional beat, or conversion role.",
    AD_CREATIVE: "Target output: ad creative. Prioritize angle, audience, hook, selling structure, and executable concepts.",
  } as const;

  return (locale === "en" ? en : zh)[outputType];
}
