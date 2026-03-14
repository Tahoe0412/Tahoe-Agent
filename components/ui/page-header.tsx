import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-[26px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,255,255,0.52),rgba(255,255,255,0.20))] px-5 py-5 shadow-[0_12px_30px_rgba(87,58,33,0.05)] lg:px-6">
      <div
        className="pointer-events-none absolute right-[-6rem] top-[-5rem] h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(183,186,162,0.18),transparent_68%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="theme-pill inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
            {eyebrow}
          </div>
          <div className="max-w-4xl">
            <h2 className="theme-font-display text-3xl tracking-tight text-[var(--text-1)] md:text-[3.25rem] xl:text-[3rem]">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-2)] md:text-[15px]">{description}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="relative z-[1] mt-4 h-px bg-[linear-gradient(90deg,rgba(139,141,118,0.24),transparent_70%)]" />
      <div className="relative z-[1] mt-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-3)]">
        从目标定义开始，一路推进到研究、脚本、分镜和生成执行。
      </div>
    </header>
  );
}
