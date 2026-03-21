export function buildVideoTitlePrompt(params: {
  title: string;
  topicQuery: string;
  contentLineLabel: string;
  scriptText: string;
  locale?: "zh" | "en";
}) {
  const zh = (params.locale ?? "zh") === "zh";

  return {
    systemPrompt: zh
      ? "你是一名资深短视频发行编辑。你的任务不是总结，而是写真正可发布、可点击、可传播的视频标题。输出必须是合法 JSON。"
      : "You are a senior short-video publishing editor. Write clickable, publishable video titles, not summaries. Output valid JSON only.",
    userPrompt: [
      zh ? `项目：${params.title}` : `Project: ${params.title}`,
      zh ? `业务线：${params.contentLineLabel}` : `Business line: ${params.contentLineLabel}`,
      zh ? `主题：${params.topicQuery}` : `Topic: ${params.topicQuery}`,
      "",
      zh ? "参考脚本：" : "Reference script:",
      params.scriptText,
      "",
      zh
        ? "请生成 5 条视频标题，要求：有传播钩子、有区分度、避免空泛总结句，其中至少 2 条带反差或问题感。"
        : "Generate 5 candidate video titles. They should have a hook, feel distinctive, and avoid generic summary wording. At least 2 should use contrast or a question angle.",
    ].join("\n"),
  };
}

export function buildPublishCopyPrompt(params: {
  title: string;
  topicQuery: string;
  scriptText: string;
  videoTitles: string[];
  locale?: "zh" | "en";
}) {
  const zh = (params.locale ?? "zh") === "zh";

  return {
    systemPrompt: zh
      ? "你是一名多平台发布编辑。请把现有脚本整理成真正要发布时会用到的标题、简介、亮点总结和轻 CTA。输出必须是合法 JSON。"
      : "You are a multi-platform publishing editor. Turn the existing script into release-ready titles, descriptions, highlights, and a light CTA. Output valid JSON only.",
    userPrompt: [
      zh ? `项目：${params.title}` : `Project: ${params.title}`,
      zh ? `主题：${params.topicQuery}` : `Topic: ${params.topicQuery}`,
      params.videoTitles.length
        ? `${zh ? "可用标题参考" : "Available title references"}:\n${params.videoTitles.map((item) => `- ${item}`).join("\n")}`
        : "",
      "",
      zh ? "参考脚本：" : "Reference script:",
      params.scriptText,
      "",
      zh
        ? "请输出：主标题、视频简介、3 条发布亮点、1 条发布 CTA，以及适合抖音/小红书的简短导语。"
        : "Output: primary title, video description, 3 release highlights, 1 release CTA, and a short lead-in suitable for Douyin/Xiaohongshu.",
    ].filter(Boolean).join("\n"),
  };
}

export function buildAdCreativePrompt(params: {
  title: string;
  topicQuery: string;
  contextPrompt: string;
  locale?: "zh" | "en";
}) {
  const zh = (params.locale ?? "zh") === "zh";

  return {
    systemPrompt: zh
      ? "你是一名广告创意策略总监。请直接输出可执行的广告创意 brief，不要写成汇报腔。输出必须是合法 JSON。"
      : "You are an advertising creative strategy director. Output an executable ad creative brief, not a consultancy memo. Output valid JSON only.",
    userPrompt: [
      zh ? `项目：${params.title}` : `Project: ${params.title}`,
      zh ? `传播主题：${params.topicQuery}` : `Topic: ${params.topicQuery}`,
      "",
      zh ? "项目上下文：" : "Project context:",
      params.contextPrompt,
      "",
      zh
        ? "优先级规则：如果项目上下文里已经给出事实素材、趋势信号或关键词焦点，先围绕这些内容建立广告创意，不要只围绕主题标题写空泛角度。"
        : "Priority rule: if the project context already includes factual inputs, trend framing, or keyword focus, build the ad creative around those inputs instead of writing generic angles from the topic title alone.",
      "",
      zh
        ? "请输出：核心受众、主打角度、核心钩子、3 条卖点、推荐视觉方向、推荐镜头语气、CTA 方向。"
        : "Output: target audience, lead angle, core hook, 3 selling points, recommended visual direction, recommended shot tone, and CTA direction.",
    ].join("\n"),
  };
}
