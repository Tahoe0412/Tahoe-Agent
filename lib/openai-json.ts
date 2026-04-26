import type { ZodSchema } from "zod";
import type { LlmProvider } from "@prisma/client";
import { AppSettingsService } from "@/services/app-settings.service";
import type { ModelRouteKey } from "@/lib/model-routing";

interface StructuredJsonParams<T> {
  schemaName: string;
  schema: Record<string, unknown>;
  zodSchema?: ZodSchema<T>;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  routeKey?: ModelRouteKey;
  preprocess?: (value: unknown) => unknown;
  temperature?: number;
  /** Per-call timeout in milliseconds. Defaults to 120 000 (2 minutes). */
  timeoutMs?: number;
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const appSettingsService = new AppSettingsService();

function isLocalUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function normalizeChatCompletionsUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) {
    return trimmed;
  }
  if (trimmed.endsWith("/v1")) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/v1/chat/completions`;
}

function parseJsonContent(content: string, label: string) {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");
    const objectCandidate = objectStart >= 0 && objectEnd > objectStart ? cleaned.slice(objectStart, objectEnd + 1) : "";
    const arrayCandidate = arrayStart >= 0 && arrayEnd > arrayStart ? cleaned.slice(arrayStart, arrayEnd + 1) : "";
    const candidate = objectCandidate || arrayCandidate;
    if (!candidate) {
      throw new Error(`${label} returned non-JSON content.`);
    }
    return JSON.parse(candidate);
  }
}

function normalizeGeminiModel(model: string) {
  const normalized = model.trim();
  const aliases: Record<string, string> = {
    "gemini-3.1-pro-preview": "gemini-3-pro-preview",
    "gemini-3.1-flash-preview": "gemini-3-flash-preview",
  };

  return aliases[normalized] ?? normalized;
}

async function requestOpenAI<T>({
  baseUrl = "https://api.openai.com/v1/chat/completions",
  apiKey,
  model,
  schemaName,
  schema,
  zodSchema,
  systemPrompt,
  userPrompt,
  preprocess,
  temperature = 0.2,
  timeoutMs,
  strictJsonSchema,
}: StructuredJsonParams<T> & { apiKey: string; model: string; baseUrl?: string; strictJsonSchema?: boolean }) {
  const effectiveTimeout = timeoutMs ?? 120_000;
  const promptOnlyJson = strictJsonSchema === false || isLocalUrl(baseUrl);
  const userContent = promptOnlyJson
    ? [
        userPrompt,
        "",
        `Return valid JSON only for schema "${schemaName}".`,
        "Do not include markdown fences or commentary.",
        `JSON schema reference:\n${JSON.stringify(schema)}`,
      ].join("\n")
    : userPrompt;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  let response: Response;
  try {
    response = await fetch(baseUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        ...(promptOnlyJson
          ? {}
          : {
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: schemaName,
                  strict: true,
                  schema,
                },
              },
            }),
      }),
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI(${model}) request failed with ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as OpenAIChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`OpenAI(${model}) returned an empty response.`);
  }

  const parsed = parseJsonContent(content, `OpenAI(${model})`);
  const preprocessed = preprocess ? preprocess(parsed) : parsed;
  if (zodSchema) {
    const result = zodSchema.safeParse(preprocessed);
    if (result.success) return result.data;
    console.warn(`[openai-json] Zod validation failed for ${schemaName}, returning raw data for caller fallback.`, result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return preprocessed as T;
}

async function requestGemini<T>({
  apiKey,
  model,
  schema,
  zodSchema,
  schemaName,
  systemPrompt,
  userPrompt,
  preprocess,
  temperature = 0.2,
  timeoutMs,
}: StructuredJsonParams<T> & { apiKey: string; model: string }) {
  const effectiveTimeout2 = timeoutMs ?? 120_000;
  const controller2 = new AbortController();
  const timeoutId2 = setTimeout(() => controller2.abort(), effectiveTimeout2);
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: controller2.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  userPrompt,
                  "",
                  `Return valid JSON only for schema "${schemaName}".`,
                  "Do not include markdown fences or commentary.",
                  `JSON schema reference:\n${JSON.stringify(schema)}`,
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      }),
    });
  } finally {
    clearTimeout(timeoutId2);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini(${model}) request failed with ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!content) {
    throw new Error(`Gemini(${model}) returned an empty response.`);
  }

  const parsed = parseJsonContent(content, `Gemini(${model})`);
  const preprocessed = preprocess ? preprocess(parsed) : parsed;
  if (zodSchema) {
    const result = zodSchema.safeParse(preprocessed);
    if (result.success) return result.data;
    console.warn(`[gemini-json] Zod validation failed for ${schemaName}, returning raw data for caller fallback.`, result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return preprocessed as T;
}

export async function generateStructuredJson<T>(params: StructuredJsonParams<T>): Promise<T> {
  const settings = await appSettingsService.getEffectiveSettings();
  const configuredRoute = params.routeKey ? settings.llmRouting[params.routeKey] : null;
  const provider = (configuredRoute?.provider ?? settings.llmProvider) as LlmProvider;
  const configuredModel = params.model || configuredRoute?.model || settings.llmModel;
  const model = provider === "GEMINI" ? normalizeGeminiModel(configuredModel) : configuredModel;

  switch (provider) {
    case "OPENAI":
      if (!settings.openaiApiKey) {
        throw new Error(`OPENAI_API_KEY is missing for provider ${provider}.`);
      }
      return requestOpenAI({
        ...params,
        apiKey: settings.openaiApiKey,
        model,
      });
    case "DEEPSEEK":
      if (!settings.deepseekApiKey) {
        throw new Error(`DEEPSEEK_API_KEY is missing for provider ${provider}.`);
      }
      return requestOpenAI({
        ...params,
        apiKey: settings.deepseekApiKey,
        model,
        baseUrl: "https://api.deepseek.com/chat/completions",
      });
    case "QWEN":
      if (!settings.qwenApiKey && !settings.qwenBaseUrl) {
        throw new Error(`QWEN_API_KEY or QWEN_BASE_URL is missing for provider ${provider}.`);
      }
      return requestOpenAI({
        ...params,
        apiKey: settings.qwenApiKey ?? "local-qwen",
        model,
        baseUrl: settings.qwenBaseUrl
          ? normalizeChatCompletionsUrl(settings.qwenBaseUrl)
          : "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        strictJsonSchema: !settings.qwenBaseUrl,
      });
    case "GEMINI":
    default:
      if (!settings.geminiApiKey) {
        throw new Error(`GEMINI_API_KEY is missing for provider ${provider}.`);
      }
      return requestGemini({
        ...params,
        apiKey: settings.geminiApiKey,
        model,
      });
  }
}
