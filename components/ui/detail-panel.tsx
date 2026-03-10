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
    <aside className={cn("theme-panel-strong rounded-[28px] p-6", className)}>
      <div className="text-sm font-medium uppercase tracking-[0.12em] text-[color:rgba(246,240,232,0.88)]">{title}</div>
      <div className="mt-5 space-y-5 text-sm leading-6 text-[color:rgba(246,240,232,0.76)]">{children}</div>
    </aside>
  );
}
