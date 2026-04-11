"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { normalizeAudiencePanelReview, type AudiencePanelReview } from "@/lib/copy-review-panel";
import {
  FileText,
  Clock,
  Newspaper,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";
import { useSceneSplitStatus } from "@/hooks/use-scene-split-status";

interface ScriptPreviewData {
  id: string;
  title: string | null;
  originalText: string;
  structuredOutput: unknown;
  rawPayload: unknown;
  modelName: string | null;
  sourceType: string;
  createdAt: string | Date;
  versionNumber?: number;
}

export function ScriptPreviewPanel({
  script,
  locale = "zh",
}: {
  script: ScriptPreviewData;
  locale?: "zh" | "en";
}) {
  const t = locale === "zh";
  const router = useRouter();
  const structured = script.structuredOutput as {
    title?: string;
    opening?: string;
    body?: string;
    closing?: string;
    estimated_duration_sec?: number;
    scene_split_status?: string;
    audience_panel_review?: AudiencePanelReview | null;
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
  const audiencePanel = normalizeAudiencePanelReview(structured?.audience_panel_review);

  // Determine if we should poll
  const initialStatus = structured?.scene_split_status;
  const shouldPoll =
    initialStatus === "pending" || initialStatus === "splitting";

  const { status: splitStatus, isPolling } = useSceneSplitStatus(
    shouldPoll ? script.id : null,
    { enabled: shouldPoll },
  );

  // When split is done, refresh the page to let RSC re-render with scenes
  const currentSplitStatus =
    splitStatus?.scene_split_status ?? initialStatus ?? "unknown";
  const sceneCount = splitStatus?.scene_count ?? 0;

  useEffect(() => {
    if (currentSplitStatus === "done" && sceneCount > 0) {
      // Small delay to let data settle, then refresh
      const timer = setTimeout(() => router.refresh(), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentSplitStatus, sceneCount, router]);

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
              {script.versionNumber ? (
                <span>v{script.versionNumber}</span>
              ) : null}
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

      {/* Scene split status banner */}
      <SceneSplitBanner
        status={currentSplitStatus}
        sceneCount={sceneCount}
        isPolling={isPolling}
        error={splitStatus?.scene_split_error ?? null}
        locale={locale}
        onRetry={() => {
          fetch(`/api/scripts/${script.id}/split-scenes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ force: true }),
          }).then(() => router.refresh());
        }}
      />

      <AudiencePanelSummary panel={audiencePanel} locale={locale} />

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

function AudiencePanelSummary({
  panel,
  locale,
}: {
  panel: AudiencePanelReview | null;
  locale: "zh" | "en";
}) {
  if (!panel) {
    return null;
  }

  const t = locale === "zh";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">
            {t ? "主稿观众评分" : "Audience panel"}
          </div>
          <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
            {t
              ? "先看这版主稿是否像一篇能发的内容，而不是只看 scene 有没有拆出来。"
              : "Judge whether this draft reads like a publishable piece, not just a script that splits into scenes."}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MetricChip label={t ? "平均分" : "Average"} value={panel.averageScore} />
          <MetricChip label={t ? "媒体贴合度" : "Style fit"} value={panel.styleFitScore} />
          <MetricChip
            label={t ? "发布判断" : "Readiness"}
            value={panel.publishReadiness === "READY" ? (t ? "可继续" : "Ready") : (t ? "先修" : "Revise")}
            tone={panel.publishReadiness === "READY" ? "success" : "danger"}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[var(--surface-muted)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">
            {t ? "总判断" : "Verdict"}
          </div>
          <div className="mt-2 text-sm leading-7 text-[var(--text-1)]">{panel.overallVerdict}</div>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">
            {t ? "媒体校准" : "Calibration"}
          </div>
          <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{panel.calibrationSummary}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {panel.reviewers.map((reviewer) => (
          <div key={reviewer.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--text-1)]">{reviewer.label}</div>
              <span className="text-sm font-semibold text-[var(--text-1)]">{reviewer.score}</span>
            </div>
            <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{reviewer.verdict}</div>
            {reviewer.concerns.length ? (
              <div className="mt-3 space-y-1 text-sm leading-6 text-[var(--text-2)]">
                {reviewer.concerns.slice(0, 2).map((item) => (
                  <div key={item}>- {item}</div>
                ))}
              </div>
            ) : null}
            <div className="mt-3 text-sm leading-6 text-[var(--text-2)]">
              {t ? "下一步：" : "Next:"} {reviewer.nextAction}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "success";
}) {
  const className =
    tone === "danger"
      ? "theme-chip-danger"
      : tone === "success"
        ? "theme-chip-ok"
        : "theme-chip";

  return (
    <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${className}`}>
      {label} {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SceneSplitBanner({
  status,
  sceneCount,
  isPolling,
  error,
  locale,
  onRetry,
}: {
  status: string;
  sceneCount: number;
  isPolling: boolean;
  error: string | null;
  locale: "zh" | "en";
  onRetry: () => void;
}) {
  const t = locale === "zh";

  if (status === "pending" || status === "splitting" || isPolling) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-5 py-3.5">
        <Loader2 className="size-4 animate-spin text-[var(--accent)]" />
        <span className="text-sm text-[var(--text-2)]">
          {t ? "正在拆分场景…" : "Splitting into scenes…"}
        </span>
      </div>
    );
  }

  if (status === "done" && sceneCount > 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-50/60 px-5 py-3.5">
        <CheckCircle2 className="size-4 text-emerald-600" />
        <span className="text-sm text-emerald-800">
          {t
            ? `已拆分为 ${sceneCount} 个场景，正在刷新…`
            : `Split into ${sceneCount} scenes, refreshing…`}
        </span>
        <LayoutGrid className="ml-auto size-4 text-emerald-600" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-300/30 bg-red-50/60 px-5 py-3.5">
        <AlertTriangle className="size-4 text-red-500" />
        <span className="text-sm text-red-700">
          {t ? "场景拆分失败" : "Scene split failed"}
          {error ? `: ${error}` : ""}
        </span>
        <button
          onClick={onRetry}
          className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200"
        >
          {t ? "重试" : "Retry"}
        </button>
      </div>
    );
  }

  // status === "unknown" or no status — don't show anything
  return null;
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
