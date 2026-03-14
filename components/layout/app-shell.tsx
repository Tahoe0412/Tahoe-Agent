"use client";

import type { ReactNode } from "react";
import { useState, useCallback, useEffect } from "react";
import { Menu, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggle = useCallback(() => {
    // On mobile: toggle overlay drawer
    // On desktop: toggle collapsed state
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  }, []);

  // Close drawer on route change (detected via popstate)
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="theme-shell flex min-h-screen flex-col">
      {/* ── Layer 1: Global Top Header ── */}
      <header className="theme-header sticky top-0 z-50 flex h-14 items-center gap-3 px-4">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-2)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-1)]"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-3)]">
            AI Video Ops
          </span>
          <span className="text-sm font-semibold text-[var(--text-1)]">
            Tahoe
          </span>
        </div>

        <a
          href="/settings"
          className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-2)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-1)]"
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </a>
      </header>

      <div className="relative flex flex-1">
        {/* ── Mobile Backdrop ── */}
        {open ? (
          <div
            className="theme-drawer-backdrop fixed inset-0 z-40 xl:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        ) : null}

        {/* ── Layer 2: Sidebar Drawer ── */}
        <aside
          className={cn(
            "theme-sidebar fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto p-5 transition-transform duration-300 ease-in-out",
            // Mobile: show/hide via translate
            open ? "translate-x-0" : "-translate-x-full",
            // Desktop: show by default, hide when collapsed
            collapsed ? "xl:-translate-x-full" : "xl:translate-x-0",
          )}
        >
          {/* Close button (mobile) */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mb-4 inline-flex self-end rounded-lg p-2 text-[var(--text-inverse)] transition hover:bg-[rgba(255,255,255,0.12)] xl:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>

          {/* Sidebar content (nav items injected via prop) */}
          <div className="flex-1">{sidebar}</div>
        </aside>

        {/* ── Layer 3: Main Content ── */}
        <main
          className={cn(
            "theme-main min-w-0 flex-1 rounded-2xl p-6 transition-all duration-300 lg:p-8 xl:p-10",
            // Desktop: shift right when sidebar is open
            collapsed ? "xl:ml-0" : "xl:ml-[280px]",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
