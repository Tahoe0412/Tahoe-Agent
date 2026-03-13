"use client";

export default function MarketingOpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDbError =
    error?.message?.includes("database") ||
    error?.message?.includes("prisma") ||
    error?.message?.includes("connect") ||
    error?.digest;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center">
      <h2 className="text-xl font-semibold text-[var(--text-1)]">
        {isDbError ? "数据加载暂时不可用" : "内容运营台加载失败"}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-2)]">
        {isDbError
          ? "服务器与数据库的连接暂时中断，通常会在数秒内恢复。请点击下方按钮重试。"
          : "渲染过程中发生了异常，请刷新页面或联系开发者。"}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-2xl bg-[var(--accent-strong)] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        重新加载
      </button>
      {process.env.NODE_ENV === "development" && error?.message ? (
        <pre className="mt-8 max-w-xl overflow-auto whitespace-pre-wrap break-all text-left text-xs text-[var(--text-3)]">
          {error.message}
        </pre>
      ) : null}
    </div>
  );
}
