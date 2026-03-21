import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import type { Locale } from "@/lib/locale-copy";

export function WorkspaceLayout({ children, locale }: { children: ReactNode; locale: Locale }) {
  return <AppShell locale={locale} sidebar={<DashboardSidebar locale={locale} />}>{children}</AppShell>;
}
