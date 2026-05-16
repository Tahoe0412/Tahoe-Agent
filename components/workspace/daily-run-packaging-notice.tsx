"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DailyRunPackagingNotice({
  isOwnedMediaPackage,
  packagingIncomplete,
  packagingStatus,
  hasTitlePack,
  hasPublishCopy,
  hasImageBrief,
  locale = "zh",
}: {
  isOwnedMediaPackage?: boolean;
  packagingIncomplete?: boolean;
  packagingStatus?: string | null;
  hasTitlePack?: boolean;
  hasPublishCopy?: boolean;
  hasImageBrief?: boolean;
  locale?: "zh" | "en";
}) {
  const router = useRouter();
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isEn = locale === "en";

  useEffect(() => {
    try {
      const message = window.sessionStorage.getItem("daily-run-last-warning");
      if (message) {
        setSessionMessage(message);
        window.sessionStorage.removeItem("daily-run-last-warning");
      }
    } catch {}
  }, []);

  if (!isOwnedMediaPackage || !packagingIncomplete) {
    return null;
  }

  const message = packagingStatus === "FAILED"
    ? isEn
      ? "The package did not fully complete. Refresh once; if anything is still missing, fill it manually."
      : "文章包没有补齐完整。先刷新一次；仍缺内容时再手动补。"
    : sessionMessage || (
      isEn
        ? "The draft is ready. Titles, publish copy, and image briefs may still be completing."
        : "正文已完成，标题 / 发布文案 / 配图说明稍后自动补齐。可以先改正文。"
    );
  const steps = [
    { label: isEn ? "Main draft" : "正文", done: true },
    { label: isEn ? "Titles" : "标题", done: Boolean(hasTitlePack) },
    { label: isEn ? "Publish copy" : "发布文案", done: Boolean(hasPublishCopy) },
    { label: isEn ? "Image brief" : "配图说明", done: Boolean(hasImageBrief) },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const progressPercent = packagingStatus === "FAILED"
    ? Math.max(25, Math.round((doneCount / steps.length) * 100))
    : packagingStatus === "DONE"
      ? 100
      : Math.max(25, Math.round((doneCount / steps.length) * 100));

  function refreshStatus() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 1200);
  }

  return (
    <div className="theme-panel-muted rounded-[18px] px-5 py-4 text-sm leading-6 text-[var(--text-2)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Loader2 className="mt-1 size-4 shrink-0 animate-spin" />
          <div>
            <div className="font-semibold text-[var(--text-1)]">
              {packagingStatus === "FAILED"
                ? isEn
                  ? "Article package needs completion"
                  : "文章包需要补齐"
                : isEn
                  ? "Article package is being generated"
                  : "文章包生成中"}
            </div>
            <div className="mt-1 text-[var(--text-2)]">
              {message} {isEn ? "You can edit the draft first, then refresh later." : "可以先改正文，稍后点刷新。"}
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={refreshStatus}
          disabled={refreshing}
          className="h-auto shrink-0 px-3 py-2 text-xs"
        >
          {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {isEn ? "Refresh status" : "刷新状态"}
        </Button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">
          <span>{isEn ? "Package progress" : "整包进度"}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-solid)]">
          <div
            className={[
              "h-full rounded-full transition-all duration-700",
              packagingStatus === "FAILED" ? "bg-[var(--danger-text)]" : "bg-[var(--accent-strong)]",
            ].join(" ")}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2"
          >
            <span
              className={[
                "size-2.5 rounded-full",
                step.done
                  ? "bg-[var(--ok-text)]"
                  : packagingStatus === "FAILED"
                    ? "bg-[var(--danger-text)]"
                    : "animate-pulse bg-[var(--warning-text)]",
              ].join(" ")}
            />
            <span className={step.done ? "font-medium text-[var(--text-1)]" : "text-[var(--text-2)]"}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
