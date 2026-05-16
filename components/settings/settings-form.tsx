"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { defaultModelRoutes, getDefaultModelForProvider, modelRouteKeys, providerModelOptions, type ModelRouteKey } from "@/lib/model-routing";

type SettingsPayload = {
  llmProvider: "OPENAI" | "GEMINI" | "DEEPSEEK" | "QWEN";
  llmModel: string;
  llmMockMode: boolean;
  openaiApiKey: string | null;
  geminiApiKey: string | null;
  deepseekApiKey: string | null;
  qwenApiKey: string | null;
  qwenBaseUrl: string | null;
  hasOpenaiApiKey: boolean;
  hasGeminiApiKey: boolean;
  hasDeepseekApiKey: boolean;
  hasQwenApiKey: boolean;
  llmRouting: Record<ModelRouteKey, { provider: "OPENAI" | "GEMINI" | "DEEPSEEK" | "QWEN"; model: string }>;
  newsSearchProvider: "MOCK" | "GOOGLE";
  newsSearchMockMode: boolean;
  googleSearchApiKey: string | null;
  hasGoogleSearchApiKey: boolean;
  googleSearchCx: string | null;
  appBaseUrl: string | null;
};

export function SettingsForm({ initial }: { initial: SettingsPayload }) {
  type LlmProvider = SettingsPayload["llmProvider"];
  const modelLabelMap: Record<string, string> = {
    "gpt-5.4": "GPT-5.4",
    "gpt-5.4-mini": "GPT-5.4 Mini",
    "gpt-5-mini": "GPT-5 Mini",
    "gpt-4.1": "GPT-4.1",
    "gpt-4.1-mini": "GPT-4.1 Mini",
    "gpt-4o-mini": "GPT-4o Mini",
    "gemini-3.1-pro-preview": "Gemini 3.1 Pro Preview",
    "gemini-3.1-flash-preview": "Gemini 3.1 Flash Preview",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-reasoner": "DeepSeek Reasoner",
    "qwen3-max": "Qwen 3 Max",
    "qwen3.6-35b": "Qwen 3.6 35B 本地",
    "qwen3.6-35b-a3b": "Qwen 3.6 35B A3B 本地",
    "qwen3.5-plus": "Qwen 3.5 Plus",
    "qwen3.5-flash": "Qwen 3.5 Flash",
    "qwen-max": "Qwen Max",
    "qwen-plus": "Qwen Plus",
    "qwen-turbo": "Qwen Turbo",
  };
  const routeDescriptions: Record<ModelRouteKey, string> = {
    MARKETING_ANALYSIS: "影响趋势判断、策略提炼和营销方向分析。",
    PROMOTIONAL_COPY: "直接影响宣传主稿质量，是最关键的文案模型。",
    PLATFORM_ADAPTATION: "影响小红书、抖音等平台派生稿的表达方式。",
    SCRIPT_REWRITE: "影响视频脚本拆解与镜头表达重写。",
    SCENE_CLASSIFICATION: "影响镜头类型、制作难度和生产分类。",
    ASSET_ANALYSIS: "影响素材缺口判断与上传建议。",
    REPORT_GENERATION: "影响最终总结、复盘和报告表达。",
  };
  const initialMainCustom = !providerModelOptions[initial.llmProvider].includes(initial.llmModel);
  const initialRouteCustom = Object.fromEntries(
    modelRouteKeys.map((key) => [key, !providerModelOptions[initial.llmRouting[key].provider].includes(initial.llmRouting[key].model)]),
  ) as Record<ModelRouteKey, boolean>;
  const [form, setForm] = useState({
    llm_provider: initial.llmProvider,
    llm_model: initial.llmModel,
    llm_mock_mode: initial.llmMockMode,
    openai_api_key: initial.openaiApiKey ?? "",
    gemini_api_key: initial.geminiApiKey ?? "",
    deepseek_api_key: initial.deepseekApiKey ?? "",
    qwen_api_key: initial.qwenApiKey ?? "",
    llm_routing_json: initial.llmRouting,
    news_search_provider: initial.newsSearchProvider,
    news_search_mock_mode: initial.newsSearchMockMode,
    google_search_api_key: initial.googleSearchApiKey ?? "",
    google_search_cx: initial.googleSearchCx ?? "",
    app_base_url: initial.appBaseUrl ?? "",
  });
  const [showFallbackConfig, setShowFallbackConfig] = useState(initialMainCustom);
  const [mainModelCustom, setMainModelCustom] = useState(initialMainCustom);
  const [routeModelCustom, setRouteModelCustom] = useState<Record<ModelRouteKey, boolean>>(initialRouteCustom);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasOpenaiKey = initial.hasOpenaiApiKey || Boolean(form.openai_api_key.trim());
  const hasGeminiKey = initial.hasGeminiApiKey || Boolean(form.gemini_api_key.trim());
  const hasDeepseekKey = initial.hasDeepseekApiKey || Boolean(form.deepseek_api_key.trim());
  const hasQwenKey = initial.hasQwenApiKey || Boolean(form.qwen_api_key.trim()) || Boolean(initial.qwenBaseUrl);
  const hasGoogleSearchKey = initial.hasGoogleSearchApiKey || Boolean(form.google_search_api_key.trim());
  const providerStatus = [
    { key: "OPENAI", label: "OpenAI", ready: hasOpenaiKey },
    { key: "GEMINI", label: "Gemini", ready: hasGeminiKey },
    { key: "DEEPSEEK", label: "DeepSeek", ready: hasDeepseekKey },
    { key: "QWEN", label: "Qwen / 通义千问", ready: hasQwenKey },
  ] as const;

  function updateMainProvider(provider: LlmProvider) {
    const nextModel = getDefaultModelForProvider(provider);
    setForm((current) => ({
      ...current,
      llm_provider: provider,
      llm_model: mainModelCustom
        ? current.llm_model
        : providerModelOptions[provider].includes(current.llm_model)
          ? current.llm_model
          : nextModel,
    }));
  }

  function updateRouteProvider(key: ModelRouteKey, provider: LlmProvider) {
    setForm((current) => {
      const currentRoute = current.llm_routing_json[key] ?? defaultModelRoutes[key];
      return {
        ...current,
        llm_routing_json: {
          ...current.llm_routing_json,
          [key]: {
            provider,
            model: providerModelOptions[provider].includes(currentRoute.model) ? currentRoute.model : getDefaultModelForProvider(provider),
          },
        },
      };
    });
  }

  function providerLabel(provider: LlmProvider) {
    return provider === "GEMINI" ? "Google Gemini" : provider === "DEEPSEEK" ? "DeepSeek" : provider === "QWEN" ? "Qwen / 通义千问" : "OpenAI";
  }

  function modelLabel(model: string) {
    return modelLabelMap[model] ?? model;
  }

  function providerHasCredential(provider: LlmProvider) {
    if (provider === "OPENAI") return hasOpenaiKey;
    if (provider === "GEMINI") return hasGeminiKey;
    if (provider === "DEEPSEEK") return hasDeepseekKey;
    return hasQwenKey;
  }

  function keyValueForSave(value: string, hasExisting: boolean) {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
    return hasExisting ? undefined : null;
  }

  const mainModelOptions = providerModelOptions[form.llm_provider];

  async function save() {
    setPending(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        openai_api_key: keyValueForSave(form.openai_api_key, initial.hasOpenaiApiKey),
        gemini_api_key: keyValueForSave(form.gemini_api_key, initial.hasGeminiApiKey),
        deepseek_api_key: keyValueForSave(form.deepseek_api_key, initial.hasDeepseekApiKey),
        qwen_api_key: keyValueForSave(form.qwen_api_key, initial.hasQwenApiKey),
        google_search_api_key: keyValueForSave(form.google_search_api_key, initial.hasGoogleSearchApiKey),
      }),
    });

    const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };
    if (!payload.success) {
      setError(payload.error?.detail || payload.error?.message || "保存失败。");
      setPending(false);
      return;
    }

    setMessage("设置已保存。已保存的密钥不会回显；空白密钥框会保留原值。");
    setPending(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {providerStatus.map((provider) => (
          <div key={provider.key} className="theme-panel-muted rounded-md p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">{provider.label}</div>
            <div className={`mt-3 text-sm font-medium ${provider.ready ? "text-[var(--ok-text)]" : "text-[var(--danger-text)]"}`}>
              {provider.ready ? "已检测到可用 key" : "未检测到 key"}
            </div>
          </div>
        ))}
      </div>

      <label className="theme-panel-muted flex items-center gap-3 rounded-md px-4 py-3 text-sm text-[var(--text-2)]">
        <input
          type="checkbox"
          checked={form.llm_mock_mode}
          onChange={(event) => setForm((current) => ({ ...current, llm_mock_mode: event.target.checked }))}
        />
        使用 LLM mock 模式
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">OpenAI 密钥</span>
          <input
            type="password"
            value={form.openai_api_key}
            onChange={(event) => setForm((current) => ({ ...current, openai_api_key: event.target.value }))}
            className="theme-input rounded-md px-4 py-3 text-sm"
            placeholder={initial.hasOpenaiApiKey ? "已保存，输入新 key 可覆盖" : "sk-..."}
          />
          <div className="text-xs text-[var(--text-3)]">{hasOpenaiKey ? "已检测到可用 key" : "未填写"}</div>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">Gemini 密钥</span>
          <input
            type="password"
            value={form.gemini_api_key}
            onChange={(event) => setForm((current) => ({ ...current, gemini_api_key: event.target.value }))}
            className="theme-input rounded-md px-4 py-3 text-sm"
            placeholder={initial.hasGeminiApiKey ? "已保存，输入新 key 可覆盖" : "AIza..."}
          />
          <div className="text-xs text-[var(--text-3)]">{hasGeminiKey ? "已检测到可用 key" : "未填写"}</div>
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">DeepSeek 密钥</span>
          <input
            type="password"
            value={form.deepseek_api_key}
            onChange={(event) => setForm((current) => ({ ...current, deepseek_api_key: event.target.value }))}
            className="theme-input rounded-md px-4 py-3 text-sm"
            placeholder={initial.hasDeepseekApiKey ? "已保存，输入新 key 可覆盖" : "sk-..."}
          />
          <div className="text-xs text-[var(--text-3)]">{hasDeepseekKey ? "已检测到可用 key" : "未填写"}</div>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">Qwen / 百炼 密钥</span>
          <input
            type="password"
            value={form.qwen_api_key}
            onChange={(event) => setForm((current) => ({ ...current, qwen_api_key: event.target.value }))}
            className="theme-input rounded-md px-4 py-3 text-sm"
            placeholder={initial.hasQwenApiKey ? "已保存，输入新 key 可覆盖" : "sk-..."}
          />
          <div className="text-xs text-[var(--text-3)]">{hasQwenKey ? "已检测到可用 key 或本地 Qwen" : "未填写"}</div>
        </label>
      </div>

      <div className="theme-panel-muted rounded-md px-4 py-3 text-sm leading-6 text-[var(--text-2)]">
        本地 Qwen Base URL：
        <span className="font-mono text-[var(--text-1)]">{initial.qwenBaseUrl ?? "未配置"}</span>
        。如果你的 qwen3.6-35b 通过 LM Studio / Ollama / vLLM / SGLang 暴露 OpenAI-compatible 接口，请在
        <span className="font-mono text-[var(--text-1)]"> .env.local </span>
        里设置
        <span className="font-mono text-[var(--text-1)]"> QWEN_BASE_URL </span>
        ，例如
        <span className="font-mono text-[var(--text-1)]"> http://127.0.0.1:1234/v1 </span>
        。本字段只从环境变量读取，不能在页面内保存。
      </div>

      <div className="theme-panel-muted rounded-md px-4 py-3 text-sm leading-6 text-[var(--text-2)]">
        本地如果是通过 `.env.local` 修改 API key，改完后必须重启 `npm run dev`。Next.js 不会在运行中自动重新读取这些环境变量。
      </div>

      <div className="space-y-4">
        <div className="text-sm font-semibold text-[var(--text-1)]">步骤模型路由</div>
        <div className="text-sm leading-6 text-[var(--text-2)]">这里才是日常真正会生效的模型分配。不同步骤可以选各自最合适的模型。</div>
        <div className="grid gap-4">
          {modelRouteKeys.map((key) => (
            <div key={key} className="theme-panel-muted grid gap-3 rounded-md p-4 md:grid-cols-[0.95fr_0.7fr_1fr]">
              <div>
                <div className="text-sm font-medium text-[var(--text-1)]">
                  {{
                    MARKETING_ANALYSIS: "营销分析",
                    PROMOTIONAL_COPY: "宣传文案生成",
                    PLATFORM_ADAPTATION: "平台改写",
                    SCRIPT_REWRITE: "视频脚本重写",
                    SCENE_CLASSIFICATION: "场景分类",
                    ASSET_ANALYSIS: "素材分析",
                    REPORT_GENERATION: "报告总结",
                  }[key]}
                </div>
                <div className="mt-1 text-xs leading-6 text-[var(--text-3)]">{routeDescriptions[key]}</div>
              </div>
              {(() => {
                const route = form.llm_routing_json[key] ?? defaultModelRoutes[key];
                const routeOptions = providerModelOptions[route.provider];
                return (
                  <>
              <select
                value={route.provider}
                onChange={(event) => updateRouteProvider(key, event.target.value as LlmProvider)}
                className="theme-input rounded-md px-4 py-3 text-sm"
              >
                <option value="OPENAI">OpenAI</option>
                <option value="GEMINI">Gemini</option>
                <option value="DEEPSEEK">DeepSeek</option>
                <option value="QWEN">Qwen</option>
              </select>
              <div className="grid gap-2">
                <select
                  value={routeModelCustom[key] ? "__custom__" : route.model}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "__custom__") {
                      setRouteModelCustom((current) => ({ ...current, [key]: true }));
                      return;
                    }
                    setRouteModelCustom((current) => ({ ...current, [key]: false }));
                    setForm((current) => ({
                      ...current,
                      llm_routing_json: {
                        ...current.llm_routing_json,
                        [key]: {
                          provider: route.provider,
                          model: value,
                        },
                      },
                    }));
                  }}
                  className="theme-input rounded-md px-4 py-3 text-sm"
                >
                  {routeOptions.map((model) => (
                    <option key={model} value={model}>
                      {modelLabel(model)}
                    </option>
                  ))}
                  <option value="__custom__">自定义模型名称</option>
                </select>
                {routeModelCustom[key] ? (
                  <input
                    value={route.model}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        llm_routing_json: {
                          ...current.llm_routing_json,
                          [key]: {
                            provider: route.provider,
                            model: event.target.value,
                          },
                        },
                      }))
                    }
                    className="theme-input rounded-md px-4 py-3 text-sm"
                    placeholder={getDefaultModelForProvider(route.provider)}
                  />
                ) : null}
                <div className="text-xs text-[var(--text-3)]">
                  {!form.llm_mock_mode && !providerHasCredential(route.provider)
                    ? route.provider === "QWEN" && !initial.qwenBaseUrl
                      ? "当前未填写 Qwen key，也未配置 QWEN_BASE_URL"
                      : `当前未填写 ${providerLabel(route.provider)} key`
                    : `当前会使用 ${providerLabel(route.provider)} / ${modelLabel(route.model)}`}
                </div>
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      <div className="theme-panel-muted rounded-md p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--text-1)]">全局兜底模型（高级）</div>
            <div className="mt-1 text-sm leading-6 text-[var(--text-2)]">
              只有某个新功能还没单独配置步骤路由时，系统才会退回这里。平时可以不动。
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => setShowFallbackConfig((value) => !value)}>
            {showFallbackConfig ? "收起高级兜底" : "展开高级兜底"}
          </Button>
        </div>

        {showFallbackConfig ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">兜底服务商</span>
              <select
                value={form.llm_provider}
                onChange={(event) => updateMainProvider(event.target.value as LlmProvider)}
                className="theme-input rounded-md px-4 py-3 text-sm"
              >
                <option value="OPENAI">OpenAI</option>
                <option value="GEMINI">Google Gemini</option>
                <option value="DEEPSEEK">DeepSeek</option>
                <option value="QWEN">Qwen / 通义千问</option>
              </select>
            </label>

            <div className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">兜底模型</span>
              <select
                value={mainModelCustom ? "__custom__" : form.llm_model}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "__custom__") {
                    setMainModelCustom(true);
                    return;
                  }
                  setMainModelCustom(false);
                  setForm((current) => ({ ...current, llm_model: value }));
                }}
                className="theme-input rounded-md px-4 py-3 text-sm"
              >
                {mainModelOptions.map((model) => (
                  <option key={model} value={model}>
                    {modelLabel(model)}
                  </option>
                ))}
                <option value="__custom__">自定义模型名称</option>
              </select>
              {mainModelCustom ? (
                <input
                  value={form.llm_model}
                  onChange={(event) => setForm((current) => ({ ...current, llm_model: event.target.value }))}
                  className="theme-input rounded-md px-4 py-3 text-sm"
                  placeholder={getDefaultModelForProvider(form.llm_provider)}
                />
              ) : null}
              <div className="text-xs text-[var(--text-3)]">当前兜底服务商：{providerLabel(form.llm_provider)}。</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">新闻搜索提供方</span>
          <select
            value={form.news_search_provider}
            onChange={(event) => setForm((current) => ({ ...current, news_search_provider: event.target.value as "MOCK" | "GOOGLE" }))}
            className="theme-input rounded-md px-4 py-3 text-sm"
          >
            <option value="MOCK">Mock</option>
            <option value="GOOGLE">Google Custom Search</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">Google Search API Key</span>
          <input
            type="password"
            value={form.google_search_api_key}
            onChange={(event) => setForm((current) => ({ ...current, google_search_api_key: event.target.value }))}
            className="theme-input rounded-md px-4 py-3 text-sm"
            placeholder={initial.hasGoogleSearchApiKey ? "已保存，输入新 key 可覆盖" : "AIza..."}
          />
          <div className="text-xs text-[var(--text-3)]">{hasGoogleSearchKey ? "已检测到可用 key" : "未填写"}</div>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">Google Search CX</span>
        <input
          value={form.google_search_cx}
          onChange={(event) => setForm((current) => ({ ...current, google_search_cx: event.target.value }))}
          className="theme-input rounded-md px-4 py-3 text-sm"
          placeholder="custom-search-engine-id"
        />
      </label>

      <label className="theme-panel-muted flex items-center gap-3 rounded-md px-4 py-3 text-sm text-[var(--text-2)]">
        <input
          type="checkbox"
          checked={form.news_search_mock_mode}
          onChange={(event) => setForm((current) => ({ ...current, news_search_mock_mode: event.target.checked }))}
        />
        使用新闻搜索 mock 模式
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">应用地址</span>
        <input
          value={form.app_base_url}
          onChange={(event) => setForm((current) => ({ ...current, app_base_url: event.target.value }))}
          className="theme-input rounded-md px-4 py-3 text-sm"
          placeholder="http://localhost:3001"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button onClick={() => void save()} disabled={pending}>
          {pending ? "保存中..." : "保存设置"}
        </Button>
        {message ? <div className="text-sm text-[var(--ok-text)]">{message}</div> : null}
        {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
      </div>

      <div className="theme-panel-muted rounded-md px-4 py-3 text-sm leading-6 text-[var(--text-2)]">
        当前有效模型路径：
        {form.llm_mock_mode
          ? " LLM mock 模式已开启，真实模型不会被调用。"
          : ` 步骤模型路由优先；如果某一步没有单独配置，才会退回 ${providerLabel(form.llm_provider)} / ${modelLabel(form.llm_model)}。`}
        {!form.llm_mock_mode && !providerHasCredential(form.llm_provider)
          ? form.llm_provider === "QWEN" && !initial.qwenBaseUrl
            ? " 但当前没有填写 Qwen key，也没有配置 QWEN_BASE_URL。"
            : ` 但当前没有填写 ${providerLabel(form.llm_provider)} key。`
          : null}
      </div>
    </div>
  );
}
