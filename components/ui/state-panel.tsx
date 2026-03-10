import { AlertTriangle, DatabaseZap, LoaderCircle } from "lucide-react";

export function LoadingPanel({ label = "加载中..." }: { label?: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-solid)]">
      <div className="flex items-center gap-3 text-sm text-[var(--text-2)]">
        <LoaderCircle className="size-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function EmptyPanel({
  title = "暂无数据",
  description = "当前还没有可展示的数据，等待任务执行或接入真实数据源。",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-solid)] p-6">
      <div className="max-w-sm text-center">
        <DatabaseZap className="mx-auto size-5 text-[var(--text-3)]" />
        <div className="mt-3 text-sm font-medium text-[var(--text-1)]">{title}</div>
        <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{description}</div>
      </div>
    </div>
  );
}

export function ErrorPanel({
  title = "读取失败",
  description = "数据请求未成功返回。请检查 API、数据库连接或 mock 配置。",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-[28px] border border-[color:color-mix(in_srgb,var(--danger-text)_36%,transparent)] bg-[var(--danger-bg)] p-6">
      <div className="max-w-sm text-center">
        <AlertTriangle className="mx-auto size-5 text-[var(--danger-text)]" />
        <div className="mt-3 text-sm font-medium text-[var(--danger-text)]">{title}</div>
        <div className="mt-2 text-sm leading-6 text-[var(--danger-text)]">{description}</div>
      </div>
    </div>
  );
}
