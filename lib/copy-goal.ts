export type CopyLength = "SHORT" | "STANDARD" | "LONG";
export type UsageScenario =
  | "XIAOHONGSHU_POST"
  | "BRAND_LANDING"
  | "PRODUCT_DETAIL"
  | "CAMPAIGN_LAUNCH"
  | "STORE_PROMOTION"
  | "FOUNDER_IP";

export const copyLengthList: CopyLength[] = ["SHORT", "STANDARD", "LONG"];
export const usageScenarioList: UsageScenario[] = [
  "XIAOHONGSHU_POST",
  "BRAND_LANDING",
  "PRODUCT_DETAIL",
  "CAMPAIGN_LAUNCH",
  "STORE_PROMOTION",
  "FOUNDER_IP",
];

export function getCopyLength(input: unknown): CopyLength {
  return copyLengthList.includes(input as CopyLength) ? (input as CopyLength) : "STANDARD";
}

export function getUsageScenario(input: unknown): UsageScenario {
  return usageScenarioList.includes(input as UsageScenario) ? (input as UsageScenario) : "XIAOHONGSHU_POST";
}

export function getCopyLengthMeta(length: CopyLength, locale: "zh" | "en" = "zh") {
  const zh = {
    SHORT: { label: "短版", description: "适合做首屏摘要、平台正文或轻量传播文案。" },
    STANDARD: { label: "标准版", description: "适合做完整宣传主稿，兼顾信息量和阅读速度。" },
    LONG: { label: "长版", description: "适合官网、品牌页、详细介绍或深度说服内容。" },
  } as const;

  const en = {
    SHORT: { label: "Short", description: "For lightweight platform copy and lead-in summaries." },
    STANDARD: { label: "Standard", description: "For a balanced, publish-ready master draft." },
    LONG: { label: "Long", description: "For detailed landing pages and long-form persuasion." },
  } as const;

  return (locale === "en" ? en : zh)[length];
}

export function getUsageScenarioMeta(scenario: UsageScenario, locale: "zh" | "en" = "zh") {
  const zh = {
    XIAOHONGSHU_POST: { label: "小红书正文", description: "偏可读性、可转发、可共鸣，强调平台传播感。" },
    BRAND_LANDING: { label: "品牌介绍页", description: "适合品牌页、官网页和品牌整体表达。" },
    PRODUCT_DETAIL: { label: "产品详情页", description: "更强调卖点、证明点和购买理由。" },
    CAMPAIGN_LAUNCH: { label: "活动发布", description: "强调时间感、行动感和活动利益点。" },
    STORE_PROMOTION: { label: "门店宣传", description: "强调真实场景、服务细节和到店转化。" },
    FOUNDER_IP: { label: "创始人 / IP 表达", description: "强调第一人称观点、信念和人格化表达。" },
  } as const;

  const en = {
    XIAOHONGSHU_POST: { label: "Xiaohongshu Post", description: "Readable, social, and resonant for feed distribution." },
    BRAND_LANDING: { label: "Brand Landing", description: "For site pages and full brand-expression copy." },
    PRODUCT_DETAIL: { label: "Product Detail", description: "For value points, proof, and purchase motivation." },
    CAMPAIGN_LAUNCH: { label: "Campaign Launch", description: "For urgency, participation, and campaign incentive." },
    STORE_PROMOTION: { label: "Store Promotion", description: "For local trust, service detail, and footfall." },
    FOUNDER_IP: { label: "Founder / IP", description: "For first-person conviction and personality-led narrative." },
  } as const;

  return (locale === "en" ? en : zh)[scenario];
}
