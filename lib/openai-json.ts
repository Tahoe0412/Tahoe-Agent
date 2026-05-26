import type { ZodSchema } from "zod";

import { AppSettingsService } from "@/services/app-settings.service";
import { resolveModelRoute, type ModelRouteKey } from "@/lib/model-routing";

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
  /** Per-call timeout in milliseconds. Defaults to 120 000 (2 minutes), or a longer local Qwen timeout for localhost endpoints. */
  timeoutMs?: number;
  /** Set true for long-form content generation (e.g. article drafts). On local Qwen this enables thinking, removes brevity instructions, and increases max_tokens. */
  longForm?: boolean;
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

function envNumber(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function isLocalUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function formatTimeout(ms: number) {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.round(seconds / 60)} 分钟` : `${seconds} 秒`;
}

function localQwenTimeoutMs() {
  const qwenFallback = envNumber("QWEN_TIMEOUT_MS", 600_000, 30_000, 1_800_000);
  return envNumber("LOCAL_QWEN_TIMEOUT_MS", qwenFallback, 30_000, 1_800_000);
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
    // Strip <think>...</think> tags from thinking models (qwen3, etc.)
    .replace(/<think>[\s\S]*?<\/think>/g, "")
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
    if (candidate) {
      try {
        return JSON.parse(candidate);
      } catch {
        // fall through to truncation repair
      }
    }

    // Attempt to repair truncated JSON (e.g. max_tokens hit mid-output)
    if (objectStart >= 0 && objectEnd <= objectStart) {
      const truncated = cleaned.slice(objectStart);
      // Close any open JSON string value, then close the object
      const repaired = truncated.replace(/,?\s*$/, "") + '"}';
      try {
        return JSON.parse(repaired);
      } catch {
        // Try harder: close with empty remaining fields
        const repaired2 = truncated.replace(/,?\s*"?[^"]*$/, '') + '"}';
        try {
          return JSON.parse(repaired2);
        } catch {
          console.warn(`[openai-json] ${label} JSON truncated and repair failed. Preview:`, truncated.slice(0, 500));
        }
      }
    }

    if (!candidate) {
      console.warn(`[openai-json] ${label} returned non-JSON preview:`, cleaned.slice(0, 1000));
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
  longForm,
}: StructuredJsonParams<T> & { apiKey: string; model: string; baseUrl?: string; strictJsonSchema?: boolean }) {
  const localEndpoint = isLocalUrl(baseUrl);
  const effectiveTimeout = timeoutMs ?? (localEndpoint ? localQwenTimeoutMs() : 120_000);
  const promptOnlyJson = strictJsonSchema === false || localEndpoint;
  const effectiveTemperature = localEndpoint
    ? envNumber("QWEN_TEMPERATURE", temperature, 0, 1.5)
    : temperature;
  const qwenTopP = localEndpoint ? envNumber("QWEN_TOP_P", 0.85, 0.05, 1) : null;
  const defaultLocalMax = longForm
    ? envNumber("QWEN_LONG_FORM_MAX_TOKENS", 32768, 4096, 65536)
    : envNumber("QWEN_MAX_TOKENS", 8192, 256, 32768);
  const qwenMaxTokens = localEndpoint
    ? Math.round(defaultLocalMax)
    : 8192;
  const userContent = promptOnlyJson
    ? [
        ...(localEndpoint && !longForm ? ["/no_think"] : []),
        userPrompt,
        "",
        `Return valid JSON only for schema "${schemaName}".`,
        "Do not include markdown fences or commentary.",
        `JSON schema reference:\n${JSON.stringify(schema)}`,
      ].join("\n")
    : userPrompt;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  const requestBody = {
    model,
    temperature: effectiveTemperature,
    ...(qwenTopP ? { top_p: qwenTopP } : {}),
    max_tokens: qwenMaxTokens,
    messages: [
      {
        role: "system",
        content: localEndpoint
          ? (longForm
            ? [
                "你是一个长文写作助手。",
                "输出必须是一个满足 schema 要求的 JSON 对象。",
                "JSON 中的文章字段（opening、body、closing、full_text）必须写足要求的字数，不要偷懒缩短。",
                systemPrompt,
              ].join("\n")
            : [
                "/no_think",
                "不要输出思考过程。",
                "不要解释。",
                "直接输出满足要求的 JSON。",
                systemPrompt,
              ].join("\n"))
          : systemPrompt,
      },
      { role: "user", content: userContent },
    ],
    ...(localEndpoint && !longForm
      ? {
          reasoning_effort: "none",
          enable_thinking: false,
          chat_template_kwargs: {
            enable_thinking: false,
          },
        }
      : {}),
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
  };

  let response: Response;
  try {
    response = await fetch(baseUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    if (isAbortError(error)) {
      const providerLabel = localEndpoint ? "本地 Qwen" : "OpenAI";
      throw new Error(`${providerLabel}(${model}) 生成超时（${formatTimeout(effectiveTimeout)}）。如果正在生成长文包，请调高 LOCAL_QWEN_TIMEOUT_MS 或换更快的模型/更短输入后重试。`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI(${model}) request failed with ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as OpenAIChatCompletionResponse;
  let content = payload.choices?.[0]?.message?.content;
  const reasoningContent = (payload.choices?.[0]?.message as { reasoning_content?: unknown } | undefined)?.reasoning_content;
  if (!content && localEndpoint && typeof reasoningContent === "string" && reasoningContent.trim()) {
    console.warn(`[openai-json] Empty content from ${model}; retrying local Qwen with stricter no-thinking prompt.`);
    const retryResponse = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...requestBody,
        max_tokens: qwenMaxTokens ?? 32768,
        reasoning_effort: "none",
        enable_thinking: false,
        chat_template_kwargs: { enable_thinking: false },
        messages: [
          {
            role: "system",
            content: [
              "/no_think",
              "你是一个 JSON 生成器。",
              "不要输出思考过程。",
              "不要解释。",
              "只输出一个满足 schema 的 JSON 对象。",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              "/no_think",
              systemPrompt,
              userContent,
              `Return valid JSON only for schema "${schemaName}".`,
              "Do not include markdown fences or commentary.",
              `JSON schema reference:\n${JSON.stringify(schema)}`,
            ].join("\n\n"),
          },
        ],
      }),
    });
    if (retryResponse.ok) {
      const retryPayload = (await retryResponse.json()) as OpenAIChatCompletionResponse;
      content = retryPayload.choices?.[0]?.message?.content;
    }
  }
  if (!content) {
    console.warn(
      `[openai-json] Empty content from ${model}.`,
      JSON.stringify(payload.choices?.[0] ?? {}).slice(0, 1000),
    );
    throw new Error(`OpenAI(${model}) returned an empty response.`);
  }

  let parsed: unknown;
  try {
    parsed = parseJsonContent(content, `OpenAI(${model})`);
  } catch (error) {
    if (localEndpoint && schemaName === "mars_citizen_narrative" && content.trim().length > 50) {
      console.warn(`[openai-json] Falling back to raw local Qwen narrative text for ${schemaName}.`);
      parsed = content;
    } else {
      throw error;
    }
  }
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
          maxOutputTokens: 65536,
        },
      }),
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`Gemini(${model}) 生成超时（${formatTimeout(effectiveTimeout2)}）。请稍后重试，或为这次调用配置更长 timeoutMs。`);
    }
    throw error;
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
  const resolved = resolveModelRoute(params.routeKey, settings, params.model);

  if (resolved.didFallback) {
    console.warn(
      `[model-routing] Route "${params.routeKey ?? "default"}" fallback: ` +
      `${resolved.originalProvider}/${resolved.originalModel} → ${resolved.provider}/${resolved.model} ` +
      `(original provider lacks credentials)`,
    );
  }

  const provider = resolved.provider;
  const model = provider === "GEMINI" ? normalizeGeminiModel(resolved.model) : resolved.model;

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
