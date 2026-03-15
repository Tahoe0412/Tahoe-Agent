import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TrendScoringEngine } from "../services/trend-scoring/engine";
import {
  calculateAiProducibilityScore,
  calculateCrossPlatformScore,
  calculateTrendScoreBreakdown,
} from "../services/trend-scoring/formulas";
import type { ContentItem } from "../types/platform-data";

function makeItem(overrides: Partial<ContentItem>): ContentItem {
  return {
    platform: "YOUTUBE",
    external_content_id: "item_1",
    content_type: "SHORT_VIDEO",
    production_class: "UGC",
    title: "AI workflow result first hook",
    normalized_title: "ai_workflow_result_first_hook",
    url: "https://example.com/item_1",
    published_at: "2026-03-08T08:00:00.000Z",
    view_count: 100000,
    like_count: 8000,
    comment_count: 800,
    share_count: 1200,
    keyword_set: ["ai_workflow", "result_first_hook"],
    topic_hints: ["ai_workflow", "result_first_hook"],
    ai_producibility_hints: ["talking_head", "subtitle"],
    ...overrides,
  };
}

describe("trend scoring formulas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("raises cross platform score when the same topic appears on more platforms", () => {
    const singlePlatform = [makeItem({ platform: "YOUTUBE" })];
    const multiPlatform = [
      makeItem({ platform: "YOUTUBE" }),
      makeItem({ platform: "X", external_content_id: "item_2", content_type: "POST", production_class: "SCREEN_CAPTURE" }),
      makeItem({ platform: "TIKTOK", external_content_id: "item_3" }),
    ];

    expect(calculateCrossPlatformScore(singlePlatform)).toBeLessThan(calculateCrossPlatformScore(multiPlatform));
  });

  it("gives higher AI producibility score to UGC and screen capture than studio-heavy content", () => {
    const easier = [
      makeItem({ production_class: "UGC" }),
      makeItem({ production_class: "SCREEN_CAPTURE", external_content_id: "item_2", content_type: "POST" }),
    ];
    const harder = [
      makeItem({ production_class: "STUDIO" }),
      makeItem({ production_class: "ANIMATION", external_content_id: "item_3", ai_producibility_hints: [] }),
    ];

    expect(calculateAiProducibilityScore(easier)).toBeGreaterThan(calculateAiProducibilityScore(harder));
  });

  it("keeps total score within range and emits evidence for the grouped topic", () => {
    const engine = new TrendScoringEngine();
    const topics = engine.score([
      makeItem({ platform: "YOUTUBE" }),
      makeItem({ platform: "TIKTOK", external_content_id: "item_2", published_at: "2026-03-08T10:00:00.000Z" }),
      makeItem({ platform: "X", external_content_id: "item_3", content_type: "POST", production_class: "SCREEN_CAPTURE" }),
    ]);

    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].evidence.length).toBeGreaterThan(0);
    expect(topics[0].scores.total_score).toBeGreaterThanOrEqual(0);
    expect(topics[0].scores.total_score).toBeLessThanOrEqual(100);
  });

  it("prefers meaningful topic labels over generic hook or workflow placeholders", () => {
    const engine = new TrendScoringEngine();
    const topics = engine.score([
      makeItem({
        title: "火星公民 茶饮 慢生活观察",
        normalized_title: "火星公民_茶饮_慢生活_观察",
        keyword_set: ["result_first_hook", "ugc", "youtube"],
        topic_hints: ["result_first_hook", "ugc_workflow"],
      }),
      makeItem({
        external_content_id: "item_2",
        platform: "X",
        content_type: "POST",
        production_class: "SCREEN_CAPTURE",
        title: "火星公民 茶饮 慢生活门店体验",
        normalized_title: "火星公民_茶饮_慢生活_门店_体验",
        keyword_set: ["result_first_hook", "ugc", "x"],
        topic_hints: ["result_first_hook", "ugc_workflow"],
      }),
    ]);

    expect(topics[0]?.topic_key).not.toBe("result_first_hook");
    expect(topics[0]?.topic_key).not.toBe("ugc_workflow");
    expect(topics[0]?.topic_label).toContain("火星公民");
  });

  it("produces interpretable sub-scores for a single topic bucket", () => {
    const breakdown = calculateTrendScoreBreakdown([
      makeItem({}),
      makeItem({ external_content_id: "item_2", published_at: "2026-03-08T11:00:00.000Z", view_count: 160000 }),
    ]);

    expect(breakdown.reach_score).toBeGreaterThan(0);
    expect(breakdown.engagement_score).toBeGreaterThan(0);
    expect(breakdown.velocity_score).toBeGreaterThan(0);
    expect(breakdown.total_score).toBeGreaterThan(0);
  });
});
