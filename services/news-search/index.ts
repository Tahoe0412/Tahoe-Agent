import { AppSettingsService } from "@/services/app-settings.service";
import { MockNewsSearchProvider } from "@/services/news-search/mock";
import { BingNewsSearchProvider } from "@/services/news-search/bing";

const appSettingsService = new AppSettingsService();

export async function searchLatestNews(input: { topic: string; limit?: number }) {
  const settings = await appSettingsService.getEffectiveSettings();

  if (settings.newsSearchMockMode || settings.newsSearchProvider === "MOCK") {
    return new MockNewsSearchProvider().searchLatest(input);
  }

  if (settings.newsSearchProvider === "BING") {
    if (!settings.bingApiKey) {
      return {
        provider: "BING" as const,
        mode: "live" as const,
        success: false,
        items: [],
        errors: [{ code: "CONFIG_MISSING", message: "BING_API_KEY is missing." }],
        fetched_at: new Date().toISOString(),
      };
    }

    try {
      return await new BingNewsSearchProvider(settings.bingApiKey).searchLatest(input);
    } catch (error) {
      return {
        provider: "BING" as const,
        mode: "live" as const,
        success: false,
        items: [],
        errors: [{ code: "REQUEST_FAILED", message: error instanceof Error ? error.message : "News search failed." }],
        fetched_at: new Date().toISOString(),
      };
    }
  }

  return new MockNewsSearchProvider().searchLatest({
    ...input,
  });
}
