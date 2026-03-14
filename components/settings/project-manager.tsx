"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { ProjectModePicker } from "@/components/dashboard/project-mode-picker";
import { copyLengthList, getCopyLengthMeta, getUsageScenarioMeta, type CopyLength, type UsageScenario, usageScenarioList } from "@/lib/copy-goal";
import type { Locale } from "@/lib/locale-copy";
import { getStyleTemplateMeta, type StyleTemplate, styleTemplateList } from "@/lib/style-template";
import { getWritingModeMeta, type WritingMode, writingModeList } from "@/lib/writing-mode";
import { getWorkspaceModeMeta, type WorkspaceMode } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";

type ProjectSummary = {
  id: string;
  title: string;
  topic_query: string;
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "FAILED" | "ARCHIVED";
  created_at: Date | string;
  workspace_mode?: WorkspaceMode;
  project_tags?: string[];
  is_pinned?: boolean;
  last_opened_at?: string | null;
  brand_profile_id?: string | null;
  industry_template_id?: string | null;
  trend_count: number;
  scene_count: number;
};

type SimpleBrandProfile = {
  id: string;
  brand_name: string;
};

type SimpleIndustryTemplate = {
  id: string;
  industry_name: string;
};

export function ProjectManager({
  initialProjects,
  brandProfiles = [],
  industryTemplates = [],
  showBulkActions = false,
  locale = "zh",
}: {
  initialProjects: ProjectSummary[];
  brandProfiles?: SimpleBrandProfile[];
  industryTemplates?: SimpleIndustryTemplate[];
  showBulkActions?: boolean;
  locale?: Locale;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("SHORT_VIDEO");
  const [writingMode, setWritingMode] = useState<WritingMode>("PRODUCT_PROMO");
  const [styleTemplate, setStyleTemplate] = useState<StyleTemplate>("RATIONAL_PRO");
  const [copyLength, setCopyLength] = useState<CopyLength>("STANDARD");
  const [usageScenario, setUsageScenario] = useState<UsageScenario>("XIAOHONGSHU_POST");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProjectSummary["status"]>("ALL");
  const [modeFilter, setModeFilter] = useState<"ALL" | WorkspaceMode>("ALL");
  const [sortBy, setSortBy] = useState<"recent" | "newest" | "title" | "trends" | "scenes">("recent");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBrandId, setBulkBrandId] = useState("");
  const [bulkIndustryId, setBulkIndustryId] = useState("");
  const [bulkTags, setBulkTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modeMeta = useMemo(() => getWorkspaceModeMeta(workspaceMode, locale), [locale, workspaceMode]);
  const writingMeta = useMemo(() => getWritingModeMeta(writingMode, locale), [locale, writingMode]);
  const styleMeta = useMemo(() => getStyleTemplateMeta(styleTemplate, locale), [locale, styleTemplate]);
  const ui = locale === "en"
    ? {
        createFailed: "Could not create the project.",
        updateFailed: "Could not update the project.",
        bulkFailed: "Bulk update failed.",
        selectFirst: "Select at least one project first.",
        created: (id: string) => `Project ${id} created.`,
        archived: "Project archived.",
        restored: "Project restored.",
        pinned: "Project pinned.",
        unpinned: "Project unpinned.",
        updatedCount: (count: number) => `${count} projects updated.`,
        count: (all: number, visible: number) => visible !== all ? `${all} projects total, ${visible} in the current view.` : `${all} projects total.`,
        refresh: "Refresh List",
        createDisclosure: "Create Project",
        projectName: "Project Name",
        topic: "Topic",
        sourceShortVideo: "Source Script / Core Idea",
        sourceCopy: "Copy Brief / Core Message",
        sourcePromo: "Campaign Need / Promotion Goal",
        advanced: "Advanced settings (writing mode, style, length, use case, overview...)",
        projectIntro: "Project Overview",
        projectIntroPlaceholder: "Who is this project for, what problem does it solve, and what stage is it in?",
        coreIdea: "Core Message",
        coreIdeaPlaceholder: "Describe the one message this round needs to land.",
        writingMode: "Writing Mode",
        currentWritingMode: "Current writing mode",
        copyLength: "Copy Length",
        usageScenario: "Use Case",
        outputStyle: "Output Style",
        currentStyle: "Current style",
        styleReference: "Style Reference / Sample Copy",
        styleReferencePlaceholder: "Paste one or more strong examples. The system learns tone and structure without copying the text directly.",
        defaultPlatforms: "Default platforms",
        currentMode: "Current mode",
        creating: "Creating...",
        createProject: "Create Project",
        searchPlaceholder: "Search by project name, topic, tag, or ID",
        allStatuses: "All statuses",
        completed: "Completed",
        running: "In progress",
        failed: "Failed",
        archivedStatus: "Archived",
        allModes: "All modes",
        shortVideo: "Short Video",
        copywriting: "Copywriting",
        promotion: "Promotion",
        sortRecent: "Pinned and recently opened",
        sortNewest: "Newest first",
        sortTitle: "Title",
        sortTrends: "Trend count",
        sortScenes: "Scene count",
        archiveHint: "Archive older projects first so brand assets, trend evidence, and scripts are not lost by mistake.",
        bulk: (count: number) => `Bulk actions · ${count} selected`,
        clearSelectAll: "Clear selection",
        selectAll: "Select all in view",
        bulkArchive: "Archive selected",
        bindBrand: "Assign brand profile",
        bindIndustry: "Assign industry template",
        appendTags: "Append tags, comma-separated",
        bind: "Apply",
        addTags: "Add Tags",
        pinnedLabel: "Pinned",
        trends: "trends",
        scenes: "scenes",
        open: "Open",
        pin: "Pin",
        unpin: "Unpin",
        restore: "Restore",
        archive: "Archive",
        emptyFiltered: "No projects match the current filters. Adjust the search, mode, or status filters and try again.",
      }
    : {
        createFailed: "项目创建失败。",
        updateFailed: "项目更新失败。",
        bulkFailed: "批量更新失败。",
        selectFirst: "请先选择至少一个项目。",
        created: (id: string) => `已创建项目 ${id}`,
        archived: "项目已归档。",
        restored: "项目已恢复。",
        pinned: "项目已置顶。",
        unpinned: "项目已取消置顶。",
        updatedCount: (count: number) => `已更新 ${count} 个项目。`,
        count: (all: number, visible: number) => visible !== all ? `共 ${all} 个项目，当前筛选显示 ${visible} 个` : `共 ${all} 个项目`,
        refresh: "刷新列表",
        createDisclosure: "创建新项目",
        projectName: "项目名称",
        topic: "选题主题",
        sourceShortVideo: "原始脚本 / 核心想法",
        sourceCopy: "文案需求 / 核心表达",
        sourcePromo: "推广需求 / 宣传目标",
        advanced: "展开高级设置（写作模式、风格、长度、场景、项目介绍…）",
        projectIntro: "项目介绍",
        projectIntroPlaceholder: "这个项目服务谁、解决什么问题、当前阶段如何。",
        coreIdea: "核心想法",
        coreIdeaPlaceholder: "一句话写清本轮内容最想打中的表达。",
        writingMode: "写作模式",
        currentWritingMode: "当前写作模式",
        copyLength: "文案长度",
        usageScenario: "使用场景",
        outputStyle: "输出风格",
        currentStyle: "当前输出风格",
        styleReference: "风格参照 / 参考样稿",
        styleReferencePlaceholder: "可粘贴多段你喜欢的宣传文案，系统只学习风格与结构，不照抄内容。",
        defaultPlatforms: "默认平台",
        currentMode: "当前模式",
        creating: "创建中...",
        createProject: "创建新项目",
        searchPlaceholder: "搜索项目名、主题、标签或 ID",
        allStatuses: "全部状态",
        completed: "已完成",
        running: "进行中",
        failed: "失败",
        archivedStatus: "已归档",
        allModes: "全部模式",
        shortVideo: "短视频",
        copywriting: "文案写作",
        promotion: "宣传推广",
        sortRecent: "按置顶与最近打开",
        sortNewest: "按最近创建",
        sortTitle: "按名称",
        sortTrends: "按趋势数",
        sortScenes: "按场景数",
        archiveHint: "历史项目先归档，避免直接删除造成品牌资产、趋势证据和脚本数据丢失。",
        bulk: (count: number) => `批量操作 · 已选 ${count} 个`,
        clearSelectAll: "取消全选",
        selectAll: "全选当前列表",
        bulkArchive: "批量归档",
        bindBrand: "批量绑定品牌",
        bindIndustry: "批量绑定行业模板",
        appendTags: "批量追加标签，逗号分隔",
        bind: "绑定",
        addTags: "加标签",
        pinnedLabel: "置顶",
        trends: "trends",
        scenes: "scenes",
        open: "打开",
        pin: "置顶",
        unpin: "取消置顶",
        restore: "恢复",
        archive: "归档",
        emptyFiltered: "当前筛选条件下没有项目。可以调整搜索词、模式或状态筛选。",
      };
  const sourceLabel =
    workspaceMode === "SHORT_VIDEO"
      ? ui.sourceShortVideo
      : workspaceMode === "COPYWRITING"
        ? ui.sourceCopy
        : ui.sourcePromo;

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.topic_query.toLowerCase().includes(normalizedQuery) ||
        project.id.toLowerCase().includes(normalizedQuery) ||
        (project.project_tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
      const matchesMode = modeFilter === "ALL" || (project.workspace_mode ?? "SHORT_VIDEO") === modeFilter;
      return matchesQuery && matchesStatus && matchesMode;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "recent") {
        const pinnedDiff = Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned));
        if (pinnedDiff !== 0) return pinnedDiff;
        const aOpened = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
        const bOpened = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
        if (aOpened !== bOpened) return bOpened - aOpened;
      }
      if (sortBy === "title") return a.title.localeCompare(b.title, locale === "en" ? "en-US" : "zh-Hans-CN");
      if (sortBy === "trends") return b.trend_count - a.trend_count;
      if (sortBy === "scenes") return b.scene_count - a.scene_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [locale, modeFilter, projects, query, sortBy, statusFilter]);

  async function refreshProjects() {
    const response = await fetch("/api/projects");
    const payload = (await response.json()) as { success: boolean; data?: ProjectSummary[]; error?: { message?: string } };
    if (payload.success && payload.data) {
      setProjects(payload.data);
      setSelectedIds((current) => current.filter((id) => payload.data?.some((project) => project.id === id)));
    }
  }

  async function createProject(formData: FormData) {
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const payload = {
      title: String(formData.get("title") || ""),
      topic: String(formData.get("topic") || ""),
      sourceScript: String(formData.get("sourceScript") || ""),
      projectIntroduction: String(formData.get("projectIntroduction") || ""),
      coreIdea: String(formData.get("coreIdea") || ""),
      styleReferenceSample: String(formData.get("styleReferenceSample") || ""),
      writingMode,
      styleTemplate,
      copyLength,
      usageScenario,
      platforms: modeMeta.platforms,
      workspaceMode,
    };

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: { project: { id: string } };
      error?: { message?: string; detail?: string };
    };

    if (!result.success || !result.data) {
      setError(result.error?.detail || result.error?.message || ui.createFailed);
      setSubmitting(false);
      return;
    }

    setMessage(ui.created(result.data.project.id));
    setSubmitting(false);
    await refreshProjects();
    router.push(`/?projectId=${result.data.project.id}`);
    router.refresh();
  }

  async function updateProjectStatus(projectId: string, status: ProjectSummary["status"]) {
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };

    if (!payload.success) {
      setError(payload.error?.detail || payload.error?.message || ui.updateFailed);
      return;
    }

    setMessage(status === "ARCHIVED" ? ui.archived : ui.restored);
    await refreshProjects();
    router.refresh();
  }

  async function togglePinned(projectId: string, nextPinned: boolean) {
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: nextPinned }),
    });
    const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };

    if (!payload.success) {
      setError(payload.error?.detail || payload.error?.message || ui.updateFailed);
      return;
    }

    setMessage(nextPinned ? ui.pinned : ui.unpinned);
    await refreshProjects();
    router.refresh();
  }

  function toggleSelection(projectId: string) {
    setSelectedIds((current) => (current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]));
  }

  function toggleSelectAll() {
    const visibleIds = visibleProjects.map((project) => project.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allVisibleSelected ? selectedIds.filter((id) => !visibleIds.includes(id)) : [...new Set([...selectedIds, ...visibleIds])]);
  }

  async function runBulkUpdate(input: {
    status?: ProjectSummary["status"];
    brand_profile_id?: string | null;
    industry_template_id?: string | null;
    project_tags?: string[];
    merge_tags?: boolean;
  }) {
    if (selectedIds.length === 0) {
      setError(ui.selectFirst);
      return;
    }

    setBulkPending(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/projects/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_ids: selectedIds,
        ...input,
      }),
    });

    const payload = (await response.json()) as { success: boolean; data?: { updated_count: number }; error?: { message?: string; detail?: string } };

    if (!payload.success) {
      setError(payload.error?.detail || payload.error?.message || ui.bulkFailed);
      setBulkPending(false);
      return;
    }

    setMessage(ui.updatedCount(payload.data?.updated_count ?? selectedIds.length));
    setBulkPending(false);
    await refreshProjects();
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* ── Toolbar: project count + actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[var(--text-2)]">
          {ui.count(projects.length, visibleProjects.length)}
        </div>
        <Button type="button" variant="ghost" onClick={() => void refreshProjects()}>
          {ui.refresh}
        </Button>
      </div>

      {/* ── Create form: collapsed by default ── */}
      <Disclosure
        title={<span className="text-sm font-semibold text-[var(--text-1)]">{ui.createDisclosure}</span>}
        className="theme-panel-muted rounded-2xl p-4"
        summaryClassName="py-1"
        contentClassName="mt-4 space-y-5"
      >
        <form action={createProject} className="space-y-5">
          <ProjectModePicker value={workspaceMode} locale={locale} onChange={setWorkspaceMode} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.projectName}</span>
              <input name="title" key={`${workspaceMode}-title`} defaultValue={modeMeta.titleDefault} className="theme-input rounded-xl px-4 py-3 text-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.topic}</span>
              <input name="topic" key={`${workspaceMode}-topic`} defaultValue={modeMeta.topicDefault} className="theme-input rounded-xl px-4 py-3 text-sm" />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">
              {sourceLabel}
            </span>
            <textarea name="sourceScript" rows={4} key={`${workspaceMode}-script`} defaultValue={modeMeta.sourceScriptDefault} className="theme-input rounded-xl px-4 py-3 text-sm leading-7" />
          </label>

          {/* ── Advanced settings: collapsed by default ── */}
          <Disclosure
            title={<span className="text-xs font-medium text-[var(--text-2)]">{ui.advanced}</span>}
            className="theme-panel rounded-xl p-3"
            summaryClassName="py-1"
            contentClassName="mt-3 space-y-4"
          >
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.projectIntro}</span>
              <textarea name="projectIntroduction" rows={3} placeholder={ui.projectIntroPlaceholder} className="theme-input rounded-xl px-4 py-3 text-sm leading-7" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.coreIdea}</span>
              <textarea name="coreIdea" rows={2} placeholder={ui.coreIdeaPlaceholder} className="theme-input rounded-xl px-4 py-3 text-sm leading-7" />
            </label>

            {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
              <>
                <div className="space-y-3">
                  <div className="text-sm font-medium text-[var(--text-2)]">{ui.writingMode}</div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {writingModeList.map((mode) => {
                      const meta = getWritingModeMeta(mode, locale);
                      const active = writingMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setWritingMode(mode)}
                          className={cn(
                            "rounded-xl border p-3 text-left transition",
                            active
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                              : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
                          )}
                        >
                          <div className="text-sm font-semibold text-[var(--text-1)]">{meta.label}</div>
                          <div className="mt-1.5 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-[var(--text-3)]">{ui.currentWritingMode}: {writingMeta.label}</div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--text-2)]">{ui.copyLength}</span>
                    <select value={copyLength} onChange={(event) => setCopyLength(event.target.value as CopyLength)} className="theme-input w-full rounded-xl px-4 py-3 text-sm">
                      {copyLengthList.map((item) => (
                        <option key={item} value={item}>
                          {getCopyLengthMeta(item, locale).label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--text-2)]">{ui.usageScenario}</span>
                    <select value={usageScenario} onChange={(event) => setUsageScenario(event.target.value as UsageScenario)} className="theme-input w-full rounded-xl px-4 py-3 text-sm">
                      {usageScenarioList.map((item) => (
                        <option key={item} value={item}>
                          {getUsageScenarioMeta(item, locale).label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-[var(--text-2)]">{ui.outputStyle}</div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {styleTemplateList.map((style) => {
                      const meta = getStyleTemplateMeta(style, locale);
                      const active = styleTemplate === style;
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setStyleTemplate(style)}
                          className={cn(
                            "rounded-xl border p-3 text-left transition",
                            active
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                              : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
                          )}
                        >
                          <div className="text-sm font-semibold text-[var(--text-1)]">{meta.label}</div>
                          <div className="mt-1.5 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-[var(--text-3)]">{ui.currentStyle}: {styleMeta.label}</div>
                </div>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.styleReference}</span>
                  <textarea
                    name="styleReferenceSample"
                    rows={4}
                    placeholder={ui.styleReferencePlaceholder}
                    className="theme-input rounded-xl px-4 py-3 text-sm leading-7"
                  />
                </label>
              </>
            ) : null}
          </Disclosure>

          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
            <span className="rounded-full border border-[var(--border)] px-3 py-1.5">{ui.defaultPlatforms}: {modeMeta.platforms.join(" / ")}</span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1.5">{ui.currentMode}: {modeMeta.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? ui.creating : ui.createProject}
            </Button>
            {message ? <div className="text-sm text-[var(--ok-text)]">{message}</div> : null}
            {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
          </div>
        </form>
      </Disclosure>

      {/* ── Search & Filter bar ── */}
      <div className="theme-panel-muted space-y-3 rounded-2xl p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_160px]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ui.searchPlaceholder} className="theme-input rounded-xl px-4 py-2.5 text-sm" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="theme-input rounded-xl px-3 py-2.5 text-sm">
            <option value="ALL">{ui.allStatuses}</option>
            <option value="COMPLETED">{ui.completed}</option>
            <option value="RUNNING">{ui.running}</option>
            <option value="FAILED">{ui.failed}</option>
            <option value="ARCHIVED">{ui.archivedStatus}</option>
          </select>
          <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value as typeof modeFilter)} className="theme-input rounded-xl px-3 py-2.5 text-sm">
            <option value="ALL">{ui.allModes}</option>
            <option value="SHORT_VIDEO">{ui.shortVideo}</option>
            <option value="COPYWRITING">{ui.copywriting}</option>
            <option value="PROMOTION">{ui.promotion}</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="theme-input rounded-xl px-3 py-2.5 text-sm">
            <option value="recent">{ui.sortRecent}</option>
            <option value="newest">{ui.sortNewest}</option>
            <option value="title">{ui.sortTitle}</option>
            <option value="trends">{ui.sortTrends}</option>
            <option value="scenes">{ui.sortScenes}</option>
          </select>
        </div>
        <div className="text-xs text-[var(--text-3)]">
          {ui.archiveHint}
        </div>
      </div>

      {showBulkActions ? (
        <Disclosure
          title={<span className="text-sm font-medium text-[var(--text-1)]">{ui.bulk(selectedIds.length)}</span>}
          className="theme-panel rounded-2xl p-4"
          summaryClassName="py-1"
          contentClassName="mt-3 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={toggleSelectAll}>
              {visibleProjects.length > 0 && visibleProjects.every((project) => selectedIds.includes(project.id)) ? ui.clearSelectAll : ui.selectAll}
            </Button>
            <Button type="button" variant="secondary" disabled={bulkPending} onClick={() => void runBulkUpdate({ status: "ARCHIVED" })}>
              {ui.bulkArchive}
            </Button>
          </div>
          <div className="grid gap-3 xl:grid-cols-[200px_200px_minmax(0,1fr)_auto]">
            <select value={bulkBrandId} onChange={(event) => setBulkBrandId(event.target.value)} className="theme-input rounded-xl px-3 py-2.5 text-sm">
              <option value="">{ui.bindBrand}</option>
              {brandProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.brand_name}
                </option>
              ))}
            </select>
            <select value={bulkIndustryId} onChange={(event) => setBulkIndustryId(event.target.value)} className="theme-input rounded-xl px-3 py-2.5 text-sm">
              <option value="">{ui.bindIndustry}</option>
              {industryTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.industry_name}
                </option>
              ))}
            </select>
            <input value={bulkTags} onChange={(event) => setBulkTags(event.target.value)} placeholder={ui.appendTags} className="theme-input rounded-xl px-3 py-2.5 text-sm" />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={bulkPending || (!bulkBrandId && !bulkIndustryId)}
                onClick={() =>
                  void runBulkUpdate({
                    brand_profile_id: bulkBrandId || undefined,
                    industry_template_id: bulkIndustryId || undefined,
                  })
                }
              >
                {ui.bind}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={bulkPending || !bulkTags.trim()}
                onClick={() =>
                  void runBulkUpdate({
                    project_tags: bulkTags
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    merge_tags: true,
                  })
                }
              >
                {ui.addTags}
              </Button>
            </div>
          </div>
        </Disclosure>
      ) : null}

      {/* ── Project list ── */}
      <div className="space-y-2.5">
        {visibleProjects.map((project) => (
          <div key={project.id} className="theme-panel grid gap-4 rounded-2xl px-4 py-3.5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="pt-0.5">
              <input type="checkbox" checked={selectedIds.includes(project.id)} onChange={() => toggleSelection(project.id)} className="size-4 accent-[var(--accent-strong)]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-[var(--text-1)]">{project.title}</div>
                <span className="theme-chip rounded-full px-2 py-0.5 text-xs font-medium">{project.status}</span>
                {project.is_pinned ? <span className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent-strong)]">{ui.pinnedLabel}</span> : null}
                <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium text-[var(--text-2)]", project.workspace_mode === "SHORT_VIDEO" ? "theme-chip-ok" : "border-[var(--border)]")}>
                  {getWorkspaceModeMeta(project.workspace_mode ?? "SHORT_VIDEO", locale).label}
                </span>
              </div>
              <div className="mt-1 text-sm text-[var(--text-2)]">{project.topic_query}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(project.project_tags ?? []).map((tag) => (
                  <span key={`${project.id}-${tag}`} className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-2)]">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-[var(--text-3)]">
                {project.id} · {ui.trends} {project.trend_count} · {ui.scenes} {project.scene_count}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => router.push(`/?projectId=${project.id}`)}>
                {ui.open}
              </Button>
              <Button type="button" variant="ghost" onClick={() => void togglePinned(project.id, !project.is_pinned)}>
                {project.is_pinned ? ui.unpin : ui.pin}
              </Button>
              {project.status === "ARCHIVED" ? (
                <Button type="button" variant="ghost" onClick={() => void updateProjectStatus(project.id, "COMPLETED")}>
                  {ui.restore}
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => void updateProjectStatus(project.id, "ARCHIVED")}>
                  {ui.archive}
                </Button>
              )}
            </div>
          </div>
        ))}
        {visibleProjects.length === 0 ? <div className="theme-panel rounded-2xl px-5 py-4 text-sm text-[var(--text-2)]">{ui.emptyFiltered}</div> : null}
      </div>
    </div>
  );
}
