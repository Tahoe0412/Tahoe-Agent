"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
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
  Rows3,
  FileText,
} from "lucide-react";
import { copy, type Locale } from "@/lib/locale-copy";
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
    <span className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-3 py-1.5 text-xs font-medium text-[var(--sidebar-text-hover)] opacity-0 shadow-none transition-opacity group-hover:opacity-100">
      {label}
    </span>
  );
}

function GroupHeading({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="theme-kicker mb-2 px-3 text-[10px] font-medium text-[var(--sidebar-text)] opacity-85">
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
        "group relative flex items-center gap-3 rounded-[16px] border border-transparent transition-colors duration-150",
        collapsed ? "justify-center px-0 py-2" : "px-3 py-3",
        active
          ? "border-[var(--sidebar-border)] text-[var(--sidebar-item-active-text)]"
          : "text-[var(--sidebar-text)] hover:border-[var(--sidebar-border)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-hover)]",
      )}
      style={active ? { background: accentBg ?? "var(--sidebar-item-active-bg)" } : undefined}
    >
      <div
        className={cn(
          "shrink-0 p-1.5 transition-colors duration-200",
          active ? "text-[var(--sidebar-item-active-text)]" : "bg-transparent"
        )}
        style={accentColor ? { color: accentColor } : undefined}
      >
        <Icon className="size-4" />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{item.label}</div>
          <div className={cn("mt-1 truncate text-xs", active ? "opacity-95" : "opacity-82")}>{item.hint}</div>
        </div>
      )}
      <SidebarTooltip label={item.label} show={collapsed} />
    </Link>
  );
}

export function DashboardSidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const text = copy[locale];
  const { collapsed } = useSidebar();

  /* ── Group 1: 默认日更路径 (Explore) ── */
  const exploreItems: NavItem[] = [
    { href: "/daily-run" as Route, label: text.nav.dailyRun, hint: text.nav.dailyRunHint || "三线选题与成稿", icon: Rows3, accentBg: "var(--plum-soft)", accentColor: "var(--plum)" },
    { href: "/" as Route, label: text.nav.dashboard, hint: "项目总览与下一步", icon: LayoutDashboard, accentBg: "var(--sage-soft)", accentColor: "var(--sage)" },
  ];

  /* ── Group 2: 生产车间 (Build) ── */
  const buildItems: NavItem[] = [
    { href: "/script-lab" as Route, label: text.nav.scriptLab, hint: text.nav.scriptHint || "正文 / 标题 / 发布文案", icon: Clapperboard, accentBg: "var(--slate-blue-soft)", accentColor: "var(--slate-blue)" },
    { href: "/scene-planner" as Route, label: text.nav.scenePlanner, hint: text.nav.sceneHint || "配图意图、参考与素材", icon: BarChart3, accentBg: "var(--sage-soft)", accentColor: "var(--sage)" },
    { href: "/render-lab" as Route, label: text.nav.renderLab, hint: text.nav.renderHint || "提示词、参考图与图片任务", icon: Sparkles, accentBg: "var(--terracotta-soft)", accentColor: "var(--terracotta)" },
    { href: "/marketing-ops" as Route, label: text.nav.marketingOps, hint: text.nav.marketingHint || "平台分发与复盘", icon: Waypoints, accentBg: "var(--plum-soft)", accentColor: "var(--plum)" },
  ];

  /* ── Group 3: 资产与配置 (Manage) ── */
  const manageItems: NavItem[] = [
    { href: "/article-samples" as Route, label: locale === "en" ? "Sample Bank" : "文章样本库", hint: locale === "en" ? "Writing style memory" : "风格记忆与账号样本", icon: FileText, accentBg: "var(--plum-soft)", accentColor: "var(--plum)" },
    { href: "/today" as Route, label: text.nav.todayWorkbench, hint: text.nav.todayHint || "看热点、选题、快速产出", icon: CalendarDays, accentBg: "var(--terracotta-soft)", accentColor: "var(--terracotta)" },
    { href: "/trend-explorer" as Route, label: text.nav.trendExplorer, hint: "趋势研究与证据", icon: Compass, accentBg: "var(--plum-soft)", accentColor: "var(--plum)" },
    { href: "/brief-studio" as Route, label: text.nav.briefStudio, hint: "目标与边界", icon: FileStack, accentBg: "var(--slate-blue-soft)", accentColor: "var(--slate-blue)" },
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
      <div className={cn("mb-5 flex shrink-0 items-center", collapsed ? "justify-center" : "px-1")}>
      <div
          className={cn(
            "transition",
            collapsed
              ? "flex size-10 items-center justify-center rounded-full border border-[var(--sidebar-border)] bg-[var(--sidebar-item-hover)]"
              : "border-b border-[var(--sidebar-border)] px-1 pb-4"
          )}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--sidebar-border)] bg-[var(--sidebar-item-hover)] text-[var(--sidebar-text-hover)]">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div>
                <div className="theme-kicker text-[10px] font-medium text-[var(--sidebar-text)] opacity-85">{text.shell.workspaceLabel}</div>
                <span className="mt-1 block text-[15px] font-semibold uppercase tracking-[0.12em] text-[var(--sidebar-text-hover)]">
                  Tahoe
                </span>
              </div>
            </div>
          ) : (
            <GalleryVerticalEnd className="size-4 text-[var(--sidebar-text-hover)]" />
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

        {!collapsed && (
          <div className="mt-auto mb-2 border-t border-[var(--sidebar-border)] pt-4">
            <div className="theme-kicker text-[10px] font-medium text-[var(--sidebar-text)] opacity-85">{text.shell.workspaceLabel}</div>
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
