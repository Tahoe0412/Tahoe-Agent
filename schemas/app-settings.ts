import { z } from "zod";

export const llmProviderSchema = z.enum(["OPENAI", "GEMINI", "DEEPSEEK", "QWEN"]);
export const searchProviderSchema = z.enum(["MOCK", "GOOGLE"]);
export const modelRouteKeySchema = z.enum([
  "MARKETING_ANALYSIS",
  "PROMOTIONAL_COPY",
  "PLATFORM_ADAPTATION",
  "SCRIPT_REWRITE",
  "SCENE_CLASSIFICATION",
  "ASSET_ANALYSIS",
  "REPORT_GENERATION",
]);
export const modelRouteConfigSchema = z.object({
  provider: llmProviderSchema,
  model: z.string().min(1).max(120),
});

export const appSettingsUpdateSchema = z.object({
  llm_provider: llmProviderSchema,
  llm_model: z.string().min(1).max(120),
  llm_mock_mode: z.boolean(),
  openai_api_key: z.string().max(500).optional().nullable(),
  gemini_api_key: z.string().max(500).optional().nullable(),
  deepseek_api_key: z.string().max(500).optional().nullable(),
  qwen_api_key: z.string().max(500).optional().nullable(),
  llm_routing_json: z.record(modelRouteKeySchema, modelRouteConfigSchema).optional(),
  news_search_provider: searchProviderSchema,
  news_search_mock_mode: z.boolean(),
  google_search_api_key: z.string().max(500).optional().nullable(),
  google_search_cx: z.string().max(200).optional().nullable(),
  app_base_url: z.string().url().optional().nullable(),
});

export type AppSettingsUpdateInput = z.infer<typeof appSettingsUpdateSchema>;
