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
    <div className="theme-panel flex min-h-48 items-center justify-center px-5 py-5">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-[14px] border border-[var(--border)] bg-transparent text-[var(--accent-strong)]">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
        <div className="theme-kicker mt-4 text-[11px] font-medium text-[var(--text-3)]">{text.loadingEyebrow}</div>
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
    <div className="theme-panel flex min-h-56 items-center justify-center border-dashed px-5 py-5">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-[14px] border border-[var(--border)] bg-transparent text-[var(--slate-blue)]">
          <DatabaseZap className="size-5" />
        </div>
        <div className="theme-kicker mt-4 text-[11px] font-medium text-[var(--text-3)]">{text.emptyEyebrow}</div>
        <div className="mt-2 text-xl font-semibold text-[var(--text-1)]">{title ?? text.emptyTitle}</div>
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
    <div className="flex min-h-0 items-start border-y border-[color:color-mix(in_srgb,var(--danger-text)_24%,transparent)] bg-transparent py-4">
      <div className="flex max-w-3xl items-start gap-3 text-left">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[14px] border border-[color:color-mix(in_srgb,var(--danger-text)_24%,transparent)] bg-transparent text-[var(--danger-text)]">
          <AlertTriangle className="size-4" />
        </div>
        <div>
          <div className="theme-kicker text-[11px] font-medium text-[var(--danger-text)]">{text.errorEyebrow}</div>
          <div className="mt-1 text-base font-semibold text-[var(--danger-text)]">{title ?? text.errorTitle}</div>
          <div className="mt-1 text-sm leading-6 text-[var(--danger-text)]">{description ?? text.errorDescription}</div>
          {action ? <div className="mt-3 flex">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
