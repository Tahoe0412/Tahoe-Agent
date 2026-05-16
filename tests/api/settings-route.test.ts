import { afterEach, describe, expect, it, vi } from "vitest";

const settings = {
  llmProvider: "QWEN",
  llmModel: "qwen3.6-35b-a3b",
  llmMockMode: false,
  openaiApiKey: "sk-openai",
  geminiApiKey: "gemini-key",
  deepseekApiKey: "sk-deepseek",
  qwenApiKey: "sk-qwen",
  qwenBaseUrl: "http://127.0.0.1:1234/v1",
  llmRouting: {
    MARKETING_ANALYSIS: { provider: "QWEN", model: "qwen3.6-35b-a3b" },
    PROMOTIONAL_COPY: { provider: "QWEN", model: "qwen3.6-35b-a3b" },
    PLATFORM_ADAPTATION: { provider: "QWEN", model: "qwen3.6-35b-a3b" },
    SCRIPT_REWRITE: { provider: "QWEN", model: "qwen3.6-35b-a3b" },
    SCENE_CLASSIFICATION: { provider: "QWEN", model: "qwen3.6-35b-a3b" },
    ASSET_ANALYSIS: { provider: "QWEN", model: "qwen3.6-35b-a3b" },
    REPORT_GENERATION: { provider: "QWEN", model: "qwen3.6-35b-a3b" },
  },
  newsSearchProvider: "GOOGLE",
  newsSearchMockMode: false,
  googleSearchApiKey: "google-key",
  googleSearchCx: "search-cx",
  serperApiKey: "serper-key",
  serpApiKey: "serp-key",
  appBaseUrl: "http://localhost:3000",
} as const;

const mocks = vi.hoisted(() => ({
  getEffectiveSettings: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/services/app-settings.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/app-settings.service")>();
  return {
    ...actual,
    AppSettingsService: vi.fn(() => ({
      getEffectiveSettings: mocks.getEffectiveSettings,
      update: mocks.update,
    })),
  };
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("settings route", () => {
  it("does not return API keys from GET", async () => {
    mocks.getEffectiveSettings.mockResolvedValue(settings);
    const { GET } = await import("@/app/api/settings/route");

    const response = await GET();
    const payload = await response.json();

    expect(payload.success).toBe(true);
    expect(payload.data.openaiApiKey).toBeNull();
    expect(payload.data.geminiApiKey).toBeNull();
    expect(payload.data.deepseekApiKey).toBeNull();
    expect(payload.data.qwenApiKey).toBeNull();
    expect(payload.data.googleSearchApiKey).toBeNull();
    expect(payload.data.serperApiKey).toBeNull();
    expect(payload.data.serpApiKey).toBeNull();
    expect(payload.data.hasOpenaiApiKey).toBe(true);
    expect(payload.data.hasGoogleSearchApiKey).toBe(true);
  });

  it("does not echo API keys after PUT", async () => {
    mocks.update.mockResolvedValue({});
    mocks.getEffectiveSettings.mockResolvedValue(settings);
    const { PUT } = await import("@/app/api/settings/route");

    const response = await PUT(new Request("http://localhost/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        llm_provider: "QWEN",
        llm_model: "qwen3.6-35b-a3b",
        llm_mock_mode: false,
        qwen_api_key: "new-qwen-key",
        news_search_provider: "GOOGLE",
        news_search_mock_mode: false,
        google_search_cx: "search-cx",
        app_base_url: "http://localhost:3000",
      }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.qwenApiKey).toBeNull();
    expect(JSON.stringify(payload)).not.toContain("new-qwen-key");
    expect(JSON.stringify(payload)).not.toContain("sk-qwen");
  });
});
