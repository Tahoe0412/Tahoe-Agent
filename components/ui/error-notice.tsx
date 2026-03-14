"use client";

import { useState } from "react";
import { AlertTriangle, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { explainClientError } from "@/lib/client-api";
import type { Locale } from "@/lib/locale-copy";

export function ErrorNotice({
  error,
  locale = "zh",
  onRetry,
}: {
  error: unknown;
  locale?: Locale;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const info = explainClientError(error, locale);

  async function copyDetails() {
    const text = [
      `message: ${info.title}`,
      info.code ? `code: ${info.code}` : null,
      info.traceId ? `trace_id: ${info.traceId}` : null,
      info.detail ? `detail: ${info.detail}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--danger-text)_28%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--danger-bg)_90%,var(--surface-solid)),rgba(255,255,255,0.42))] p-4 shadow-[0_16px_40px_rgba(121,55,55,0.08)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.56)] text-[var(--danger-text)]">
          <AlertTriangle className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--danger-text)]">{info.title}</div>
          <div className="mt-1 text-sm leading-6 text-[var(--danger-text)]/90">{info.suggestion}</div>
          {info.traceId ? (
            <div className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--danger-text)]/75">
              trace id: {info.traceId}
            </div>
          ) : null}
          {info.detail ? (
            <details className="mt-3 rounded-2xl bg-[rgba(255,255,255,0.45)] px-3 py-2 text-sm text-[var(--danger-text)]">
              <summary className="cursor-pointer list-none font-medium">
                {locale === "en" ? "Technical details" : "技术细节"}
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-xs leading-6">{info.detail}</pre>
            </details>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry ? (
              <Button type="button" variant="secondary" onClick={onRetry}>
                <RotateCcw className="size-4" />
                {locale === "en" ? "Retry" : "重试"}
              </Button>
            ) : null}
            {(info.traceId || info.detail) ? (
              <Button type="button" variant="ghost" onClick={() => void copyDetails()}>
                <Copy className="size-4" />
                {copied ? (locale === "en" ? "Copied" : "已复制") : locale === "en" ? "Copy details" : "复制详情"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
