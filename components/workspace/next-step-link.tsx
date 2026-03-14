import Link from "next/link";
import type { Route } from "next";

export function NextStepLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const className =
    "inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-2.5 text-sm font-medium text-[var(--text-inverse)] shadow-[0_16px_34px_rgba(196,111,66,0.22)] transition hover:-translate-y-0.5 hover:brightness-[1.03]";

  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={className}>
      {label}
    </Link>
  );
}
