import type { NewsSearchProviderAdapter } from "@/services/news-search/base";
import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

interface TavilySearchResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    published_date?: string;
    score?: number;
  }>;
}

export class TavilyNewsSearchProvider implements NewsSearchProviderAdapter {
  readonly provider = "TAVILY" as const;

  constructor(private readonly apiKey: string) {}

  async searchLatest(input: { topic: string; limit?: number; mock?: boolean }): Promise<NewsSearchResult> {
    if (input.mock) {
      return {
        provider: this.provider,
        mode: "mock",
        success: true,
        items: [],
        errors: [],
        fetched_at: new Date().toISOString(),
      };
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: `${input.topic} latest news`,
        topic: "news",
        search_depth: "advanced",
        max_results: input.limit ?? 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily request failed with ${response.status}: ${errorText}`);
    }

    const payload = (await response.json()) as TavilySearchResponse;
    const items: NewsSearchItem[] = (payload.results ?? [])
      .filter((item) => item.title && item.url)
      .map((item, index) => ({
        id: `tavily-news-${index + 1}`,
        title: item.title ?? "Untitled",
        url: item.url ?? "",
        snippet: item.content ?? "",
        published_at: item.published_date ?? new Date().toISOString(),
        source: "Tavily",
        score: item.score ?? 0.5,
        raw_payload: item,
      }));

    return {
      provider: this.provider,
      mode: "live",
      success: true,
      items,
      errors: [],
      fetched_at: new Date().toISOString(),
    };
  }
}
