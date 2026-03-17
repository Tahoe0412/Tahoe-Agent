"use client";

import { FileText, Clock, Newspaper, ExternalLink } from "lucide-react";

interface ScriptPreviewData {
  id: string;
  title: string | null;
  originalText: string;
  structuredOutput: unknown;
  rawPayload: unknown;
  modelName: string | null;
  sourceType: string;
  createdAt: string | Date;
}

export function ScriptPreviewPanel({
  script,
  locale = "zh",
}: {
  script: ScriptPreviewData;
  locale?: "zh" | "en";
}) {
  const t = locale === "zh";
  const structured = script.structuredOutput as {
    title?: string;
    opening?: string;
    body?: string;
    closing?: string;
    estimated_duration_sec?: number;
  } | null;
  const rawPayload = script.rawPayload as {
    origin?: string;
    search_query?: string;
    news_items?: Array<{
      title: string;
      source: string;
      url: string;
      published_at: string;
    }>;
  } | null;
  const isNewsRoundup = rawPayload?.origin === "news_roundup";
  const newsItems = rawPayload?.news_items ?? [];

  return (
    <div className="space-y-5">
      {/* Script header */}
      <div className="rounded-2xl border border-[var(--accent)]/20 bg-[linear-gradient(135deg,var(--accent-soft),rgba(255,255,255,0.6))] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-md">
            <FileText className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-[var(--text-1)] leading-tight">
              {structured?.title || script.title || (t ? "生成的脚本" : "Generated Script")}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-3)]">
              {isNewsRoundup && (
                <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-[var(--accent)] font-medium">
                  {t ? "新闻盘点" : "News Roundup"}
                </span>
              )}
              {structured?.estimated_duration_sec && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  ~{structured.estimated_duration_sec}s
                </span>
              )}
              {newsItems.length > 0 && (
                <span className="flex items-center gap-1">
                  <Newspaper className="size-3" />
                  {newsItems.length} {t ? "条新闻素材" : "sources"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Script body — structured sections */}
      {structured && (structured.opening || structured.body || structured.closing) ? (
        <div className="space-y-4">
          {structured.opening && (
            <ScriptSection
              label={t ? "开场" : "Opening"}
              accent="var(--accent)"
              text={structured.opening}
            />
          )}
          {structured.body && (
            <ScriptSection
              label={t ? "主体" : "Body"}
              accent="var(--text-1)"
              text={structured.body}
            />
          )}
          {structured.closing && (
            <ScriptSection
              label={t ? "结尾" : "Closing"}
              accent="var(--accent)"
              text={structured.closing}
            />
          )}
        </div>
      ) : (
        /* Fallback: show raw original_text */
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6">
          <div className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-1)]">
            {script.originalText}
          </div>
        </div>
      )}

      {/* Source news items */}
      {newsItems.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-3)] mb-3">
            {t ? "引用素材" : "Source Materials"} · {newsItems.length}
          </div>
          <div className="space-y-2">
            {newsItems.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2.5 text-xs transition hover:border-[var(--accent)]/40"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--text-1)] line-clamp-1">{item.title}</div>
                  <div className="mt-0.5 text-[var(--text-3)]">
                    {item.source} · {item.published_at}
                  </div>
                </div>
                <ExternalLink className="mt-0.5 size-3 shrink-0 text-[var(--text-3)]" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScriptSection({
  label,
  accent,
  text,
}: {
  label: string;
  accent: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5 shadow-sm">
      <div
        className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: accent }}
      >
        {label}
      </div>
      <div className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-1)]">
        {text}
      </div>
    </div>
  );
}
