import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

interface TavilySearchResponse {
  answer?: string;
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    published_date?: string;
    score?: number;
  }>;
}

export interface WebSearchResult extends NewsSearchResult {
  answer: string | null;
}

export class TavilySearchService {
  constructor(private readonly apiKey: string) {}

  /**
   * General web search — returns AI-generated answer + ranked results.
   * Unlike `searchLatest`, this is not restricted to "news" topic.
   */
  async searchGeneral(input: {
    query: string;
    limit?: number;
    searchDepth?: "basic" | "advanced";
  }): Promise<WebSearchResult> {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: input.query,
        search_depth: input.searchDepth ?? "advanced",
        include_answer: true,
        max_results: input.limit ?? 8,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Tavily request failed with ${response.status}: ${errorText.slice(0, 200)}`
      );
    }

    const payload = (await response.json()) as TavilySearchResponse;
    const items: NewsSearchItem[] = (payload.results ?? [])
      .filter((item) => item.title && item.url)
      .map((item, index) => ({
        id: `tavily-${index + 1}`,
        title: item.title ?? "Untitled",
        url: item.url ?? "",
        snippet: item.content ?? "",
        published_at: item.published_date ?? new Date().toISOString(),
        source: "Tavily",
        score: item.score ?? 0.5,
        raw_payload: item,
      }));

    return {
      provider: "TAVILY",
      mode: "live",
      success: true,
      answer: payload.answer ?? null,
      items,
      errors: [],
      fetched_at: new Date().toISOString(),
    };
  }

  /**
   * Scoped search for a specific platform (e.g., site:xiaohongshu.com).
   * Useful for platforms without official APIs.
   */
  async searchPlatformContent(input: {
    query: string;
    siteDomain: string;
    limit?: number;
  }): Promise<WebSearchResult> {
    return this.searchGeneral({
      query: `site:${input.siteDomain} ${input.query}`,
      limit: input.limit ?? 6,
      searchDepth: "advanced",
    });
  }
}
