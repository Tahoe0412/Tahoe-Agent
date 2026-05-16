import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DetailPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("theme-panel px-5 py-5 sm:px-6", className)}>
      <div className="theme-kicker text-[10px] font-semibold text-[var(--text-3)]">{title}</div>
      <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--text-2)]">{children}</div>
    </aside>
  );
}
