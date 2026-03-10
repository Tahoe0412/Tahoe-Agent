export type WritingMode = "BRAND_INTRO" | "PRODUCT_PROMO" | "CAMPAIGN_PROMO" | "RECRUITMENT";

export const writingModeList: WritingMode[] = ["BRAND_INTRO", "PRODUCT_PROMO", "CAMPAIGN_PROMO", "RECRUITMENT"];

export function getWritingMode(input: unknown): WritingMode {
  return writingModeList.includes(input as WritingMode) ? (input as WritingMode) : "PRODUCT_PROMO";
}

export function getWritingModeMeta(mode: WritingMode, locale: "zh" | "en" = "zh") {
  const zh = {
    BRAND_INTRO: {
      label: "品牌介绍稿",
      description: "适合介绍品牌理念、定位、差异化与整体信任感建立。",
    },
    PRODUCT_PROMO: {
      label: "产品宣传稿",
      description: "适合围绕单品、系列产品或核心卖点做商业转化型表达。",
    },
    CAMPAIGN_PROMO: {
      label: "活动推广稿",
      description: "适合新品发布、节日活动、联名活动或阶段性营销推广。",
    },
    RECRUITMENT: {
      label: "招商 / 招募稿",
      description: "适合门店加盟、渠道招商、达人招募、社群招募等内容。",
    },
  } as const;

  const en = {
    BRAND_INTRO: {
      label: "Brand Intro",
      description: "For positioning, belief, and trust-building brand narratives.",
    },
    PRODUCT_PROMO: {
      label: "Product Promo",
      description: "For conversion-oriented messaging around products or product lines.",
    },
    CAMPAIGN_PROMO: {
      label: "Campaign Promo",
      description: "For launches, seasonal campaigns, and event-driven communication.",
    },
    RECRUITMENT: {
      label: "Recruitment",
      description: "For partner recruitment, store expansion, creator recruiting, or community growth.",
    },
  } as const;

  return (locale === "en" ? en : zh)[mode];
}
