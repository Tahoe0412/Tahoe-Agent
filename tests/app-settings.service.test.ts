import { afterEach, beforeEach, afterAll, describe, expect, it } from "vitest";
import { AppSettingsService } from "../services/app-settings.service";

class TestAppSettingsService extends AppSettingsService {
  constructor(private readonly value: Awaited<ReturnType<AppSettingsService["getRecord"]>> | null, private readonly shouldThrow = false) {
    super();
  }

  override async getRecord() {
    if (this.shouldThrow) {
      throw new Error("db unavailable");
    }

    return this.value as Awaited<ReturnType<AppSettingsService["getRecord"]>>;
  }
}

describe("AppSettingsService", () => {
  const originalWarn = console.warn;

  beforeEach(() => {
    console.warn = () => {};
  });

  afterEach(() => {
    delete process.env.GOOGLE_SEARCH_API_KEY;
    delete process.env.GOOGLE_SEARCH_CX;
    delete process.env.NEWS_SEARCH_PROVIDER;
    delete process.env.NEWS_SEARCH_MOCK_MODE;
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  it("defaults to Google live search when env credentials exist and DB settings are unavailable", async () => {
    process.env.GOOGLE_SEARCH_API_KEY = "google-key";
    process.env.GOOGLE_SEARCH_CX = "google-cx";

    const service = new TestAppSettingsService(null, true);
    const settings = await service.getEffectiveSettings();

    expect(settings.newsSearchProvider).toBe("GOOGLE");
    expect(settings.newsSearchMockMode).toBe(false);
  });

  it("respects explicit env mock override even when Google credentials exist", async () => {
    process.env.GOOGLE_SEARCH_API_KEY = "google-key";
    process.env.GOOGLE_SEARCH_CX = "google-cx";
    process.env.NEWS_SEARCH_PROVIDER = "MOCK";
    process.env.NEWS_SEARCH_MOCK_MODE = "true";

    const service = new TestAppSettingsService(null, true);
    const settings = await service.getEffectiveSettings();

    expect(settings.newsSearchProvider).toBe("MOCK");
    expect(settings.newsSearchMockMode).toBe(true);
  });
});
