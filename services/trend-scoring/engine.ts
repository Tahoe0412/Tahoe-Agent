import type { ContentItem } from "@/types/platform-data";
import { calculateTrendScoreBreakdown, type TrendScoreBreakdown, type TrendScoringWeights } from "@/services/trend-scoring/formulas";

export interface TrendEvidenceItem {
  evidence_key: string;
  platform: ContentItem["platform"];
  external_content_id: string;
  title: string;
  url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  published_at: string;
}

export interface ScoredTrendTopic {
  topic_key: string;
  topic_label: string;
  evidence: TrendEvidenceItem[];
  scores: TrendScoreBreakdown;
  source_platforms: ContentItem["platform"][];
}

function toTopicLabel(topicKey: string) {
  return topicKey
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function deriveTopicKeys(item: ContentItem) {
  const hints = [...item.topic_hints, ...item.keyword_set]
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 3);

  return [...new Set(hints)].slice(0, 3);
}

function buildEvidence(item: ContentItem): TrendEvidenceItem {
  return {
    evidence_key: `${item.platform.toLowerCase()}:${item.external_content_id}`,
    platform: item.platform,
    external_content_id: item.external_content_id,
    title: item.title,
    url: item.url,
    view_count: item.view_count,
    like_count: item.like_count,
    comment_count: item.comment_count,
    share_count: item.share_count,
    published_at: item.published_at,
  };
}

export class TrendScoringEngine {
  constructor(private readonly weights?: TrendScoringWeights) {}

  score(contentItems: ContentItem[]): ScoredTrendTopic[] {
    const grouped = new Map<string, ContentItem[]>();

    for (const item of contentItems) {
      const topicKeys = deriveTopicKeys(item);
      for (const topicKey of topicKeys) {
        const bucket = grouped.get(topicKey) ?? [];
        bucket.push(item);
        grouped.set(topicKey, bucket);
      }
    }

    return [...grouped.entries()]
      .map(([topicKey, items]) => ({
        topic_key: topicKey,
        topic_label: toTopicLabel(topicKey),
        evidence: items
          .slice()
          .sort((left, right) => right.view_count - left.view_count)
          .slice(0, 6)
          .map(buildEvidence),
        scores: calculateTrendScoreBreakdown(items, this.weights),
        source_platforms: [...new Set(items.map((item) => item.platform))],
      }))
      .sort((left, right) => right.scores.total_score - left.scores.total_score);
  }
}
