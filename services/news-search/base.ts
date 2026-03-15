import type { NewsSearchResult } from "@/types/news-search";

export interface NewsSearchProviderAdapter {
  readonly provider: "MOCK" | "GOOGLE";
  searchLatest(input: { topic: string; limit?: number; mock?: boolean }): Promise<NewsSearchResult>;
}
