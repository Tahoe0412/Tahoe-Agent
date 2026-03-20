import { buildVisualModelGuidance } from "@/lib/visual-generation-prompt";

interface MarsCitizenStoryboardSeedPromptInput {
  title: string;
  topicQuery: string;
  projectIntroduction?: string | null;
  coreIdea?: string | null;
}

interface MarketingStoryboardSeedPromptInput {
  title: string;
  topicQuery: string;
  contextPrompt: string;
}

export function buildMarsCitizenStoryboardSeedPrompt(
  input: MarsCitizenStoryboardSeedPromptInput,
) {
  const contextLines = [
    `项目标题：${input.title}`,
    `核心主题：${input.topicQuery}`,
    input.projectIntroduction ? `项目介绍：${input.projectIntroduction}` : null,
    input.coreIdea ? `核心观点：${input.coreIdea}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `你是「火星公民」频道的分镜策划师。你的任务是在没有完整旁白稿的情况下，直接从科技主题生成一组可执行的 AI 视频 scene。

输出要求：
- 生成 5 到 8 个 scene，覆盖 Hook、关键突破、证据或对比、影响延展、收束结尾
- 每个 scene 都必须适合后续 storyboard / render 继续加工
- original_text 写成简洁的口播提纲，不要写成大段散文
- rewritten_for_ai 写成适合 AI 图片 / 视频生成的镜头说明，必须包含主体、动作、场景、构图、光线、氛围和信息焦点
- shot_goal 必须清楚描述这个 scene 的叙事作用
- continuity_group 使用稳定短 id，例如 intro_arc、breakthrough_arc、proof_arc、future_arc、cta_arc
- visual_priority 和 avoid 只写短标签，不写句子
- 每个 scene 最好天然能拆成 Nano Banana 关键帧 + Seedance / Veo 动态镜头，不要写成无法执行的抽象大场面
- 中文输出，返回合法 JSON`;

  const userPrompt = [
    "请直接为一个科技短视频主题生成 scene 列表，不要等待完整 narrative script。",
    "",
    contextLines,
    "",
    "额外要求：",
    "- 开场 scene 要有强 Hook，适合短视频前 3 秒。",
    "- 中段必须体现事实、机制、数据、产品演示或行业影响中的至少两类。",
    "- 结尾要留下未来判断、思考问题或轻 CTA。",
    "- 画面感要偏前沿科技、机器人、太空、工程演示、数据可视化。",
    "",
    buildVisualModelGuidance(),
  ].join("\n");

  return { systemPrompt, userPrompt };
}

export function buildMarketingStoryboardSeedPrompt(
  input: MarketingStoryboardSeedPromptInput,
) {
  const systemPrompt = `你是商业广告分镜策划师。你的任务是在没有完整广告脚本的情况下，直接从品牌主题和 brief 生成一组可执行的广告 scene。

输出要求：
- 生成 4 到 7 个 scene，整体遵循 Hook、痛点、解决方案、证明、CTA 的广告逻辑
- original_text 写成简洁的口播或字幕提纲
- rewritten_for_ai 写成适合 AI 视频 / 图片生成的镜头说明，包含人物、产品、场景、动作、构图、光线、情绪和卖点焦点
- shot_goal 必须写清这一镜头承担的转化作用
- continuity_group 使用稳定短 id，例如 hook_arc、pain_arc、solution_arc、proof_arc、cta_arc
- visual_priority 和 avoid 只写短标签，不写句子
- 输出必须兼顾品牌表达、平台传播性和商业转化
- 每个镜头都要能自然落到关键帧图像提示词和 4-8 秒动态镜头提示词，不要写成多段拼贴
- 中文输出，返回合法 JSON`;

  const userPrompt = [
    "请直接生成广告 storyboard 的 scene 列表，不要等待完整 ad script。",
    "",
    `项目标题：${input.title}`,
    `传播主题：${input.topicQuery}`,
    "",
    "项目上下文：",
    input.contextPrompt,
    "",
    "额外要求：",
    "- 开场 1 个 scene 必须能在前 3 秒抓住注意力。",
    "- 至少 1 个 scene 展示使用场景或用户痛点。",
    "- 至少 1 个 scene 展示解决方案或产品机制。",
    "- 至少 1 个 scene 提供证明元素，如数据、案例、口碑、结果画面。",
    "- 结尾要有明确 CTA 或转化动作。",
    "",
    buildVisualModelGuidance(),
  ].join("\n");

  return { systemPrompt, userPrompt };
}
