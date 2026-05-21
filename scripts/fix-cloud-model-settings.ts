/**
 * T-018: Fix cloud model settings
 *
 * This script normalizes the cloud `app_settings` record so per-route model
 * routing uses the current code defaults instead of stale global values.
 *
 * Usage:
 *   npx tsx scripts/fix-cloud-model-settings.ts
 *
 * What it does:
 * 1. Reads the current `app_settings` record
 * 2. Normalizes `llm_routing_json` to the current code defaults
 *    (only fills in missing routes; preserves intentional overrides)
 * 3. If the global `llm_provider` is still set to a provider that lacks
 *    credentials, updates it to OPENAI as the safest cloud fallback
 * 4. Prints before/after for review
 *
 * Safe to run multiple times — idempotent.
 */

import { prisma } from "@/lib/db";
import { normalizeModelRoutes, defaultModelRoutes, hasProviderCredential } from "@/lib/model-routing";
import type { LlmProvider } from "@prisma/client";

async function main() {
  console.log("=== T-018: Fix Cloud Model Settings ===\n");

  const record = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  if (!record) {
    console.log("No app_settings record found. Creating one with defaults...");
    await prisma.appSettings.create({
      data: {
        id: "default",
        llm_provider: "OPENAI",
        llm_model: "gpt-5.4-mini",
        llm_mock_mode: false,
        llm_routing_json: defaultModelRoutes as never,
        news_search_provider: "GOOGLE",
        news_search_mock_mode: false,
      },
    });
    console.log("✅ Created default app_settings record.\n");
    return;
  }

  console.log("Current settings:");
  console.log(`  llm_provider: ${record.llm_provider}`);
  console.log(`  llm_model: ${record.llm_model}`);
  console.log(`  llm_mock_mode: ${record.llm_mock_mode}`);
  console.log(`  llm_routing_json: ${record.llm_routing_json ? "present" : "null"}`);
  console.log(`  news_search_mock_mode: ${record.news_search_mock_mode}`);
  console.log();

  // Normalize routing
  const currentRouting = normalizeModelRoutes(record.llm_routing_json);
  console.log("Normalized per-route routing:");
  for (const [key, config] of Object.entries(currentRouting)) {
    const isDefault = JSON.stringify(config) === JSON.stringify(defaultModelRoutes[key as keyof typeof defaultModelRoutes]);
    console.log(`  ${key}: ${config.provider}/${config.model}${isDefault ? "" : " (custom override)"}`);
  }
  console.log();

  // Check global provider credentials
  const credentialSettings = {
    openaiApiKey: record.openai_api_key || process.env.OPENAI_API_KEY || null,
    geminiApiKey: record.gemini_api_key || process.env.GEMINI_API_KEY || null,
    deepseekApiKey: record.deepseek_api_key || process.env.DEEPSEEK_API_KEY || null,
    qwenApiKey: record.qwen_api_key || process.env.QWEN_API_KEY || null,
  };

  console.log("Provider credential status:");
  const providers: LlmProvider[] = ["OPENAI", "GEMINI", "DEEPSEEK", "QWEN"];
  for (const p of providers) {
    const has = hasProviderCredential(p, credentialSettings);
    console.log(`  ${p}: ${has ? "✅ available" : "❌ no credentials"}`);
  }
  console.log();

  // Determine if global provider needs fixing
  const globalProviderAvailable = hasProviderCredential(record.llm_provider, credentialSettings);
  let newProvider = record.llm_provider;
  let newModel = record.llm_model;

  if (!globalProviderAvailable) {
    console.log(`⚠️  Global provider ${record.llm_provider} has no credentials.`);
    if (hasProviderCredential("OPENAI", credentialSettings)) {
      newProvider = "OPENAI";
      newModel = "gpt-5.4-mini";
      console.log(`   → Will update to OPENAI/gpt-5.4-mini as the safest cloud fallback.\n`);
    } else {
      console.log(`   → No OPENAI credentials either. Keeping current setting; per-route fallback will handle this at runtime.\n`);
    }
  }

  // Apply updates
  await prisma.appSettings.update({
    where: { id: "default" },
    data: {
      llm_provider: newProvider as LlmProvider,
      llm_model: newModel,
      llm_routing_json: currentRouting as never,
      // Ensure mock modes are off for cloud production
      llm_mock_mode: false,
      news_search_mock_mode: false,
    },
  });

  console.log("✅ Updated app_settings:");
  console.log(`  llm_provider: ${newProvider}`);
  console.log(`  llm_model: ${newModel}`);
  console.log(`  llm_routing_json: normalized (7 routes)`);
  console.log(`  llm_mock_mode: false`);
  console.log(`  news_search_mock_mode: false`);
  console.log();
  console.log("Done. Per-route routing will now use code defaults with credential-aware fallback.");
}

main()
  .catch((error) => {
    console.error("Failed to fix cloud model settings:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
