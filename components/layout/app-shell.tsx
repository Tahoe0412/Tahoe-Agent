"use client";

import type { ReactNode } from "react";
import { useState, useCallback, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { Menu, X, Settings, PanelLeftClose, PanelLeftOpen, GalleryVerticalEnd } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy, type Locale } from "@/lib/locale-copy";

type SidebarContextValue = { collapsed: boolean };
const SidebarContext = createContext<SidebarContextValue>({ collapsed: false });
export function useSidebar() {
  return useContext(SidebarContext);
}

export function AppShell({
  children,
  sidebar,
  locale,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  locale: Locale;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const text = copy[locale];

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
            "theme-sidebar fixed inset-y-0 left-0 z-50 flex w-[248px] max-w-[92vw] flex-col overflow-y-auto p-4 transition-all duration-300 ease-in-out",
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
            className="mb-3 inline-flex self-end rounded-full border border-white/10 bg-white/5 p-2 text-[var(--text-inverse)] transition hover:bg-white/12 xl:hidden"
            aria-label={text.shell.closeSidebar}
          >
            <X className="size-5" />
          </button>

          <div className="flex-1">{sidebar}</div>
        </aside>

        {/* ── Right Content Wrapper ── */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out",
            collapsed ? "xl:ml-[88px]" : "xl:ml-[248px]"
          )}
        >
          {/* ── Global Top Header ── */}
          <header className="theme-header sticky top-0 z-40 flex h-[64px] items-center justify-between px-4 lg:px-6 xl:px-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-solid)_90%,transparent)] px-3 text-[var(--text-2)] transition hover:border-[color:color-mix(in_srgb,var(--accent)_38%,var(--border))] hover:text-[var(--text-1)]"
                aria-label={text.shell.toggleSidebar}
              >
                {collapsed ? <PanelLeftOpen className="size-5 hidden xl:block" /> : <PanelLeftClose className="size-5 hidden xl:block" />}
                <Menu className="size-5 xl:hidden" />
                <span className="theme-kicker hidden text-[10px] font-semibold text-[var(--text-3)] md:inline xl:hidden">{text.shell.menuLabel}</span>
              </button>

              <Link
                href="/"
                className="group inline-flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--surface-solid)_74%,transparent)] px-3 py-2 text-[var(--text-1)] transition hover:border-[color:color-mix(in_srgb,var(--accent)_34%,var(--border-soft))] hover:bg-[color:color-mix(in_srgb,var(--surface-solid)_90%,transparent)] sm:px-3.5"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent-soft),rgba(255,255,255,0.72))] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <GalleryVerticalEnd className="size-4" />
                </span>
                <span className="theme-kicker truncate text-sm font-semibold tracking-[0.22em] sm:tracking-[0.28em]">Tahoe</span>
              </Link>
            </div>

            <Link
              href="/settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--surface-solid)_78%,transparent)] text-[var(--text-2)] transition hover:border-[color:color-mix(in_srgb,var(--accent)_34%,var(--border-soft))] hover:text-[var(--accent-strong)]"
              aria-label={text.shell.openSettings}
            >
              <Settings className="size-4" />
            </Link>
          </header>

          {/* ── Main Content ── */}
          <main className="theme-main flex-1 px-4 py-4 sm:px-5 lg:px-6 lg:py-6 xl:px-8 xl:py-7 2xl:px-10">
            <div className="relative z-[1] mx-auto w-full max-w-[1680px] min-[1900px]:max-w-[1820px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
