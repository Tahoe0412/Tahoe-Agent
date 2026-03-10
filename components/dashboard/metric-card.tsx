import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
}) {
  return (
    <div className="theme-panel rounded-[24px] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-2)]">{label}</p>
        <div className="rounded-full bg-[var(--surface-muted)] p-2 text-[var(--accent-strong)]">{icon}</div>
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text-1)]">{value}</div>
      <p className="mt-2 text-sm text-[var(--text-2)]">{caption}</p>
    </div>
  );
}
