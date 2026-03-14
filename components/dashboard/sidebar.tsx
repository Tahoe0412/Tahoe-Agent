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
    <span className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-inverse)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
      {label}
    </span>
  );
}

function GroupHeading({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--sidebar-text)] opacity-70">
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
        "group relative flex items-center gap-3 rounded-2xl transition",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-3",
        active
          ? "bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-item-active-text)]"
          : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-hover)]",
      )}
      style={active && accentBg ? { background: accentBg } : undefined}
    >
      <div
        className={cn("shrink-0 rounded-xl p-2", active ? "bg-white/12" : "bg-white/6")}
        style={accentColor ? { color: accentColor } : undefined}
      >
        <Icon className="size-4" />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{item.label}</div>
          <div className={cn("mt-0.5 truncate text-xs", active ? "opacity-80" : "opacity-60")}>{item.hint}</div>
        </div>
      )}
      <SidebarTooltip label={item.label} show={collapsed} />
    </Link>
  );
}

export function DashboardSidebar({ locale, workspaceMode = "SHORT_VIDEO" }: { locale: Locale; workspaceMode?: WorkspaceMode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const text = copy[locale];
  const { collapsed } = useSidebar();

  /* ── Group 1: 前置探索 (Explore) ── */
  const exploreItems: NavItem[] = [
    { href: "/" as Route, label: text.nav.dashboard, hint: "项目总览与下一步", icon: LayoutDashboard, accentBg: "rgba(122,139,114,0.16)", accentColor: "var(--sage)" },
    { href: "/brief-studio" as Route, label: text.nav.briefStudio, hint: "目标与边界", icon: FileStack, accentBg: "rgba(122,137,152,0.16)", accentColor: "var(--slate-blue)" },
    { href: "/trend-explorer" as Route, label: text.nav.trendExplorer, hint: "趋势研究与证据", icon: Compass, accentBg: "rgba(154,130,146,0.16)", accentColor: "var(--plum)" },
  ];

  /* ── Group 2: 生产车间 (Build) ── */
  const buildItems: NavItem[] = [
    { href: "/script-lab" as Route, label: text.nav.scriptLab, hint: text.nav.scriptHint || "改脚本、定镜头", icon: Clapperboard, accentBg: "rgba(122,137,152,0.16)", accentColor: "var(--slate-blue)" },
    { href: "/scene-planner" as Route, label: text.nav.scenePlanner, hint: "素材与分镜规划", icon: BarChart3, accentBg: "rgba(122,139,114,0.16)", accentColor: "var(--sage)" },
    { href: "/render-lab" as Route, label: text.nav.renderLab, hint: text.nav.renderHint || "生成与预览", icon: Sparkles, accentBg: "rgba(176,125,106,0.16)", accentColor: "var(--terracotta)" },
    { href: "/marketing-ops" as Route, label: text.nav.marketingOps, hint: text.nav.marketingHint || "平台分发与合规", icon: Waypoints, accentBg: "rgba(154,130,146,0.16)", accentColor: "var(--plum)" },
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
    { key: "explore", heading: collapsed ? "" : "探索", items: exploreItems },
    { key: "build", heading: collapsed ? "" : "生产", items: buildItems },
    { key: "manage", heading: collapsed ? "" : "管理", items: manageItems },
  ] as const;

  return (
    <div className={cn("flex flex-col gap-5", collapsed && "items-center")}>
      {/* ── Brand mark ── */}
      {!collapsed && (
        <div className="px-2 pb-1">
          <span className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--sidebar-text)] opacity-80">Tahoe</span>
        </div>
      )}

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
        <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
          <div className="text-sm font-medium text-[var(--sidebar-text-hover)]">{text.shell.workModeTitle}</div>
          <p className="mt-2 text-xs leading-5 text-[var(--sidebar-text)]">
            {text.shell.workModeDesc}
          </p>
        </div>
      )}
    </div>
  );
}
