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
    <header className="border-b border-[var(--border)] pb-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="theme-kicker text-[11px] font-semibold text-[var(--accent-strong)]">
            {eyebrow}
          </div>
          <div className="max-w-[76rem]">
            <h2 className="theme-font-display max-w-[17ch] text-[2.55rem] leading-[0.92] text-[var(--text-1)] sm:text-[3.2rem] md:text-[3.65rem] xl:text-[3.85rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-8 text-[var(--text-2)] min-[1700px]:max-w-[60rem]">{description}</p>
          </div>
        </div>
        {action ? <div className="w-full shrink-0 xl:w-auto">{action}</div> : null}
      </div>
    </header>
  );
}
