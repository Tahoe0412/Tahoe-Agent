import type { LlmProvider } from "@prisma/client";

export const modelRouteKeys = [
  "MARKETING_ANALYSIS",
  "PROMOTIONAL_COPY",
  "PLATFORM_ADAPTATION",
  "SCRIPT_REWRITE",
  "SCENE_CLASSIFICATION",
  "ASSET_ANALYSIS",
  "REPORT_GENERATION",
] as const;

export type ModelRouteKey = (typeof modelRouteKeys)[number];

export type ModelRouteConfig = {
  provider: LlmProvider;
  model: string;
};

export const providerModelOptions: Record<LlmProvider, string[]> = {
  OPENAI: ["gpt-5.4-mini", "gpt-5.4", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini"],
  GEMINI: ["gemini-3.1-pro-preview", "gemini-3.1-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash"],
  DEEPSEEK: ["deepseek-chat", "deepseek-reasoner"],
  QWEN: ["qwen3.6-35b", "qwen3.6-35b-a3b", "qwen3-max", "qwen3.5-plus", "qwen3.5-flash", "qwen-max", "qwen-plus", "qwen-turbo"],
};

export function getDefaultModelForProvider(provider: LlmProvider) {
  return providerModelOptions[provider][0];
}

export const defaultModelRoutes: Record<ModelRouteKey, ModelRouteConfig> = {
  MARKETING_ANALYSIS: {
    provider: "OPENAI",
    model: "gpt-5.4",
  },
  PROMOTIONAL_COPY: {
    provider: "QWEN",
    model: "qwen3-max",
  },
  PLATFORM_ADAPTATION: {
    provider: "QWEN",
    model: "qwen3.5-plus",
  },
  SCRIPT_REWRITE: {
    provider: "GEMINI",
    model: "gemini-3.1-pro-preview",
  },
  SCENE_CLASSIFICATION: {
    provider: "OPENAI",
    model: "gpt-5.4-mini",
  },
  ASSET_ANALYSIS: {
    provider: "OPENAI",
    model: "gpt-5.4-mini",
  },
  REPORT_GENERATION: {
    provider: "OPENAI",
    model: "gpt-5.4",
  },
};

export function isModelRouteConfig(value: unknown): value is ModelRouteConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const provider = (value as { provider?: unknown }).provider;
  const model = (value as { model?: unknown }).model;
  return (
    typeof provider === "string" &&
    ["OPENAI", "GEMINI", "DEEPSEEK", "QWEN"].includes(provider) &&
    typeof model === "string" &&
    model.trim().length > 0
  );
}

export function normalizeModelRoutes(input: unknown): Record<ModelRouteKey, ModelRouteConfig> {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return modelRouteKeys.reduce(
    (accumulator, key) => {
      accumulator[key] = isModelRouteConfig(source[key]) ? source[key] : defaultModelRoutes[key];
      return accumulator;
    },
    {} as Record<ModelRouteKey, ModelRouteConfig>,
  );
}

export function hasProviderCredential(
  provider: LlmProvider,
  settings: {
    openaiApiKey?: string | null;
    geminiApiKey?: string | null;
    deepseekApiKey?: string | null;
    qwenApiKey?: string | null;
  },
) {
  switch (provider) {
    case "OPENAI":
      return Boolean(settings.openaiApiKey);
    case "GEMINI":
      return Boolean(settings.geminiApiKey);
    case "DEEPSEEK":
      return Boolean(settings.deepseekApiKey);
    case "QWEN":
      return Boolean(settings.qwenApiKey || process.env.QWEN_BASE_URL || process.env.LOCAL_QWEN_BASE_URL);
    default:
      return false;
  }
}

export function canUseModelRoute(
  routeKey: ModelRouteKey,
  settings: {
    llmMockMode: boolean;
    llmProvider: LlmProvider;
    llmRouting: Record<ModelRouteKey, ModelRouteConfig>;
    openaiApiKey?: string | null;
    geminiApiKey?: string | null;
    deepseekApiKey?: string | null;
    qwenApiKey?: string | null;
  },
) {
  if (settings.llmMockMode) {
    return false;
  }

  const route = settings.llmRouting[routeKey] ?? { provider: settings.llmProvider, model: "" };
  return hasProviderCredential(route.provider, settings);
}

/** Credential settings shape required by route resolution. */
export interface CredentialSettings {
  llmProvider: LlmProvider;
  llmModel: string;
  llmRouting: Record<ModelRouteKey, ModelRouteConfig>;
  openaiApiKey?: string | null;
  geminiApiKey?: string | null;
  deepseekApiKey?: string | null;
  qwenApiKey?: string | null;
}

/**
 * Fallback priority when the configured provider for a route lacks credentials.
 * OPENAI is first because it has the broadest region support and most stable API.
 * QWEN is second because it supports local endpoints without a cloud API key.
 */
const fallbackProviderOrder: LlmProvider[] = ["OPENAI", "QWEN", "DEEPSEEK", "GEMINI"];

/**
 * Find the first provider with valid credentials in fallback order.
 * Returns null only if no provider is available at all.
 */
export function findAvailableFallback(settings: CredentialSettings): ModelRouteConfig | null {
  for (const provider of fallbackProviderOrder) {
    if (hasProviderCredential(provider, settings)) {
      return { provider, model: getDefaultModelForProvider(provider) };
    }
  }

  return null;
}

export interface ResolvedRoute {
  provider: LlmProvider;
  model: string;
  /** True if the resolved route differs from the originally configured route. */
  didFallback: boolean;
  /** The originally configured route before fallback, for logging. */
  originalProvider?: LlmProvider;
  originalModel?: string;
}

/**
 * Resolve the effective model route for a given route key.
 *
 * Resolution order:
 * 1. Explicit `overrideModel` from the call site (highest priority)
 * 2. Per-route config from `settings.llmRouting[routeKey]`
 * 3. Global fallback: `settings.llmProvider` + `settings.llmModel`
 *
 * If the resolved provider lacks credentials, automatically fall back
 * to the best available provider instead of throwing.
 */
export function resolveModelRoute(
  routeKey: ModelRouteKey | undefined,
  settings: CredentialSettings,
  overrideModel?: string,
): ResolvedRoute {
  // Step 1: determine the configured route
  const configuredRoute = routeKey ? settings.llmRouting[routeKey] : null;
  const provider = (configuredRoute?.provider ?? settings.llmProvider) as LlmProvider;
  const model = overrideModel || configuredRoute?.model || settings.llmModel;

  // Step 2: check if the configured provider has credentials
  if (hasProviderCredential(provider, settings)) {
    return { provider, model, didFallback: false };
  }

  // Step 3: credential-aware fallback
  const fallback = findAvailableFallback(settings);
  if (!fallback) {
    // No provider available at all — return the original and let the caller handle the error
    return { provider, model, didFallback: false };
  }

  return {
    provider: fallback.provider,
    model: fallback.model,
    didFallback: true,
    originalProvider: provider,
    originalModel: model,
  };
}
