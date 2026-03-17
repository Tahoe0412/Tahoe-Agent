import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

/**
 * SerpApi response shape for `engine=baidu_news`.
 * Docs: https://serpapi.com/baidu-news-results
 */
interface SerpApiBaiduNewsResult {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  source?: string;
  thumbnail?: string;
}

interface SerpApiBaiduNewsResponse {
  news_results?: SerpApiBaiduNewsResult[];
  organic_results?: SerpApiBaiduNewsResult[];
  search_information?: {
    query_displayed?: string;
    total_results?: number;
  };
  error?: string;
}

export class BaiduNewsSearchProvider {
  constructor(private readonly apiKey: string) {}

  /**
   * Fetch real-time Baidu news results via SerpApi.
   * Returns items tagged with source_type: "baidu_news".
   */
  async searchLatest(input: {
    topic: string;
    limit?: number;
  }): Promise<NewsSearchResult> {
    const params = new URLSearchParams({
      engine: "baidu_news",
      q: input.topic,
      api_key: this.apiKey,
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`, {
      method: "GET",
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `SerpApi Baidu news failed with ${response.status}: ${errorText.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as SerpApiBaiduNewsResponse;

    if (payload.error) {
      throw new Error(`SerpApi error: ${payload.error}`);
    }

    // SerpApi returns news_results for baidu_news engine
    const rawResults = payload.news_results ?? payload.organic_results ?? [];
    const limit = Math.min(input.limit ?? 8, 15);

    const items: NewsSearchItem[] = rawResults
      .filter((r) => r.title && r.link)
      .slice(0, limit)
      .map((r, index) => ({
        id: `baidu-news-${index + 1}`,
        title: r.title ?? "Untitled",
        url: r.link ?? "",
        snippet: r.snippet ?? "",
        published_at: r.date ?? new Date().toISOString(),
        source: r.source ?? "百度新闻",
        score: 1 - index * 0.05,
        source_type: "baidu_news",
        raw_payload: r,
      }));

    return {
      provider: "GOOGLE", // keep type compatible
      mode: "live",
      success: true,
      items,
      errors: [],
      fetched_at: new Date().toISOString(),
    };
  }
}
