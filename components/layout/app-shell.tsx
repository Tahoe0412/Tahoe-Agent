"use client";

import type { ReactNode } from "react";
import { useState, useCallback, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { Menu, X, Settings, PanelLeftClose, PanelLeftOpen, GalleryVerticalEnd } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy, type Locale } from "@/lib/locale-copy";

// collapsed: sidebar hidden completely (desktop)
// pinned: sidebar always visible, pushes content (desktop default)
// overlay: sidebar visible but floats over content (after first expand from collapsed)
type DesktopSidebarMode = "pinned" | "collapsed" | "overlay";

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
  // Desktop sidebar state machine: pinned → collapsed → overlay → collapsed
  const [desktopMode, setDesktopMode] = useState<DesktopSidebarMode>("pinned");
  const text = copy[locale];

  const toggle = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setMobileOpen((v) => !v);
      return;
    }
    setDesktopMode((current) => {
      if (current === "pinned") return "collapsed";  // pin → hide
      if (current === "collapsed") return "overlay"; // hidden → overlay
      return "collapsed";                             // overlay → hide
    });
  }, []);

  const closeOverlay = useCallback(() => {
    setDesktopMode("collapsed");
  }, []);

  // Close on route change (mobile)
  useEffect(() => {
    const close = () => {
      setMobileOpen(false);
      if (desktopMode === "overlay") setDesktopMode("collapsed");
    };
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, [desktopMode]);

  // ESC closes everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setDesktopMode((m) => (m === "overlay" ? "collapsed" : m));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebarVisible =
    desktopMode === "pinned" || desktopMode === "overlay";
  const collapsed = desktopMode === "collapsed";

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="theme-shell flex min-h-screen bg-[var(--canvas)]">

        {/* ── Mobile Backdrop ── */}
        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/40 xl:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        ) : null}

        {/* ── Desktop Overlay Backdrop (overlay mode only — click anywhere to close) ── */}
        {desktopMode === "overlay" ? (
          <div
            className="fixed inset-0 z-40 hidden xl:block"
            onClick={closeOverlay}
            aria-hidden
          />
        ) : null}

        {/* ── Sidebar ── */}
        <aside
          className={cn(
            "theme-sidebar fixed inset-y-0 left-0 z-50 flex w-[248px] max-w-[92vw] flex-col overflow-y-auto p-4 transition-transform duration-300 ease-in-out",
            // Mobile
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            // Desktop
            sidebarVisible ? "xl:translate-x-0" : "xl:-translate-x-full",
          )}
        >
          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mb-3 inline-flex self-end rounded-full border border-[var(--sidebar-border)] bg-[var(--surface-solid)] p-2 text-[var(--text-1)] transition hover:bg-[var(--sidebar-item-hover)] xl:hidden"
            aria-label={text.shell.closeSidebar}
          >
            <X className="size-5" />
          </button>

          <div className="flex-1">{sidebar}</div>
        </aside>

        {/* ── Right Content Wrapper ── */}
        {/*
          pinned  → content pushed right by 248px
          others  → content takes full width (sidebar either hidden or floating as overlay)
        */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out",
            desktopMode === "pinned" ? "xl:ml-[248px]" : "xl:ml-0",
          )}
        >
          {/* ── Global Top Header ── */}
          <header className="theme-header sticky top-0 z-40 flex h-[58px] items-center justify-between px-4 lg:px-6 xl:px-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--text-1)]"
                aria-label={text.shell.toggleSidebar}
              >
                {sidebarVisible
                  ? <PanelLeftClose className="size-5 hidden xl:block" />
                  : <PanelLeftOpen className="size-5 hidden xl:block" />
                }
                <Menu className="size-5 xl:hidden" />
                <span className="theme-kicker hidden text-[10px] font-semibold text-[var(--text-3)] md:inline xl:hidden">
                  {text.shell.menuLabel}
                </span>
              </button>

              <Link
                href="/"
                className="group inline-flex min-w-0 items-center gap-3 rounded-full border border-transparent px-2 py-1.5 text-[var(--text-1)] transition hover:border-[var(--border)] sm:px-3"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <GalleryVerticalEnd className="size-4" />
                </span>
                <span className="theme-kicker truncate text-sm font-semibold">Tahoe</span>
              </Link>
            </div>

            <Link
              href="/settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              aria-label={text.shell.openSettings}
            >
              <Settings className="size-4" />
            </Link>
          </header>

          {/* ── Main Content ── */}
          <main className="theme-main flex-1 px-4 py-4 sm:px-5 lg:px-6 lg:py-5 xl:px-8 xl:py-6 2xl:px-10">
            <div className="relative z-[1] mx-auto w-full max-w-[1680px] min-[1900px]:max-w-[1820px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
