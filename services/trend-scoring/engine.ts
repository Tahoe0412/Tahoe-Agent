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

const GENERIC_TOPIC_TOKENS = new Set([
  "a",
  "an",
  "and",
  "article",
  "breakdown",
  "case",
  "content",
  "demo",
  "for",
  "from",
  "guide",
  "hook",
  "how",
  "latest",
  "news",
  "of",
  "on",
  "or",
  "post",
  "result",
  "results",
  "short",
  "shorts",
  "study",
  "the",
  "today",
  "ugc",
  "video",
  "videos",
  "viral",
  "workflow",
  "youtube",
  "x",
  "xiaohongshu",
  "douyin",
  "tiktok",
]);

function isCjk(value: string) {
  return /[\p{Script=Han}]/u.test(value);
}

function tokenize(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .trim();

  if (!normalized) {
    return [];
  }

  if (isCjk(normalized) && !normalized.includes(" ")) {
    return normalized
      .split(/\s+/)
      .flatMap((segment) => segment.split(/(?<=[\p{Script=Han}])/u))
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return normalized
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isGenericToken(token: string) {
  return GENERIC_TOPIC_TOKENS.has(token) || /^\d+$/.test(token) || token.length < 2;
}

function toTopicKey(tokens: string[]) {
  return tokens.join("_").replace(/^_+|_+$/g, "");
}

function cleanKeyToTokens(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !isGenericToken(token));
}

function extractTitlePhrase(item: ContentItem) {
  const tokens = tokenize(item.title).filter((token) => !isGenericToken(token));

  if (tokens.length === 0) {
    return null;
  }

  const preferredLength = Math.min(tokens.length, isCjk(item.title) ? 3 : 4);
  return toTopicKey(tokens.slice(0, Math.max(2, preferredLength)));
}

function extractCandidateKeys(item: ContentItem) {
  const candidates: string[] = [];
  const seen = new Set<string>();

  function push(key: string | null) {
    if (!key) {
      return;
    }

    const cleaned = toTopicKey(cleanKeyToTokens(key));
    if (!cleaned || cleaned.length < 2 || seen.has(cleaned)) {
      return;
    }

    seen.add(cleaned);
    candidates.push(cleaned);
  }

  push(extractTitlePhrase(item));

  for (const source of [...item.topic_hints, ...item.keyword_set]) {
    push(source);
  }

  const normalizedTokens = cleanKeyToTokens(item.normalized_title);
  if (normalizedTokens.length >= 2) {
    push(toTopicKey(normalizedTokens.slice(0, 4)));
  }

  return candidates;
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

function humanizeToken(token: string) {
  if (token.toUpperCase() === "AI") {
    return "AI";
  }

  if (isCjk(token)) {
    return token;
  }

  return token.charAt(0).toUpperCase() + token.slice(1);
}

function toTopicLabel(topicKey: string, evidence: TrendEvidenceItem[]) {
  const titleTokens = evidence.length > 0 ? tokenize(evidence[0].title).filter((token) => !isGenericToken(token)) : [];

  if (titleTokens.length >= 2) {
    return titleTokens.slice(0, Math.min(titleTokens.length, 4)).map(humanizeToken).join(" ");
  }

  return topicKey
    .split("_")
    .filter(Boolean)
    .map(humanizeToken)
    .join(" ");
}

export class TrendScoringEngine {
  constructor(private readonly weights?: TrendScoringWeights) {}

  score(contentItems: ContentItem[]): ScoredTrendTopic[] {
    const grouped = new Map<string, ContentItem[]>();

    for (const item of contentItems) {
      const primaryTopicKey = extractCandidateKeys(item)[0];
      if (!primaryTopicKey) {
        continue;
      }

      const bucket = grouped.get(primaryTopicKey) ?? [];
      bucket.push(item);
      grouped.set(primaryTopicKey, bucket);
    }

    return [...grouped.entries()]
      .map(([topicKey, items]) => {
        const evidence = items
          .slice()
          .sort((left, right) => right.view_count - left.view_count)
          .slice(0, 6)
          .map(buildEvidence);

        return {
          topic_key: topicKey,
          topic_label: toTopicLabel(topicKey, evidence),
          evidence,
          scores: calculateTrendScoreBreakdown(items, this.weights),
          source_platforms: [...new Set(items.map((item) => item.platform))],
        };
      })
      .sort((left, right) => right.scores.total_score - left.scores.total_score);
  }
}
