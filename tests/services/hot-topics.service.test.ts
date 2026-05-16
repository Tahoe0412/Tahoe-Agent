import { afterEach, describe, expect, it, vi } from "vitest";
import { runHotTopicsResearch, normalizeHotTopicsRequest } from "@/services/hot-topics/hot-topics.service";
import type { NewsSearchResult } from "@/types/news-search";
import type { ContentItem, Creator, PlatformCollectResult, SupportedPlatform } from "@/types/platform-data";

const mocks = vi.hoisted(() => ({
  collect: vi.fn(),
  searchLatestNews: vi.fn(),
  searchCnIndexedEvidence: vi.fn(),
}));

vi.mock("@/services/platform-connectors", () => ({
  getPlatformConnector: () => ({
    collect: mocks.collect,
  }),
}));

vi.mock("@/services/news-search", () => ({
  searchLatestNews: mocks.searchLatestNews,
  searchCnIndexedEvidence: mocks.searchCnIndexedEvidence,
}));

function creator(platform: SupportedPlatform, id: string): Creator {
  return {
    platform,
    external_creator_id: id,
    handle: id,
    display_name: id,
    follower_count: 100,
    creator_tier: "GROWTH",
  };
}

function item(platform: SupportedPlatform, id: string): ContentItem {
  return {
    platform,
    external_content_id: id,
    creator_external_id: "creator-1",
    creator_handle: "creator-1",
    content_type: "SHORT_VIDEO",
    production_class: "UGC",
    title: "火星公民 茶饮 慢生活 门店观察",
    normalized_title: "火星公民 茶饮 慢生活 门店观察",
    url: `https://example.com/${platform}/${id}`,
    published_at: "2026-03-15T10:00:00.000Z",
    view_count: 1200,
    like_count: 120,
    comment_count: 24,
    share_count: 8,
    keyword_set: ["火星公民", "茶饮"],
    topic_hints: ["慢生活"],
    ai_producibility_hints: ["single scene"],
  };
}

function platformResult(platform: SupportedPlatform): PlatformCollectResult {
  return {
    platform,
    mode: "live",
    success: true,
    creators: [creator(platform, "creator-1"), creator(platform, "creator-1")],
    content_items: [item(platform, "content-1"), item(platform, "content-1")],
    errors: [],
    fetched_at: "2026-03-15T10:00:00.000Z",
  };
}

function newsResult(mode: "mock" | "live" = "live"): NewsSearchResult {
  return {
    provider: "GOOGLE",
    mode,
    success: true,
    items: [],
    errors: [],
    fetched_at: "2026-03-15T10:00:00.000Z",
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("hot topics service", () => {
  it("normalizes query, platforms, and limit", () => {
    expect(
      normalizeHotTopicsRequest({
        query: "  火星公民  ",
        platforms: ["YOUTUBE", "DOUYIN", "INVALID" as SupportedPlatform],
        limit: 50,
      }),
    ).toEqual({
      query: "火星公民",
      platforms: ["YOUTUBE", "DOUYIN"],
      limit: 25,
      mockMode: false,
    });
  });

  it("uses mock news and empty mock CN evidence without calling live search", async () => {
    mocks.collect.mockResolvedValue(platformResult("YOUTUBE"));

    const result = await runHotTopicsResearch({
      query: "火星公民",
      platforms: ["YOUTUBE"],
      limit: 2,
      mockMode: true,
    });

    expect(mocks.searchLatestNews).not.toHaveBeenCalled();
    expect(mocks.searchCnIndexedEvidence).not.toHaveBeenCalled();
    expect(mocks.collect).toHaveBeenCalledWith({ topic: "火星公民", limit: 2, mock: true });
    expect(result.cn_indexed).toMatchObject({ mode: "mock", items: [] });
    expect(result.creators).toHaveLength(1);
    expect(result.content_items).toHaveLength(1);
    expect(result.topics.length).toBeGreaterThan(0);
  });

  it("calls live search providers when mock mode is disabled", async () => {
    mocks.collect.mockResolvedValue(platformResult("X"));
    mocks.searchLatestNews.mockResolvedValue(newsResult("live"));
    mocks.searchCnIndexedEvidence.mockResolvedValue(newsResult("live"));

    const result = await runHotTopicsResearch({
      query: "火星公民",
      platforms: ["X"],
      mockMode: false,
    });

    expect(mocks.searchLatestNews).toHaveBeenCalledWith({ topic: "火星公民", limit: 5 });
    expect(mocks.searchCnIndexedEvidence).toHaveBeenCalledWith({ topic: "火星公民", limit: 5 });
    expect(result.platforms).toEqual(["X"]);
    expect(result.news.mode).toBe("live");
  });

  it("returns empty collections when all requested platforms are filtered out", async () => {
    mocks.searchLatestNews.mockResolvedValue(newsResult("live"));
    mocks.searchCnIndexedEvidence.mockResolvedValue(newsResult("live"));

    const result = await runHotTopicsResearch({
      query: "火星公民",
      platforms: ["INVALID" as SupportedPlatform],
    });

    expect(mocks.collect).not.toHaveBeenCalled();
    expect(result.platforms).toEqual([]);
    expect(result.topics).toEqual([]);
    expect(result.creators).toEqual([]);
    expect(result.content_items).toEqual([]);
  });
});
