import { AppSettingsService } from "@/services/app-settings.service";
import { MockNewsSearchProvider } from "@/services/news-search/mock";
import { GoogleNewsSearchProvider } from "@/services/news-search/google";

const appSettingsService = new AppSettingsService();

export async function searchLatestNews(input: { topic: string; limit?: number }) {
  const settings = await appSettingsService.getEffectiveSettings();

  if (settings.newsSearchMockMode || settings.newsSearchProvider === "MOCK") {
    return new MockNewsSearchProvider().searchLatest(input);
  }

  if (settings.newsSearchProvider === "GOOGLE") {
    if (!settings.googleSearchApiKey || !settings.googleSearchCx) {
      return {
        provider: "GOOGLE" as const,
        mode: "live" as const,
        success: false,
        items: [],
        errors: [{ code: "CONFIG_MISSING", message: "GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX is missing." }],
        fetched_at: new Date().toISOString(),
      };
    }

    try {
      return await new GoogleNewsSearchProvider(
        settings.googleSearchApiKey,
        settings.googleSearchCx,
      ).searchLatest(input);
    } catch (error) {
      return {
        provider: "GOOGLE" as const,
        mode: "live" as const,
        success: false,
        items: [],
        errors: [{ code: "REQUEST_FAILED", message: error instanceof Error ? error.message : "News search failed." }],
        fetched_at: new Date().toISOString(),
      };
    }
  }

  return new MockNewsSearchProvider().searchLatest({ ...input });
}
