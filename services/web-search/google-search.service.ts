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

export interface WebSearchResult extends NewsSearchResult {
  answer: string | null;
}

export class GoogleSearchService {
  constructor(
    private readonly apiKey: string,
    private readonly cx: string,
  ) {}

  /**
   * General web search via Google Custom Search JSON API.
   */
  async searchGeneral(input: {
    query: string;
    limit?: number;
    language?: string;
  }): Promise<WebSearchResult> {
    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.cx,
      q: input.query,
      num: String(Math.min(input.limit ?? 8, 10)),
      lr: input.language ?? "lang_zh-CN|lang_en",
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: AbortSignal.timeout(15_000) },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Google Custom Search failed with ${response.status}: ${errorText.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as GoogleSearchResponse;
    const items: NewsSearchItem[] = (payload.items ?? [])
      .filter((item) => item.title && item.link)
      .map((item, index) => ({
        id: `google-${index + 1}`,
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
      provider: "GOOGLE",
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
