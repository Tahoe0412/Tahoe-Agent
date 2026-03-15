import { type LlmProvider, type SearchProvider } from "@prisma/client";
import { prisma } from "@/lib/db";
import { defaultModelRoutes, normalizeModelRoutes, type ModelRouteConfig, type ModelRouteKey } from "@/lib/model-routing";

export interface EffectiveAppSettings {
  llmProvider: LlmProvider;
  llmModel: string;
  llmMockMode: boolean;
  openaiApiKey: string | null;
  geminiApiKey: string | null;
  deepseekApiKey: string | null;
  qwenApiKey: string | null;
  llmRouting: Record<ModelRouteKey, ModelRouteConfig>;
  newsSearchProvider: SearchProvider;
  newsSearchMockMode: boolean;
  googleSearchApiKey: string | null;
  googleSearchCx: string | null;
  appBaseUrl: string | null;
}

function envBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function trimOrNull(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function envRoute(key: ModelRouteKey): ModelRouteConfig {
  const prefix = `LLM_ROUTE_${key}`;
  const provider = process.env[`${prefix}_PROVIDER`]?.trim().toUpperCase() as LlmProvider | undefined;
  const model = trimOrNull(process.env[`${prefix}_MODEL`]);

  if (provider && model) {
    return { provider, model };
  }

  return defaultModelRoutes[key];
}

function envApiKeyDefaults() {
  return {
    openai_api_key: trimOrNull(process.env.OPENAI_API_KEY),
    gemini_api_key: trimOrNull(process.env.GEMINI_API_KEY),
    deepseek_api_key: trimOrNull(process.env.DEEPSEEK_API_KEY),
    qwen_api_key: trimOrNull(process.env.QWEN_API_KEY),
    google_search_api_key: trimOrNull(process.env.GOOGLE_SEARCH_API_KEY),
    google_search_cx: trimOrNull(process.env.GOOGLE_SEARCH_CX),
  };
}

function defaultNewsSearchProvider() {
  const configuredProvider = process.env.NEWS_SEARCH_PROVIDER?.trim().toUpperCase() as SearchProvider | undefined;
  if (configuredProvider === "GOOGLE" || configuredProvider === "MOCK") {
    return configuredProvider;
  }

  return trimOrNull(process.env.GOOGLE_SEARCH_API_KEY) && trimOrNull(process.env.GOOGLE_SEARCH_CX)
    ? "GOOGLE"
    : "MOCK";
}

function defaultNewsSearchMockMode(provider: SearchProvider) {
  return envBoolean(process.env.NEWS_SEARCH_MOCK_MODE, provider === "MOCK");
}

export class AppSettingsService {
  async getRecord() {
    return prisma.appSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        ...envApiKeyDefaults(),
      },
    });
  }

  async getEffectiveSettings(): Promise<EffectiveAppSettings> {
    let record: Awaited<ReturnType<AppSettingsService["getRecord"]>> | null = null;
    const envNewsSearchProvider = defaultNewsSearchProvider();

    try {
      record = await this.getRecord();
    } catch (error) {
      console.warn("App settings DB read failed, falling back to environment defaults.", error);
    }

    return {
      llmProvider: record?.llm_provider ?? ((process.env.LLM_PROVIDER?.toUpperCase() as LlmProvider | undefined) || "OPENAI"),
      llmModel: trimOrNull(record?.llm_model) ?? trimOrNull(process.env.OPENAI_MODEL) ?? "gpt-4.1-mini",
      llmMockMode: record?.llm_mock_mode ?? envBoolean(process.env.LLM_MOCK_MODE, true),
      openaiApiKey: trimOrNull(record?.openai_api_key) ?? trimOrNull(process.env.OPENAI_API_KEY),
      geminiApiKey: trimOrNull(record?.gemini_api_key) ?? trimOrNull(process.env.GEMINI_API_KEY),
      deepseekApiKey: trimOrNull(record?.deepseek_api_key) ?? trimOrNull(process.env.DEEPSEEK_API_KEY),
      qwenApiKey: trimOrNull(record?.qwen_api_key) ?? trimOrNull(process.env.QWEN_API_KEY),
      llmRouting: normalizeModelRoutes(
        record?.llm_routing_json ??
          Object.fromEntries(
            Object.keys(defaultModelRoutes).map((key) => [key, envRoute(key as ModelRouteKey)]),
          ),
      ),
      newsSearchProvider: record?.news_search_provider ?? envNewsSearchProvider,
      newsSearchMockMode: record?.news_search_mock_mode ?? defaultNewsSearchMockMode(envNewsSearchProvider),
      googleSearchApiKey: trimOrNull(record?.google_search_api_key) ?? trimOrNull(process.env.GOOGLE_SEARCH_API_KEY),
      googleSearchCx: trimOrNull(record?.google_search_cx) ?? trimOrNull(process.env.GOOGLE_SEARCH_CX),
      appBaseUrl: trimOrNull(record?.app_base_url) ?? trimOrNull(process.env.APP_BASE_URL),
    };
  }

  async update(input: {
    llm_provider: LlmProvider;
    llm_model: string;
    llm_mock_mode: boolean;
    openai_api_key?: string | null;
    gemini_api_key?: string | null;
    deepseek_api_key?: string | null;
    qwen_api_key?: string | null;
    llm_routing_json?: Partial<Record<ModelRouteKey, ModelRouteConfig>>;
    news_search_provider: SearchProvider;
    news_search_mock_mode: boolean;
    google_search_api_key?: string | null;
    google_search_cx?: string | null;
    app_base_url?: string | null;
  }) {
    await this.getRecord();

    return prisma.appSettings.upsert({
      where: { id: "default" },
      update: {
        llm_provider: input.llm_provider,
        llm_model: input.llm_model,
        llm_mock_mode: input.llm_mock_mode,
        openai_api_key: trimOrNull(input.openai_api_key),
        gemini_api_key: trimOrNull(input.gemini_api_key),
        deepseek_api_key: trimOrNull(input.deepseek_api_key),
        qwen_api_key: trimOrNull(input.qwen_api_key),
        llm_routing_json: normalizeModelRoutes(input.llm_routing_json) as never,
        news_search_provider: input.news_search_provider,
        news_search_mock_mode: input.news_search_mock_mode,
        google_search_api_key: trimOrNull(input.google_search_api_key),
        google_search_cx: trimOrNull(input.google_search_cx),
        app_base_url: trimOrNull(input.app_base_url),
      },
      create: {
        id: "default",
        llm_provider: input.llm_provider,
        llm_model: input.llm_model,
        llm_mock_mode: input.llm_mock_mode,
        openai_api_key: trimOrNull(input.openai_api_key),
        gemini_api_key: trimOrNull(input.gemini_api_key),
        deepseek_api_key: trimOrNull(input.deepseek_api_key),
        qwen_api_key: trimOrNull(input.qwen_api_key),
        llm_routing_json: normalizeModelRoutes(input.llm_routing_json) as never,
        news_search_provider: input.news_search_provider,
        news_search_mock_mode: input.news_search_mock_mode,
        google_search_api_key: trimOrNull(input.google_search_api_key),
        google_search_cx: trimOrNull(input.google_search_cx),
        app_base_url: trimOrNull(input.app_base_url),
      },
    });
  }
}
