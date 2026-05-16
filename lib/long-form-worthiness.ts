import { getOwnedMediaDirectionConfig, type OwnedMediaEditorialDirection } from "@/lib/owned-media-directions";
import type { NewsSearchItem } from "@/types/news-search";
import type { TopicRankingItem } from "@/types/trend-discovery";

export type LongFormRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type LongFormWorthiness = {
  score: number;
  freshnessScore: number;
  heatScore: number;
  evidenceScore: number;
  accountFitScore: number;
  explainabilityScore: number;
  judgmentScore: number;
  visualPotentialScore: number;
  riskControlScore: number;
  riskLevel: LongFormRiskLevel;
  whyNow: string;
  angleHint: string;
  recommendedOutput: "HOT_LONG_FORM" | "SHORT_UPDATE" | "SKIP";
  strengths: string[];
  cautions: string[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeFragments(value: string) {
  return value
    .toLowerCase()
    .split(/[\s/、，,·\-–—:：()（）"'“”‘’]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function parseTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function countMatches(haystack: string, needles: string[]) {
  const normalized = haystack.toLowerCase();
  return needles.filter((needle) => normalized.includes(needle.toLowerCase())).length;
}

function getMatchedNews(topic: TopicRankingItem, newsItems: NewsSearchItem[]) {
  const fragments = normalizeFragments(topic.label);
  return newsItems.filter((item) => {
    const haystack = `${item.title} ${item.snippet}`;
    return haystack.toLowerCase().includes(topic.label.toLowerCase()) || fragments.some((fragment) => haystack.toLowerCase().includes(fragment));
  });
}

function scoreFreshness(newsItems: NewsSearchItem[], now = Date.now()) {
  const times = newsItems.map((item) => parseTime(item.published_at)).filter((time): time is number => time !== null);
  if (times.length === 0) {
    return 48;
  }
  const newestHours = Math.max(0, (now - Math.max(...times)) / 3_600_000);
  if (newestHours <= 12) return 100;
  if (newestHours <= 36) return 84;
  if (newestHours <= 72) return 66;
  if (newestHours <= 168) return 44;
  return 24;
}

function scoreEvidence(topic: TopicRankingItem, matchedNewsCount: number) {
  return clampScore(topic.evidenceCount * 14 + matchedNewsCount * 18);
}

function scoreRiskControl(direction: OwnedMediaEditorialDirection, text: string) {
  const config = getOwnedMediaDirectionConfig(direction);
  const forbiddenHits = countMatches(text, config.forbiddenPhrases);
  const rumorHits = countMatches(text, ["传闻", "爆料", "网传", "未经证实", "内幕"]);
  const adviceHits = direction === "全球股市" ? countMatches(text, ["买入", "卖出", "抄底", "满仓", "目标价"]) : 0;
  return clampScore(94 - forbiddenHits * 18 - rumorHits * 12 - adviceHits * 18);
}

function scoreExplainability(direction: OwnedMediaEditorialDirection, text: string) {
  if (direction === "AI快讯") {
    return clampScore(42 + countMatches(text, ["发布", "模型", "能力", "价格", "开源", "Agent", "API", "用户", "开发者"]) * 8);
  }
  if (direction === "全球股市") {
    return clampScore(38 + countMatches(text, ["利率", "通胀", "财报", "指引", "资金", "美元", "美联储", "风险", "估值", "盈利"]) * 8);
  }
  return clampScore(38 + countMatches(text, ["品牌", "新品", "联名", "秀场", "审美", "人群", "渠道", "价格", "消费", "产品"]) * 8);
}

function scoreVisualPotential(direction: OwnedMediaEditorialDirection, text: string) {
  if (direction === "AI快讯") {
    return clampScore(45 + countMatches(text, ["界面", "产品", "模型", "对比", "工作流", "图表", "发布"]) * 7);
  }
  if (direction === "全球股市") {
    return clampScore(48 + countMatches(text, ["指数", "走势", "财报", "美元", "利率", "图表", "板块"]) * 7);
  }
  return clampScore(52 + countMatches(text, ["秀场", "新品", "穿搭", "妆容", "包装", "门店", "大片", "联名", "颜色"]) * 7);
}

export function scoreTopicForLongForm(
  topic: TopicRankingItem,
  newsItems: NewsSearchItem[],
  direction: OwnedMediaEditorialDirection,
): LongFormWorthiness {
  const config = getOwnedMediaDirectionConfig(direction);
  const matchedNews = getMatchedNews(topic, newsItems);
  const text = [
    topic.label,
    ...topic.topEvidence.map((item) => item.title),
    ...matchedNews.map((item) => `${item.title} ${item.snippet}`),
  ].join("\n");

  const freshnessScore = scoreFreshness(matchedNews.length > 0 ? matchedNews : newsItems);
  const heatScore = clampScore(topic.score);
  const evidenceScore = scoreEvidence(topic, matchedNews.length);
  const accountFitScore = clampScore(34 + countMatches(text, config.keywordHints) * 10);
  const explainabilityScore = scoreExplainability(direction, text);
  const judgmentScore = clampScore((accountFitScore + explainabilityScore + evidenceScore) / 3 + (topic.heatLevel === "HOT" ? 8 : 0));
  const visualPotentialScore = scoreVisualPotential(direction, text);
  const riskControlScore = scoreRiskControl(direction, text);

  const score = clampScore(
    freshnessScore * 0.14 +
      heatScore * 0.16 +
      evidenceScore * 0.18 +
      accountFitScore * 0.18 +
      explainabilityScore * 0.14 +
      judgmentScore * 0.1 +
      visualPotentialScore * 0.06 +
      riskControlScore * 0.04,
  );
  const riskLevel: LongFormRiskLevel = riskControlScore < 58 ? "HIGH" : riskControlScore < 76 ? "MEDIUM" : "LOW";
  const recommendedOutput = score >= 72 && riskLevel !== "HIGH" ? "HOT_LONG_FORM" : score >= 54 ? "SHORT_UPDATE" : "SKIP";

  const strengths = [
    freshnessScore >= 76 ? "素材新鲜" : "",
    evidenceScore >= 70 ? "证据密度足够" : "",
    accountFitScore >= 70 ? "账号适配度高" : "",
    explainabilityScore >= 70 ? "有清晰解释变量" : "",
    visualPotentialScore >= 72 ? "适合配图表达" : "",
  ].filter(Boolean);
  const cautions = [
    evidenceScore < 50 ? "证据偏少，写长文前需要补来源" : "",
    riskLevel !== "LOW" ? "存在表达风险，需要保留事实边界" : "",
    accountFitScore < 52 ? "账号适配一般，可能更适合换 lane" : "",
  ].filter(Boolean);

  return {
    score,
    freshnessScore,
    heatScore,
    evidenceScore,
    accountFitScore,
    explainabilityScore,
    judgmentScore,
    visualPotentialScore,
    riskControlScore,
    riskLevel,
    whyNow: `现在值得看，因为它同时具备${strengths.slice(0, 2).join("、") || "一定讨论度"}。`,
    angleHint: `${config.coreQuestion} 用「${topic.label}」回答这个问题，先写事实，再写变量和判断。`,
    recommendedOutput,
    strengths,
    cautions,
  };
}
