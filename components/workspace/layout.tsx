import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import type { Locale } from "@/lib/locale-copy";
import type { WorkspaceMode } from "@/lib/workspace-mode";

export function WorkspaceLayout({ children, locale, workspaceMode }: { children: ReactNode; locale: Locale; workspaceMode?: WorkspaceMode }) {
  return <AppShell locale={locale} sidebar={<DashboardSidebar locale={locale} workspaceMode={workspaceMode} />}>{children}</AppShell>;
}
