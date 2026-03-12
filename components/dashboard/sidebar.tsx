"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, BookOpen, BriefcaseBusiness, ChevronRight, Clapperboard, Compass, FileStack, FolderKanban, LayoutDashboard, Settings, Sparkles, SwatchBook, Waypoints } from "lucide-react";
import { copy, type Locale } from "@/lib/locale-copy";
import type { WorkspaceMode } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";
import { Disclosure } from "@/components/ui/disclosure";

export function DashboardSidebar({ locale, workspaceMode = "SHORT_VIDEO" }: { locale: Locale; workspaceMode?: WorkspaceMode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const text = copy[locale];
  const coreItems =
    workspaceMode === "SHORT_VIDEO"
      ? [
          { href: "/" as Route, label: text.nav.dashboard, hint: "先看当前项目与下一步", icon: LayoutDashboard },
          { href: "/brief-studio" as Route, label: text.nav.briefStudio, hint: "把目标和边界先写清楚", icon: FileStack },
          { href: "/trend-explorer" as Route, label: text.nav.trendExplorer, hint: "看趋势与证据", icon: Compass },
          { href: "/script-lab" as Route, label: text.nav.scriptLab, hint: "改脚本、定镜头", icon: Clapperboard },
          { href: "/scene-planner" as Route, label: text.nav.scenePlanner, hint: "补素材与分镜", icon: BarChart3 },
          { href: "/render-lab" as Route, label: text.nav.renderLab, hint: text.nav.renderHint, icon: Sparkles },
        ]
      : [
          { href: "/" as Route, label: text.nav.dashboard, hint: "先看当前项目与下一步", icon: LayoutDashboard },
          { href: "/brief-studio" as Route, label: text.nav.briefStudio, hint: "把目标和边界先写清楚", icon: FileStack },
          { href: "/trend-explorer" as Route, label: text.nav.trendExplorer, hint: "看趋势与证据", icon: Compass },
          { href: "/marketing-ops" as Route, label: text.nav.marketingOps, hint: "生成主稿、平台稿与合规检查", icon: Waypoints },
        ];
  const secondaryItems = [
    { href: "/project-hub" as Route, label: text.nav.projectHub, hint: text.nav.projectHubHint, icon: FolderKanban },
    { href: "/brand-profiles" as Route, label: text.nav.brandProfiles, hint: text.nav.brandHint, icon: SwatchBook },
    { href: "/industry-templates" as Route, label: text.nav.industryTemplates, hint: text.nav.industryHint, icon: BriefcaseBusiness },
    ...(workspaceMode === "SHORT_VIDEO"
      ? [{ href: "/marketing-ops" as Route, label: text.nav.marketingOps, hint: text.nav.marketingHint, icon: Waypoints }]
      : [{ href: "/script-lab" as Route, label: text.nav.scriptLab, hint: text.nav.scriptHint, icon: Clapperboard }]),
    { href: "/help-center" as Route, label: text.nav.helpCenter, hint: text.nav.helpHint, icon: BookOpen },
    { href: "/settings" as Route, label: text.nav.settings, hint: text.nav.settingsHint, icon: Settings },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-3)]">AI Video Ops</p>
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-[var(--text-inverse)]">{text.shell.appName}</h1>
          <p className="mt-2 text-sm leading-6 text-[color:rgba(246,240,232,0.76)]">
            {text.shell.appDesc}
          </p>
        </div>
      </div>

      <nav className="space-y-4">
        <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:rgba(246,240,232,0.5)]">
          当前最常用
        </div>
        <div className="space-y-1.5">
          {coreItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const href = projectId ? (`${item.href}?projectId=${projectId}` as Route) : item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 transition",
                  active
                    ? "bg-[rgba(255,255,255,0.14)] text-[var(--text-inverse)]"
                    : "text-[color:rgba(246,240,232,0.82)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[var(--text-inverse)]",
                )}
              >
                <div className={cn("rounded-xl p-2", active ? "bg-[rgba(255,255,255,0.14)]" : "bg-[rgba(255,255,255,0.08)]")}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className={cn("mt-0.5 truncate text-xs", active ? "text-[color:rgba(246,240,232,0.74)]" : "text-[color:rgba(246,240,232,0.54)]")}>{item.hint}</div>
                </div>
                <ChevronRight className={cn("size-4 shrink-0 transition", active ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
              </Link>
            );
          })}
        </div>

        <Disclosure
          className="group rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-2"
          summaryClassName="px-2 py-2 text-sm font-medium text-[color:rgba(246,240,232,0.84)]"
          contentClassName="mt-2 space-y-1.5"
          title="更多模块与设置"
        >
            {secondaryItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              const href = projectId ? (`${item.href}?projectId=${projectId}` as Route) : item.href;

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-3 transition",
                    active
                      ? "bg-[rgba(255,255,255,0.14)] text-[var(--text-inverse)]"
                      : "text-[color:rgba(246,240,232,0.82)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[var(--text-inverse)]",
                  )}
                >
                  <div className={cn("rounded-xl p-2", active ? "bg-[rgba(255,255,255,0.14)]" : "bg-[rgba(255,255,255,0.08)]")}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className={cn("mt-0.5 truncate text-xs", active ? "text-[color:rgba(246,240,232,0.74)]" : "text-[color:rgba(246,240,232,0.54)]")}>{item.hint}</div>
                  </div>
                </Link>
              );
            })}
        </Disclosure>
      </nav>

      <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
        <div className="text-sm font-medium text-[var(--text-inverse)]">{text.shell.workModeTitle}</div>
        <p className="mt-2 text-sm leading-6 text-[color:rgba(246,240,232,0.72)]">
          {text.shell.workModeDesc}
        </p>
      </div>
    </div>
  );
}
