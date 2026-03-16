import type { NewsSearchItem, NewsSearchResult } from "@/types/news-search";

interface SerperOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  position?: number;
}

interface SerperSearchResponse {
  organic?: SerperOrganicItem[];
  answerBox?: { answer?: string; snippet?: string };
  knowledgeGraph?: { description?: string };
}

export interface WebSearchResult extends NewsSearchResult {
  answer: string | null;
}

export class SerperSearchService {
  constructor(private readonly apiKey: string) {}

  /**
   * General web search via Serper.dev (Google SERP API).
   */
  async searchGeneral(input: {
    query: string;
    limit?: number;
    language?: string;
  }): Promise<WebSearchResult> {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: input.query,
        gl: "us",
        hl: input.language?.includes("zh") ? "zh-cn" : "en",
        num: Math.min(input.limit ?? 8, 10),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Serper search failed with ${response.status}: ${errorText.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as SerperSearchResponse;
    const items: NewsSearchItem[] = (payload.organic ?? [])
      .filter((item) => item.title && item.link)
      .map((item, index) => ({
        id: `serper-${index + 1}`,
        title: item.title ?? "Untitled",
        url: item.link ?? "",
        snippet: item.snippet ?? "",
        published_at: item.date ?? new Date().toISOString(),
        source: "Google",
        score: 1 - index * 0.1,
        raw_payload: item,
      }));

    const answer =
      payload.answerBox?.answer ??
      payload.answerBox?.snippet ??
      payload.knowledgeGraph?.description ??
      null;

    return {
      provider: "GOOGLE",
      mode: "live",
      success: true,
      answer,
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
