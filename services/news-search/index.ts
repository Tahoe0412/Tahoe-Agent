import { AppSettingsService } from "@/services/app-settings.service";
import { MockNewsSearchProvider } from "@/services/news-search/mock";
import { TavilyNewsSearchProvider } from "@/services/news-search/tavily";

const appSettingsService = new AppSettingsService();

export async function searchLatestNews(input: { topic: string; limit?: number }) {
  const settings = await appSettingsService.getEffectiveSettings();

  if (settings.newsSearchMockMode || settings.newsSearchProvider === "MOCK") {
    return new MockNewsSearchProvider().searchLatest(input);
  }

  if (settings.newsSearchProvider === "TAVILY") {
    if (!settings.tavilyApiKey) {
      return {
        provider: "TAVILY" as const,
        mode: "live" as const,
        success: false,
        items: [],
        errors: [{ code: "CONFIG_MISSING", message: "TAVILY_API_KEY is missing." }],
        fetched_at: new Date().toISOString(),
      };
    }

    try {
      return await new TavilyNewsSearchProvider(settings.tavilyApiKey).searchLatest(input);
    } catch (error) {
      return {
        provider: "TAVILY" as const,
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
