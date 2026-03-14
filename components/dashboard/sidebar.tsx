"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Clapperboard,
  Compass,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Sparkles,
  SwatchBook,
  Waypoints,
  GalleryVerticalEnd,
} from "lucide-react";
import { copy, type Locale } from "@/lib/locale-copy";
import type { WorkspaceMode } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/app-shell";

type NavItem = {
  href: Route;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  accentBg?: string;
};

function SidebarTooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null;
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#1E2024] px-3 py-1.5 text-xs font-medium text-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
      {label}
    </span>
  );
}

function GroupHeading({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--sidebar-text)] opacity-95">
      {children}
    </div>
  );
}

function NavLink({ item, active, projectId, collapsed }: { item: NavItem; active: boolean; projectId: string | null; collapsed: boolean }) {
  const Icon = item.icon;
  const href = projectId ? (`${item.href}?projectId=${projectId}` as Route) : item.href;
  const accentBg = active && item.accentBg ? item.accentBg : undefined;
  const accentColor = active && item.accentColor ? item.accentColor : undefined;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-[24px] border transition-all duration-200",
        collapsed ? "justify-center px-0 py-3" : "px-3 py-3.5",
        active
          ? "border-white/10 text-[var(--sidebar-item-active-text)] shadow-[0_16px_36px_rgba(0,0,0,0.16)]"
          : "border-transparent text-[var(--sidebar-text)] hover:-translate-y-0.5 hover:border-white/10 hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-hover)]",
      )}
      style={active ? { background: accentBg ?? "var(--sidebar-item-active-bg)" } : undefined}
    >
      {active ? <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-[var(--accent)]" aria-hidden /> : null}
      <div
        className={cn(
          "shrink-0 rounded-2xl p-2.5 transition-all duration-200",
          active ? "bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" : "bg-white/8 group-hover:bg-white/12"
        )}
        style={accentColor ? { color: accentColor } : undefined}
      >
        <Icon className="size-4" />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{item.label}</div>
          <div className={cn("mt-1 truncate text-xs", active ? "opacity-95" : "opacity-82")}>{item.hint}</div>
        </div>
      )}
      <SidebarTooltip label={item.label} show={collapsed} />
    </Link>
  );
}

export function DashboardSidebar({ locale, workspaceMode: _workspaceMode = "SHORT_VIDEO" }: { locale: Locale; workspaceMode?: WorkspaceMode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const text = copy[locale];
  const { collapsed } = useSidebar();
  void _workspaceMode;

  /* ── Group 1: 前置探索 (Explore) ── */
  const exploreItems: NavItem[] = [
    { href: "/" as Route, label: text.nav.dashboard, hint: "项目总览与下一步", icon: LayoutDashboard, accentBg: "rgba(149,168,143,0.18)", accentColor: "var(--sage)" },
    { href: "/brief-studio" as Route, label: text.nav.briefStudio, hint: "目标与边界", icon: FileStack, accentBg: "rgba(158,171,179,0.18)", accentColor: "var(--slate-blue)" },
    { href: "/trend-explorer" as Route, label: text.nav.trendExplorer, hint: "趋势研究与证据", icon: Compass, accentBg: "rgba(176,163,160,0.18)", accentColor: "var(--plum)" },
  ];

  /* ── Group 2: 生产车间 (Build) ── */
  const buildItems: NavItem[] = [
    { href: "/script-lab" as Route, label: text.nav.scriptLab, hint: text.nav.scriptHint || "改脚本、定镜头", icon: Clapperboard, accentBg: "rgba(158,171,179,0.18)", accentColor: "var(--slate-blue)" },
    { href: "/scene-planner" as Route, label: text.nav.scenePlanner, hint: "素材与分镜规划", icon: BarChart3, accentBg: "rgba(149,168,143,0.18)", accentColor: "var(--sage)" },
    { href: "/render-lab" as Route, label: text.nav.renderLab, hint: text.nav.renderHint || "生成与预览", icon: Sparkles, accentBg: "rgba(200,166,145,0.18)", accentColor: "var(--terracotta)" },
    { href: "/marketing-ops" as Route, label: text.nav.marketingOps, hint: text.nav.marketingHint || "平台分发与合规", icon: Waypoints, accentBg: "rgba(176,163,160,0.18)", accentColor: "var(--plum)" },
  ];

  /* ── Group 3: 资产与配置 (Manage) ── */
  const manageItems: NavItem[] = [
    { href: "/project-hub" as Route, label: text.nav.projectHub, hint: text.nav.projectHubHint || "全部项目", icon: FolderKanban },
    { href: "/brand-profiles" as Route, label: text.nav.brandProfiles, hint: text.nav.brandHint || "品牌特征", icon: SwatchBook },
    { href: "/industry-templates" as Route, label: text.nav.industryTemplates, hint: text.nav.industryHint || "行业模板", icon: BriefcaseBusiness },
    { href: "/help-center" as Route, label: text.nav.helpCenter, hint: text.nav.helpHint || "帮助文档", icon: BookOpen },
    { href: "/settings" as Route, label: text.nav.settings, hint: text.nav.settingsHint || "全局设置", icon: Settings },
  ];

  const groups = [
    { key: "explore", heading: collapsed ? "" : text.nav.exploreLabel, items: exploreItems },
    { key: "build", heading: collapsed ? "" : text.nav.buildLabel, items: buildItems },
    { key: "manage", heading: collapsed ? "" : text.nav.manageLabel, items: manageItems },
  ] as const;

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand Header ── */}
      <div className={cn("mb-5 flex shrink-0 items-center", collapsed ? "justify-center" : "px-1")}>
        <div
          className={cn(
            "transition-all",
            collapsed
              ? "flex size-12 items-center justify-center rounded-[16px] border border-white/8 bg-white/6"
              : "rounded-[20px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-3 py-3"
          )}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(183,186,162,0.22),rgba(255,255,255,0.10))] text-[var(--sidebar-text-hover)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div>
                <div className="theme-kicker text-[10px] font-semibold text-[var(--sidebar-text)] opacity-95">{text.shell.workspaceLabel}</div>
                <span className="mt-1 block text-[15px] font-semibold tracking-[0.12em] text-[var(--sidebar-text-hover)]">
                  Tahoe
                </span>
              </div>
            </div>
          ) : (
            <GalleryVerticalEnd className="size-5 text-[var(--sidebar-text-hover)]" />
          )}
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col gap-5 overflow-y-auto", collapsed && "items-center gap-5")}>
        {groups.map((group) => (
          <nav key={group.key} className="w-full">
            <GroupHeading collapsed={collapsed}>{group.heading}</GroupHeading>
            <div className={cn("space-y-1", collapsed && "space-y-0.5")}>
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={pathname === item.href} projectId={projectId} collapsed={collapsed} />
              ))}
            </div>
          </nav>
        ))}

        {/* ── Mode description card ── */}
        {!collapsed && (
          <div className="mt-auto mb-2 rounded-[20px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.10)]">
            <div className="theme-kicker text-[10px] font-semibold text-[var(--sidebar-text)] opacity-95">{text.shell.workspaceLabel}</div>
            <div className="mt-2 text-sm font-medium text-[var(--sidebar-text-hover)]">{text.shell.workModeTitle}</div>
            <p className="mt-2 text-xs leading-5 text-[var(--sidebar-text)] opacity-95">
              {text.shell.workModeDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
