export type StyleTemplate =
  | "RATIONAL_PRO"
  | "WARM_HEALING"
  | "LIGHT_LUXURY"
  | "RESTRAINED_SPATIAL"
  | "HIGH_CONVERSION"
  | "FOUNDER_VOICE"
  | "STORE_TRUST";

export const styleTemplateList: StyleTemplate[] = [
  "RATIONAL_PRO",
  "WARM_HEALING",
  "LIGHT_LUXURY",
  "RESTRAINED_SPATIAL",
  "HIGH_CONVERSION",
  "FOUNDER_VOICE",
  "STORE_TRUST",
];

export function getStyleTemplate(input: unknown): StyleTemplate {
  return styleTemplateList.includes(input as StyleTemplate) ? (input as StyleTemplate) : "RATIONAL_PRO";
}

export function getStyleTemplateMeta(style: StyleTemplate, locale: "zh" | "en" = "zh") {
  const zh = {
    RATIONAL_PRO: {
      label: "理性专业",
      description: "强调逻辑、证据、清晰表达，适合品牌介绍和专业产品沟通。",
    },
    WARM_HEALING: {
      label: "温暖疗愈",
      description: "强调陪伴、情绪价值和生活感，适合健康、生活方式与情绪类内容。",
    },
    LIGHT_LUXURY: {
      label: "轻奢高级",
      description: "强调审美、质感和克制表达，适合品牌调性型传播。",
    },
    RESTRAINED_SPATIAL: {
      label: "克制叙事 / 空间感品牌文案",
      description: "强调城市观察、材料细节、空间叙事与含蓄表达，适合高端品牌与门店空间内容。",
    },
    HIGH_CONVERSION: {
      label: "高转化卖点型",
      description: "强调痛点、卖点、利益点和行动引导，适合推广和带转化内容。",
    },
    FOUNDER_VOICE: {
      label: "创始人口吻",
      description: "强调真实观点、第一人称和价值主张，适合品牌故事与个人 IP。",
    },
    STORE_TRUST: {
      label: "门店信任型",
      description: "强调真实场景、服务细节、口碑与信任建立，适合本地和门店类业务。",
    },
  } as const;

  const en = {
    RATIONAL_PRO: {
      label: "Rational Pro",
      description: "Clear, evidence-led, and structured.",
    },
    WARM_HEALING: {
      label: "Warm Healing",
      description: "Soft, companion-like, and emotionally reassuring.",
    },
    LIGHT_LUXURY: {
      label: "Light Luxury",
      description: "Refined, restrained, and premium in tone.",
    },
    RESTRAINED_SPATIAL: {
      label: "Restrained Spatial Narrative",
      description: "Observational, material-rich, and spatially aware brand storytelling.",
    },
    HIGH_CONVERSION: {
      label: "High Conversion",
      description: "Pain point, value, urgency, and CTA focused.",
    },
    FOUNDER_VOICE: {
      label: "Founder Voice",
      description: "First-person, conviction-led, and personal.",
    },
    STORE_TRUST: {
      label: "Store Trust",
      description: "Trust-building, local proof, and service detail oriented.",
    },
  } as const;

  return (locale === "en" ? en : zh)[style];
}
