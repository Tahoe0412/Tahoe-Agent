import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale-copy";
import { copy } from "@/lib/locale-copy";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  locale = "zh",
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  locale?: Locale;
}) {
  const text = copy[locale];

  return (
    <header className="relative overflow-hidden rounded-[30px] border border-[var(--border-soft)] bg-[linear-gradient(140deg,rgba(255,255,255,0.78),rgba(255,255,255,0.34))] px-4 py-5 shadow-[0_18px_40px_rgba(27,53,78,0.08)] sm:px-5 lg:px-6 xl:px-7">
      <div
        className="pointer-events-none absolute right-[-6rem] top-[-5rem] h-52 w-52 rounded-full bg-[radial-gradient(circle,var(--accent-soft),transparent_68%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[-3rem] bottom-[-4rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--sage-soft),transparent_72%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="theme-pill inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
            {eyebrow}
          </div>
          <div className="max-w-[76rem]">
            <h2 className="theme-font-display text-[2.5rem] leading-[0.96] tracking-tight text-[var(--text-1)] sm:text-[2.95rem] md:text-[3.15rem] min-[1700px]:max-w-[14ch] xl:text-[3.15rem]">
              {title}
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-[var(--text-2)] md:text-[15px] min-[1700px]:max-w-[60rem]">{description}</p>
          </div>
        </div>
        {action ? <div className="w-full shrink-0 xl:w-auto">{action}</div> : null}
      </div>
      <div className="relative z-[1] mt-4 h-px bg-[linear-gradient(90deg,var(--accent-soft),transparent_72%)]" />
    </header>
  );
}
