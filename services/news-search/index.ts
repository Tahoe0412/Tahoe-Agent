import { AppSettingsService } from "@/services/app-settings.service";
import { MockNewsSearchProvider } from "@/services/news-search/mock";
import { SerperNewsSearchProvider } from "@/services/news-search/serper";

const appSettingsService = new AppSettingsService();

export async function searchLatestNews(input: { topic: string; limit?: number }) {
  const settings = await appSettingsService.getEffectiveSettings();

  if (settings.newsSearchMockMode || settings.newsSearchProvider === "MOCK") {
    return new MockNewsSearchProvider().searchLatest(input);
  }

  if (settings.newsSearchProvider === "GOOGLE") {
    if (!settings.serperApiKey) {
      return {
        provider: "GOOGLE" as const,
        mode: "live" as const,
        success: false,
        items: [],
        errors: [{ code: "CONFIG_MISSING", message: "SERPER_API_KEY is missing. Get one at serper.dev" }],
        fetched_at: new Date().toISOString(),
      };
    }

    try {
      return await new SerperNewsSearchProvider(
        settings.serperApiKey,
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
