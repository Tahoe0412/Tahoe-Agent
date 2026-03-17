import type { NewsSearchProviderAdapter } from "@/services/news-search/base";
import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

interface SerperNewsItem {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  source?: string;
  imageUrl?: string;
}

interface SerperNewsResponse {
  news?: SerperNewsItem[];
  searchParameters?: Record<string, string>;
}

export interface SerperLocale {
  gl: string;
  hl: string;
}

export class SerperNewsSearchProvider implements NewsSearchProviderAdapter {
  readonly provider = "GOOGLE" as const; // keep "GOOGLE" for UI compatibility

  constructor(private readonly apiKey: string) {}

  async searchLatest(input: {
    topic: string;
    limit?: number;
    mock?: boolean;
    locale?: SerperLocale;
    sourceType?: string;
  }): Promise<NewsSearchResult> {
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

    const locale = input.locale ?? { gl: "us", hl: "en" };
    const sourceType = input.sourceType ?? "news";

    const response = await fetch("https://google.serper.dev/news", {
      method: "POST",
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: input.topic,
        gl: locale.gl,
        hl: locale.hl,
        num: Math.min(input.limit ?? 5, 10),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Serper news search failed with ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const payload = (await response.json()) as SerperNewsResponse;
    const items: NewsSearchItem[] = (payload.news ?? [])
      .filter((item) => item.title && item.link)
      .map((item, index) => ({
        id: `serper-news-${locale.gl}-${index + 1}`,
        title: item.title ?? "Untitled",
        url: item.link ?? "",
        snippet: item.snippet ?? "",
        published_at: item.date ?? new Date().toISOString(),
        source: item.source ?? "Google",
        score: 1 - index * 0.05,
        source_type: sourceType,
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

