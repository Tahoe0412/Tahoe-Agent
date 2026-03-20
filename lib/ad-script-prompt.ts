import { buildOutputSpecificVisualInstruction } from "@/lib/visual-generation-prompt";

/**
 * LLM prompt template for Marketing (商业线) ad script generation.
 * Uses a persuasion-framework structure (hook → pain point → solution → proof → CTA)
 * optimized for commercial video ads and platform posts.
 */

export interface ProductInfoForPrompt {
  title: string;
  snippet: string;
  source: string;
}

export interface BrandContextForPrompt {
  brandName?: string;
  targetAudience?: string;
  tone?: string;
  coreSellingPoints?: string[];
}

export function buildAdScriptPrompt(
  productItems: ProductInfoForPrompt[],
  brandContext: BrandContextForPrompt,
  searchQuery: string,
) {
  const itemBlock = productItems
    .map(
      (item, i) =>
        `${i + 1}. 【${item.source}】${item.title}\n   要点：${item.snippet}`,
    )
    .join("\n\n");

  const brandBlock = [
    brandContext.brandName ? `品牌：${brandContext.brandName}` : null,
    brandContext.targetAudience ? `目标受众：${brandContext.targetAudience}` : null,
    brandContext.tone ? `语气调性：${brandContext.tone}` : null,
    brandContext.coreSellingPoints?.length
      ? `核心卖点：${brandContext.coreSellingPoints.join("、")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `你是一位资深商业广告编剧，擅长为品牌和产品撰写高转化短视频广告脚本。

你的脚本结构必须遵循说服框架（persuasion framework）：
1. Hook — 前 3 秒必须抓住注意力（提问、冲突、痛点场景）
2. Pain Point — 呈现用户的真实困扰
3. Solution — 展示产品/服务如何解决问题
4. Social Proof — 数据、案例或用户证言增强信任
5. CTA — 明确、强力的行动号召

语言要求：
- 中文口语化，适合短视频播报
- 语气由品牌调性参数决定（如有）
- 不要添加画面描述标记（如 [画面] [BGM]），只输出纯口播/文案文字
- 时长目标 30-90 秒
- 每一段都要适合后续拆成广告镜头，不要写成无法分镜的抽象大段`;

  let userPrompt = `基于以下关于「${searchQuery}」的素材和品牌要求，撰写一条商业广告脚本。

【产品/品牌素材】
${itemBlock}`;

  if (brandBlock) {
    userPrompt += `

【品牌上下文】
${brandBlock}`;
  }

  userPrompt += `

【目标产物要求】
${buildOutputSpecificVisualInstruction("AD_SCRIPT", "MARKETING")}

请输出以下 JSON 结构：
{
  "title": "广告标题（吸引人、适合投放）",
  "hook": "前3秒钩子（抓住注意力）",
  "pain_point": "痛点呈现（用户困扰场景）",
  "solution": "解决方案（产品如何解决问题）",
  "social_proof": "信任背书（数据、案例或证言）",
  "cta": "行动号召（明确告诉用户下一步）",
  "full_text": "完整广告脚本（按 hook→pain→solution→proof→CTA 顺序拼接）",
  "estimated_duration_sec": 60
}`;

  return { systemPrompt, userPrompt };
}
