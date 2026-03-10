import type { ContentItem, ProductionClass, SupportedPlatform } from "@/types/platform-data";

export interface TrendScoreBreakdown {
  total_score: number;
  reach_score: number;
  engagement_score: number;
  velocity_score: number;
  cross_platform_score: number;
  ai_producibility_score: number;
  brand_fit_score: number;
}

export interface TrendScoringWeights {
  reach: number;
  engagement: number;
  velocity: number;
  cross_platform: number;
  ai_producibility: number;
  brand_fit: number;
}

export const defaultTrendScoringWeights: TrendScoringWeights = {
  reach: 0.24,
  engagement: 0.19,
  velocity: 0.17,
  cross_platform: 0.14,
  ai_producibility: 0.14,
  brand_fit: 0.12,
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countUniquePlatforms(items: ContentItem[]) {
  return new Set<SupportedPlatform>(items.map((item) => item.platform)).size;
}

function calcEngagementRate(item: ContentItem) {
  const denominator = Math.max(item.view_count, 1);
  return (item.like_count + item.comment_count * 2 + item.share_count * 3) / denominator;
}

function hoursSincePublished(item: ContentItem) {
  const publishedAt = new Date(item.published_at).getTime();
  const now = Date.now();
  return Math.max((now - publishedAt) / (1000 * 60 * 60), 1);
}

function productionEaseScore(productionClass: ProductionClass) {
  switch (productionClass) {
    case "UGC":
      return 92;
    case "SCREEN_CAPTURE":
      return 88;
    case "HYBRID":
      return 78;
    case "ANIMATION":
      return 64;
    case "STUDIO":
      return 58;
    default:
      return 60;
  }
}

export function calculateReachScore(items: ContentItem[]) {
  const totalViews = items.reduce((sum, item) => sum + item.view_count, 0);
  return clampScore(Math.log10(totalViews + 1) * 18);
}

export function calculateEngagementScore(items: ContentItem[]) {
  const weightedRate = average(items.map(calcEngagementRate));
  return clampScore(weightedRate * 260);
}

export function calculateVelocityScore(items: ContentItem[]) {
  const averageVelocity = average(items.map((item) => item.view_count / hoursSincePublished(item)));
  return clampScore(Math.log10(averageVelocity + 1) * 22);
}

export function calculateCrossPlatformScore(items: ContentItem[]) {
  return clampScore((countUniquePlatforms(items) / 3) * 100);
}

export function calculateAiProducibilityScore(items: ContentItem[]) {
  const avgProductionEase = average(items.map((item) => productionEaseScore(item.production_class)));
  const shortFormBonus = average(items.map((item) => (item.content_type === "SHORT_VIDEO" || item.content_type === "POST" ? 12 : 0)));
  const hintBonus = average(items.map((item) => Math.min(item.ai_producibility_hints.length * 4, 12)));
  return clampScore(avgProductionEase * 0.72 + shortFormBonus + hintBonus);
}

export function calculateBrandFitScore(items: ContentItem[]) {
  const positiveSignals = average(
    items.map((item) => {
      const normalized = `${item.normalized_title} ${item.keyword_set.join(" ")}`;
      let score = 50;

      if (normalized.includes("case_study") || normalized.includes("workflow")) {
        score += 18;
      }
      if (normalized.includes("result_first") || normalized.includes("hook")) {
        score += 14;
      }
      if (normalized.includes("drama") || normalized.includes("prank")) {
        score -= 12;
      }

      return score;
    }),
  );

  return clampScore(positiveSignals);
}

export function calculateTotalScore(
  breakdown: Omit<TrendScoreBreakdown, "total_score">,
  weights: TrendScoringWeights = defaultTrendScoringWeights,
) {
  return clampScore(
    breakdown.reach_score * weights.reach +
      breakdown.engagement_score * weights.engagement +
      breakdown.velocity_score * weights.velocity +
      breakdown.cross_platform_score * weights.cross_platform +
      breakdown.ai_producibility_score * weights.ai_producibility +
      breakdown.brand_fit_score * weights.brand_fit,
  );
}

export function calculateTrendScoreBreakdown(
  items: ContentItem[],
  weights: TrendScoringWeights = defaultTrendScoringWeights,
): TrendScoreBreakdown {
  const breakdown = {
    reach_score: calculateReachScore(items),
    engagement_score: calculateEngagementScore(items),
    velocity_score: calculateVelocityScore(items),
    cross_platform_score: calculateCrossPlatformScore(items),
    ai_producibility_score: calculateAiProducibilityScore(items),
    brand_fit_score: calculateBrandFitScore(items),
  };

  return {
    ...breakdown,
    total_score: calculateTotalScore(breakdown, weights),
  };
}
