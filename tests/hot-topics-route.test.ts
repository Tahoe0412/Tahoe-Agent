import { describe, expect, it } from "vitest";
import { prepareTrendContentItems } from "../services/hot-topics/prepare-trend-content";
import { buildMockContentItems } from "../lib/platform-mocks";
import type { NewsSearchResult } from "../types/news-search";
import type { PlatformCollectResult } from "../types/platform-data";

describe("hot topics route helpers", () => {
  it("enriches mock platform items with live news titles and clamps negative metrics", () => {
    const [mockItem] = buildMockContentItems("X", "火星公民 OR 茶饮 OR 慢生活", {
      topic: "火星公民 OR 茶饮 OR 慢生活",
      limit: 1,
      mock: true,
    });

    const news: NewsSearchResult = {
      provider: "GOOGLE",
      mode: "live",
      success: true,
      items: [
        {
          id: "news-1",
          title: "火星公民联名茶饮门店观察",
          url: "https://example.com/news-1",
          snippet: "门店体验与慢生活内容趋势",
          published_at: "2026-03-15T10:00:00.000Z",
          source: "Google",
          score: 0.9,
        },
      ],
      errors: [],
      fetched_at: "2026-03-15T10:00:00.000Z",
    };

    const platformResults: PlatformCollectResult[] = [
      {
        platform: "X",
        mode: "mock",
        success: true,
        creators: [],
        content_items: [mockItem],
        errors: [],
        fetched_at: "2026-03-15T10:00:00.000Z",
      },
    ];

    const prepared = prepareTrendContentItems(
      [{ ...mockItem, view_count: -200, like_count: -20, comment_count: -5, share_count: -8 }],
      news,
      platformResults,
      "火星公民 OR 茶饮 OR 慢生活",
    );

    expect(prepared[0]?.title).toBe("火星公民联名茶饮门店观察");
    expect(prepared[0]?.view_count).toBe(0);
    expect(prepared[0]?.like_count).toBe(0);
    expect(prepared[0]?.topic_hints).toContain("火星公民联名茶饮门店观察".replace(/[^\p{L}\p{N}\s]+/gu, " ").toLowerCase().split(/\s+/)[0]);
  });

  it("builds mock content without generic hook or workflow placeholders", () => {
    const items = buildMockContentItems("YOUTUBE", "火星公民 OR 茶饮 OR 慢生活", {
      topic: "火星公民 OR 茶饮 OR 慢生活",
      limit: 3,
      mock: true,
    });

    expect(items[0]?.title).not.toContain("result-first hook");
    expect(items[0]?.title).not.toContain("workflow");
    expect(items[0]?.keyword_set).not.toContain("result_first_hook");
    expect(items[0]?.topic_hints).not.toContain("ugc_workflow");
  });
});
