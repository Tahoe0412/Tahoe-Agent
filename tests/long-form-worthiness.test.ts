import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { scoreTopicForLongForm } from "@/lib/long-form-worthiness";
import type { NewsSearchItem } from "@/types/news-search";
import type { TopicRankingItem } from "@/types/trend-discovery";

function makeTopic(overrides: Partial<TopicRankingItem> = {}): TopicRankingItem {
  return {
    rank: 1,
    topicKey: "topic_ai",
    label: "OpenAI 新模型发布",
    score: 84,
    heatLevel: "HOT",
    sourcePlatforms: ["X"],
    evidenceCount: 3,
    topEvidence: [
      {
        title: "OpenAI 新模型发布，API 价格和 Agent 能力成为焦点",
        url: "https://example.com/topic",
        platform: "X",
        viewCount: 120000,
      },
    ],
    ...overrides,
  };
}

function makeNews(overrides: Partial<NewsSearchItem> = {}): NewsSearchItem {
  return {
    id: "news_1",
    title: "OpenAI 发布新模型，开发者关注 API 成本变化",
    url: "https://example.com/news",
    snippet: "新模型在 Agent、代码和价格方面出现变化，普通用户和开发者都能感知。",
    published_at: "2026-04-29T04:00:00.000Z",
    source: "Example News",
    score: 0.9,
    ...overrides,
  };
}

describe("long-form worthiness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("scores fresh AI topics with evidence as long-form candidates", () => {
    const result = scoreTopicForLongForm(makeTopic(), [makeNews()], "AI快讯");

    expect(result.score).toBeGreaterThanOrEqual(72);
    expect(result.recommendedOutput).toBe("HOT_LONG_FORM");
    expect(result.angleHint).toContain("AI 新闻真正改变了什么");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("penalizes market topics that contain investment-advice language", () => {
    const result = scoreTopicForLongForm(
      makeTopic({
        label: "纳指 财报 美联储 利率 变量",
        topEvidence: [
          {
            title: "纳指波动，网传内幕消息称可以满仓抄底",
            url: "https://example.com/risk",
            platform: "X",
            viewCount: 90000,
          },
        ],
      }),
      [
        makeNews({
          title: "美股市场交易财报和利率变量",
          snippet: "部分社交讨论出现买入、抄底等高风险表达。",
        }),
      ],
      "全球股市",
    );

    expect(result.riskLevel).toBe("HIGH");
    expect(result.recommendedOutput).not.toBe("HOT_LONG_FORM");
    expect(result.cautions).toContain("存在表达风险，需要保留事实边界");
  });

  it("scores consumer-fashion topics by brand and product signals", () => {
    const result = scoreTopicForLongForm(
      makeTopic({
        label: "品牌 联名 新品 审美 回潮",
        topEvidence: [
          {
            title: "品牌联名新品引发消费审美讨论",
            url: "https://example.com/fashion",
            platform: "X",
            viewCount: 80000,
          },
        ],
      }),
      [
        makeNews({
          title: "品牌新品和联名系列上线",
          snippet: "产品细节、包装、颜色和人群变化成为消费时尚讨论焦点。",
        }),
      ],
      "消费时尚",
    );

    expect(result.accountFitScore).toBeGreaterThan(70);
    expect(result.visualPotentialScore).toBeGreaterThan(70);
    expect(result.angleHint).toContain("品牌或消费现象");
  });
});
