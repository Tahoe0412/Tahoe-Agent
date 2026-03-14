"use client";

import type { ReactNode } from "react";
import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { Menu, X, Settings, PanelLeftClose, PanelLeft, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarContextValue = { collapsed: boolean };
const SidebarContext = createContext<SidebarContextValue>({ collapsed: false });
export function useSidebar() {
  return useContext(SidebarContext);
}

export function AppShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggle = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  }, []);

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="theme-shell flex min-h-screen bg-[var(--canvas)]">
        {/* ── Mobile Backdrop ── */}
        {mobileOpen ? (
          <div
            className="theme-drawer-backdrop fixed inset-0 z-40 xl:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        ) : null}

        {/* ── Sidebar ── */}
        <aside
          className={cn(
            "theme-sidebar fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto p-5 transition-all duration-300 ease-in-out",
            // Mobile
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            // Desktop: always visible, but collapsed = mini
            collapsed ? "xl:translate-x-0 xl:theme-sidebar-mini" : "xl:translate-x-0",
          )}
        >
          {/* Close button (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mb-4 inline-flex self-end rounded-lg p-2 text-[var(--text-inverse)] transition hover:bg-[rgba(255,255,255,0.12)] xl:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>

          <div className="flex-1">{sidebar}</div>
        </aside>

        {/* ── Right Content Wrapper ── */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out",
            collapsed ? "xl:ml-[72px]" : "xl:ml-[280px]"
          )}
        >
          {/* ── Global Top Header ── */}
          <header className="theme-header sticky top-0 z-40 flex h-14 items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-2)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-1)]"
                aria-label="Toggle sidebar"
              >
                {collapsed ? <PanelLeftOpen className="size-5 hidden xl:block" /> : <PanelLeftClose className="size-5 hidden xl:block" />}
                <Menu className="size-5 xl:hidden" />
              </button>
            </div>

            <a
              href="/settings"
              className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-2)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-1)]"
              aria-label="Settings"
            >
              <Settings className="size-4" />
            </a>
          </header>

          {/* ── Main Content ── */}
          <main className="theme-main flex-1 p-6 lg:p-8 xl:p-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
