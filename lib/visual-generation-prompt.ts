import type { ContentLine, OutputType } from "@/lib/content-line";

export function buildVisualModelGuidance(locale: "zh" | "en" = "zh") {
  if (locale === "en") {
    return [
      "Target visual model stack:",
      "- Nano Banana 2 / Nano Banana Pro: strongest when each prompt has one clear hero subject, one primary action, one readable environment, and explicit composition / lighting cues. Avoid stacking multiple simultaneous actions in a single frame prompt.",
      "- Seedance 2.0: favors one decisive motion beat per shot. Write movement as short physical actions with stable subject continuity, not abstract montage language.",
      "- Veo 3.1: rewards cinematic continuity, realistic motion, lens-aware framing, and physically plausible environmental details. Keep each shot coherent enough to stand alone for 4-8 seconds.",
      "Universal visual prompting rules:",
      "- Always specify subject, setting, action, camera framing, motion, lighting, mood, and one information focus.",
      "- Prefer concrete nouns and visible behaviors over conceptual slogans.",
      "- Preserve continuity anchors such as outfit, product color, prop, location, or visual motif across adjacent scenes.",
      "- Avoid unreadable tiny text, overloaded UI overlays, chaotic crowding, and contradictory visual instructions.",
    ].join("\n");
  }

  return [
    "目标视觉模型栈：",
    "- Nano Banana 2 / Nano Banana Pro：最适合“单一主角 + 单一核心动作 + 清晰环境 + 明确构图/光线”的提示词。不要在一个镜头里塞太多同时发生的动作。",
    "- Seedance 2.0：更适合一镜一动作的动态镜头。动作描述要短、物理上可执行，主体连续，不要写成抽象蒙太奇。",
    "- Veo 3.1：更看重电影感连续性、真实运动、镜头语言和物理可信度。每个镜头都要足够完整，能独立支撑 4-8 秒。",
    "通用视觉提示词规则：",
    "- 每条提示词都明确写出主体、场景、动作、镜头景别、运动方式、光线氛围和信息焦点。",
    "- 多写看得见的名词和动作，少写抽象口号。",
    "- 相邻 scene 要保留连续性锚点，例如服装、产品颜色、道具、地点或视觉母题。",
    "- 避免小字过多、UI 叠层过重、画面元素拥挤和互相矛盾的指令。",
  ].join("\n");
}

export function buildOutputSpecificVisualInstruction(outputType: OutputType, contentLine: ContentLine) {
  if (outputType === "STORYBOARD_SCRIPT") {
    return contentLine === "MARS_CITIZEN"
      ? "分镜目标：前沿科技短视频。镜头要强调技术主体、机制解释、数据对比、未来影响和可信工程感。"
      : "分镜目标：商业广告视频。镜头要强调人物情绪、使用场景、卖点动作、证明元素和明确转化。";
  }

  if (outputType === "AD_STORYBOARD") {
    return "分镜目标：高转化广告视频。每个镜头都要服务于 Hook、痛点、解决方案、证明或 CTA 之一。";
  }

  if (outputType === "AD_SCRIPT") {
    return "脚本目标：后续要进入 AI 广告镜头生成，因此口播段落要天然适合拆成镜头，不要写成松散长段。";
  }

  if (outputType === "PLATFORM_COPY") {
    return "文案目标：优先服务真实平台发布。标题、开头和正文都要像用户会直接看到和转发的成稿。";
  }

  if (outputType === "PUBLISH_COPY") {
    return "文案目标：服务多平台发布包装。重点是标题、简介、发布时的亮点总结与 CTA。";
  }

  return contentLine === "MARS_CITIZEN"
    ? "输出目标：保持前沿科技内容的可解释性、可视化和发布传播性。"
    : "输出目标：保持商业传播的可读性、可转化性和视觉可生产性。";
}
