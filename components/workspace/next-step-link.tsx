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
    "inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--text-inverse)] shadow-none transition hover:bg-[var(--accent-strong)]";

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
