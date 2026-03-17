export type NewsSearchProvider = "MOCK" | "GOOGLE";

export interface NewsSearchItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  published_at: string;
  source: string;
  score: number;
  /** "news" = Google News, "indexed" = site-scoped indexed search, "platform" = native connector */
  source_type?: string;
  raw_payload?: unknown;
}

export interface NewsSearchResult {
  provider: NewsSearchProvider;
  mode: "mock" | "live";
  success: boolean;
  items: NewsSearchItem[];
  errors: Array<{
    code: string;
    message: string;
  }>;
  fetched_at: string;
}
