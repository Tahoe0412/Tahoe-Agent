import type { NewsSearchProviderAdapter } from "@/services/news-search/base";
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

export class BingNewsSearchProvider implements NewsSearchProviderAdapter {
  readonly provider = "BING" as const;

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

    const params = new URLSearchParams({
      q: `${input.topic} latest news`,
      count: String(input.limit ?? 5),
      mkt: "zh-CN",
      sortBy: "Date",
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
      throw new Error(`Bing request failed with ${response.status}: ${errorText}`);
    }

    const payload = (await response.json()) as BingSearchResponse;
    const items: NewsSearchItem[] = (payload.webPages?.value ?? [])
      .filter((item) => item.name && item.url)
      .map((item, index) => ({
        id: `bing-news-${index + 1}`,
        title: item.name ?? "Untitled",
        url: item.url ?? "",
        snippet: item.snippet ?? "",
        published_at: item.dateLastCrawled ?? new Date().toISOString(),
        source: "Bing",
        score: 1 - index * 0.1,
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
