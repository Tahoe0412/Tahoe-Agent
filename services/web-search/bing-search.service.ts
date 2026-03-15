import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

interface BingSearchResponse {
  webPages?: {
    value?: Array<{
      name?: string;
      url?: string;
      snippet?: string;
      dateLastCrawled?: string;
    }>;
  };
}

export interface WebSearchResult extends NewsSearchResult {
  answer: string | null;
}

export class BingSearchService {
  constructor(private readonly apiKey: string) {}

  /**
   * General web search via Bing — returns ranked results.
   * Uses mkt=zh-CN for Chinese internet coverage.
   */
  async searchGeneral(input: {
    query: string;
    limit?: number;
    market?: string;
  }): Promise<WebSearchResult> {
    const params = new URLSearchParams({
      q: input.query,
      count: String(input.limit ?? 8),
      mkt: input.market ?? "zh-CN",
    });

    const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?${params}`, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": this.apiKey,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Bing request failed with ${response.status}: ${errorText.slice(0, 200)}`
      );
    }

    const payload = (await response.json()) as BingSearchResponse;
    const items: NewsSearchItem[] = (payload.webPages?.value ?? [])
      .filter((item) => item.name && item.url)
      .map((item, index) => ({
        id: `bing-${index + 1}`,
        title: item.name ?? "Untitled",
        url: item.url ?? "",
        snippet: item.snippet ?? "",
        published_at: item.dateLastCrawled ?? new Date().toISOString(),
        source: "Bing",
        score: 1 - index * 0.1,
        raw_payload: item,
      }));

    return {
      provider: "BING",
      mode: "live",
      success: true,
      answer: null,
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
    });
  }
}
