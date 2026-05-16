import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale-copy";

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
  locale?: Locale;
}) {
  return (
    <header className="py-2 sm:py-3">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="min-w-0 space-y-3">
          <div className="theme-kicker text-[10px] font-semibold text-[var(--accent-strong)]">
            {eyebrow}
          </div>
          <div className="max-w-[76rem]">
            <h2 className="theme-font-display max-w-[20ch] text-[2.05rem] font-semibold leading-[1.05] text-[var(--text-1)] sm:text-[2.45rem] md:text-[2.75rem] xl:text-[2.9rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-2)]">{description}</p>
          </div>
        </div>
        {action ? <div className="w-full shrink-0 xl:w-auto">{action}</div> : null}
      </div>
    </header>
  );
}
