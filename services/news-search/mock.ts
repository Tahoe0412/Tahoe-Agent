import type { NewsSearchProviderAdapter } from "@/services/news-search/base";
import type { NewsSearchResult } from "@/types/news-search";

export class MockNewsSearchProvider implements NewsSearchProviderAdapter {
  readonly provider = "MOCK" as const;

  async searchLatest(input: { topic: string; limit?: number }): Promise<NewsSearchResult> {
    const now = new Date();
    const items = Array.from({ length: Math.min(input.limit ?? 5, 5) }).map((_, index) => ({
      id: `mock-news-${index + 1}`,
      title: `${input.topic} 最新动态 ${index + 1}`,
      url: `https://example.com/news/${encodeURIComponent(input.topic)}/${index + 1}`,
      snippet: `围绕 ${input.topic} 的最新新闻摘要，适合用于趋势研究和脚本 hook 设计。`,
      published_at: new Date(now.getTime() - index * 1000 * 60 * 90).toISOString(),
      source: "Mock Newswire",
      score: 0.92 - index * 0.08,
      raw_payload: {
        rank: index + 1,
        topic: input.topic,
      },
    }));

    return {
      provider: this.provider,
      mode: "mock",
      success: true,
      items,
      errors: [],
      fetched_at: new Date().toISOString(),
    };
  }
}
