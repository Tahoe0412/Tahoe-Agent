import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("theme-panel rounded-[28px] p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-1)]">{title}</h3>
          {description ? <p className="mt-1 text-sm text-[var(--text-2)]">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
