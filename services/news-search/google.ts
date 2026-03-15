import type { NewsSearchProviderAdapter } from "@/services/news-search/base";
import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

interface GoogleSearchResponse {
  items?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    pagemap?: {
      metatags?: Array<{ "article:published_time"?: string }>;
    };
  }>;
}

export class GoogleNewsSearchProvider implements NewsSearchProviderAdapter {
  readonly provider = "GOOGLE" as const;

  constructor(
    private readonly apiKey: string,
    private readonly cx: string,
  ) {}

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
      key: this.apiKey,
      cx: this.cx,
      q: `${input.topic} latest news`,
      num: String(Math.min(input.limit ?? 5, 10)),
      sort: "date",
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: AbortSignal.timeout(15_000) },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Google Custom Search failed with ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const payload = (await response.json()) as GoogleSearchResponse;
    const items: NewsSearchItem[] = (payload.items ?? [])
      .filter((item) => item.title && item.link)
      .map((item, index) => ({
        id: `google-news-${index + 1}`,
        title: item.title ?? "Untitled",
        url: item.link ?? "",
        snippet: item.snippet ?? "",
        published_at:
          item.pagemap?.metatags?.[0]?.["article:published_time"] ??
          new Date().toISOString(),
        source: "Google",
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
