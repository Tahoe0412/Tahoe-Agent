import type { ReactNode } from "react";
import { AlertTriangle, DatabaseZap, LoaderCircle } from "lucide-react";
import type { Locale } from "@/lib/locale-copy";

function getStateText(locale: Locale) {
  return locale === "en"
    ? {
        loadingEyebrow: "Working",
        emptyEyebrow: "Stand by",
        errorEyebrow: "Needs attention",
        loadingLabel: "Loading...",
        emptyTitle: "No data yet",
        emptyDescription: "There is nothing to show yet. Wait for the task to run or connect a real data source.",
        errorTitle: "Could not load data",
        errorDescription: "The request did not complete successfully. Check the API, database connection, or mock setup.",
      }
    : {
        loadingEyebrow: "处理中",
        emptyEyebrow: "等待开始",
        errorEyebrow: "需要处理",
        loadingLabel: "加载中...",
        emptyTitle: "暂无数据",
        emptyDescription: "当前还没有可展示的数据，等待任务执行或接入真实数据源。",
        errorTitle: "读取失败",
        errorDescription: "数据请求未成功返回。请检查 API、数据库连接或 mock 配置。",
      };
}

export function LoadingPanel({ label, locale = "zh" }: { label?: string; locale?: Locale }) {
  const text = getStateText(locale);
  return (
    <div className="theme-panel flex min-h-64 items-center justify-center py-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent-strong)]">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
        <div className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-3)]">{text.loadingEyebrow}</div>
        <div className="mt-2 text-base font-medium text-[var(--text-1)]">{label ?? text.loadingLabel}</div>
      </div>
    </div>
  );
}

export function EmptyPanel({
  title = "暂无数据",
  description = "当前还没有可展示的数据，等待任务执行或接入真实数据源。",
  action,
  locale = "zh",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  locale?: Locale;
}) {
  const text = getStateText(locale);
  return (
    <div className="theme-panel flex min-h-72 items-center justify-center border-dashed py-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--slate-blue)]">
          <DatabaseZap className="size-6" />
        </div>
        <div className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{text.emptyEyebrow}</div>
        <div className="mt-2 text-2xl font-semibold text-[var(--text-1)]">{title ?? text.emptyTitle}</div>
        <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">{description ?? text.emptyDescription}</div>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorPanel({
  title = "读取失败",
  description = "数据请求未成功返回。请检查 API、数据库连接或 mock 配置。",
  action,
  locale = "zh",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  locale?: Locale;
}) {
  const text = getStateText(locale);
  return (
    <div className="flex min-h-64 items-center justify-center border-y border-[color:color-mix(in_srgb,var(--danger-text)_32%,transparent)] bg-[var(--danger-bg)] py-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md border border-[color:color-mix(in_srgb,var(--danger-text)_32%,transparent)] bg-transparent text-[var(--danger-text)]">
          <AlertTriangle className="size-6" />
        </div>
        <div className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--danger-text)]">{text.errorEyebrow}</div>
        <div className="mt-2 text-2xl font-semibold text-[var(--danger-text)]">{title ?? text.errorTitle}</div>
        <div className="mt-3 text-sm leading-7 text-[var(--danger-text)]">{description ?? text.errorDescription}</div>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
