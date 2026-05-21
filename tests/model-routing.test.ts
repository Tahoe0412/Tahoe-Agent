import { describe, it, expect } from "vitest";
import {
  resolveModelRoute,
  findAvailableFallback,
  normalizeModelRoutes,
  defaultModelRoutes,
  type CredentialSettings,
} from "@/lib/model-routing";

function makeSettings(overrides: Partial<CredentialSettings> = {}): CredentialSettings {
  return {
    llmProvider: "OPENAI",
    llmModel: "gpt-5.4-mini",
    llmRouting: normalizeModelRoutes(null),
    openaiApiKey: "sk-test-openai",
    geminiApiKey: null,
    deepseekApiKey: null,
    qwenApiKey: null,
    ...overrides,
  };
}

describe("resolveModelRoute", () => {
  it("returns the configured per-route provider when credentials are available", () => {
    const settings = makeSettings({
      openaiApiKey: "sk-test",
      geminiApiKey: "gem-test",
    });

    const result = resolveModelRoute("SCRIPT_REWRITE", settings);
    // SCRIPT_REWRITE defaults to GEMINI, and we have gemini credentials
    expect(result.provider).toBe("GEMINI");
    expect(result.model).toBe("gemini-3.1-pro-preview");
    expect(result.didFallback).toBe(false);
  });

  it("falls back to OPENAI when configured provider (GEMINI) lacks credentials", () => {
    const settings = makeSettings({
      openaiApiKey: "sk-test",
      geminiApiKey: null, // No Gemini credentials
    });

    const result = resolveModelRoute("SCRIPT_REWRITE", settings);
    // SCRIPT_REWRITE defaults to GEMINI, but no credentials → fallback to OPENAI
    expect(result.provider).toBe("OPENAI");
    expect(result.model).toBe("gpt-5.4-mini");
    expect(result.didFallback).toBe(true);
    expect(result.originalProvider).toBe("GEMINI");
    expect(result.originalModel).toBe("gemini-3.1-pro-preview");
  });

  it("falls back to QWEN when OPENAI also lacks credentials", () => {
    const settings = makeSettings({
      openaiApiKey: null,
      geminiApiKey: null,
      qwenApiKey: "qwen-test",
    });

    const result = resolveModelRoute("SCRIPT_REWRITE", settings);
    expect(result.provider).toBe("QWEN");
    expect(result.model).toBe("qwen3.6-35b"); // first in QWEN model options
    expect(result.didFallback).toBe(true);
  });

  it("uses global provider/model when no routeKey is specified", () => {
    const settings = makeSettings({
      llmProvider: "OPENAI",
      llmModel: "gpt-5.4",
      openaiApiKey: "sk-test",
    });

    const result = resolveModelRoute(undefined, settings);
    expect(result.provider).toBe("OPENAI");
    expect(result.model).toBe("gpt-5.4");
    expect(result.didFallback).toBe(false);
  });

  it("falls back even when no routeKey is specified and global provider lacks credentials", () => {
    const settings = makeSettings({
      llmProvider: "GEMINI",
      llmModel: "gemini-2.5-pro",
      openaiApiKey: "sk-test",
      geminiApiKey: null,
    });

    const result = resolveModelRoute(undefined, settings);
    expect(result.provider).toBe("OPENAI");
    expect(result.didFallback).toBe(true);
    expect(result.originalProvider).toBe("GEMINI");
  });

  it("respects overrideModel over everything else", () => {
    const settings = makeSettings({
      openaiApiKey: "sk-test",
      geminiApiKey: "gem-test",
    });

    const result = resolveModelRoute("SCRIPT_REWRITE", settings, "custom-model-name");
    expect(result.provider).toBe("GEMINI");
    expect(result.model).toBe("custom-model-name");
    expect(result.didFallback).toBe(false);
  });

  it("returns original config when no provider has any credentials", () => {
    const settings = makeSettings({
      openaiApiKey: null,
      geminiApiKey: null,
      deepseekApiKey: null,
      qwenApiKey: null,
    });

    const result = resolveModelRoute("MARKETING_ANALYSIS", settings);
    // No fallback available — returns the configured route as-is
    expect(result.provider).toBe("OPENAI");
    expect(result.model).toBe("gpt-5.4");
    expect(result.didFallback).toBe(false);
  });

  it("PROMOTIONAL_COPY route falls back from QWEN to OPENAI when QWEN has no credentials", () => {
    const settings = makeSettings({
      openaiApiKey: "sk-test",
      qwenApiKey: null,
    });

    const result = resolveModelRoute("PROMOTIONAL_COPY", settings);
    expect(result.provider).toBe("OPENAI");
    expect(result.didFallback).toBe(true);
    expect(result.originalProvider).toBe("QWEN");
  });
});

describe("findAvailableFallback", () => {
  it("returns OPENAI first when available", () => {
    const settings = makeSettings({
      openaiApiKey: "sk-test",
      qwenApiKey: "qwen-test",
    });

    const result = findAvailableFallback(settings);
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("OPENAI");
  });

  it("returns QWEN when OPENAI is unavailable", () => {
    const settings = makeSettings({
      openaiApiKey: null,
      qwenApiKey: "qwen-test",
    });

    const result = findAvailableFallback(settings);
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("QWEN");
  });

  it("returns null when no provider has credentials", () => {
    const settings = makeSettings({
      openaiApiKey: null,
      geminiApiKey: null,
      deepseekApiKey: null,
      qwenApiKey: null,
    });

    const result = findAvailableFallback(settings);
    expect(result).toBeNull();
  });
});

describe("normalizeModelRoutes", () => {
  it("returns defaults when input is null", () => {
    const result = normalizeModelRoutes(null);
    expect(result).toEqual(defaultModelRoutes);
  });

  it("preserves valid custom overrides", () => {
    const input = {
      SCRIPT_REWRITE: { provider: "OPENAI", model: "gpt-5.4" },
    };

    const result = normalizeModelRoutes(input);
    expect(result.SCRIPT_REWRITE.provider).toBe("OPENAI");
    expect(result.SCRIPT_REWRITE.model).toBe("gpt-5.4");
    // Other routes should still be defaults
    expect(result.MARKETING_ANALYSIS).toEqual(defaultModelRoutes.MARKETING_ANALYSIS);
  });

  it("falls back invalid route configs to defaults", () => {
    const input = {
      SCRIPT_REWRITE: { provider: "INVALID_PROVIDER", model: "some-model" },
    };

    const result = normalizeModelRoutes(input);
    expect(result.SCRIPT_REWRITE).toEqual(defaultModelRoutes.SCRIPT_REWRITE);
  });
});
