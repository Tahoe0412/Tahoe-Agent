import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelCard({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("theme-panel px-5 py-5 sm:px-6", className)}>
      <div className="grid gap-1 md:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)] md:items-start">
        <div>
          <h3 className="text-[1rem] font-semibold leading-6 text-[var(--text-1)]">{title}</h3>
        </div>
        {description ? <p className="text-sm leading-6 text-[var(--text-2)]">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
