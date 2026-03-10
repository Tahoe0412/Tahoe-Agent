"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectModePicker } from "@/components/dashboard/project-mode-picker";
import { copyLengthList, getCopyLengthMeta, getUsageScenarioMeta, type CopyLength, type UsageScenario, usageScenarioList } from "@/lib/copy-goal";
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
}: {
  initialProjects: ProjectSummary[];
  brandProfiles?: SimpleBrandProfile[];
  industryTemplates?: SimpleIndustryTemplate[];
  showBulkActions?: boolean;
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
  const modeMeta = useMemo(() => getWorkspaceModeMeta(workspaceMode, "zh"), [workspaceMode]);
  const writingMeta = useMemo(() => getWritingModeMeta(writingMode, "zh"), [writingMode]);
  const styleMeta = useMemo(() => getStyleTemplateMeta(styleTemplate, "zh"), [styleTemplate]);

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
      if (sortBy === "title") return a.title.localeCompare(b.title, "zh-Hans-CN");
      if (sortBy === "trends") return b.trend_count - a.trend_count;
      if (sortBy === "scenes") return b.scene_count - a.scene_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [modeFilter, projects, query, sortBy, statusFilter]);

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
      setError(result.error?.detail || result.error?.message || "项目创建失败。");
      setSubmitting(false);
      return;
    }

    setMessage(`已创建项目 ${result.data.project.id}`);
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
      setError(payload.error?.detail || payload.error?.message || "项目更新失败。");
      return;
    }

    setMessage(status === "ARCHIVED" ? "项目已归档。" : "项目已恢复。");
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
      setError(payload.error?.detail || payload.error?.message || "项目更新失败。");
      return;
    }

    setMessage(nextPinned ? "项目已置顶。" : "项目已取消置顶。");
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
      setError("请先选择至少一个项目。");
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
      setError(payload.error?.detail || payload.error?.message || "批量更新失败。");
      setBulkPending(false);
      return;
    }

    setMessage(`已更新 ${payload.data?.updated_count ?? selectedIds.length} 个项目。`);
    setBulkPending(false);
    await refreshProjects();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form action={createProject} className="theme-panel-muted space-y-6 rounded-[24px] p-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-3)]">快速创建</div>
          <div className="text-xl font-semibold text-[var(--text-1)]">先选择工作模式，再创建项目</div>
        </div>

        <ProjectModePicker value={workspaceMode} locale="zh" onChange={setWorkspaceMode} />

        {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--text-2)]">写作模式</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {writingModeList.map((mode) => {
                const meta = getWritingModeMeta(mode, "zh");
                const active = writingMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWritingMode(mode)}
                    className={cn(
                      "rounded-[20px] border p-4 text-left transition",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
                    )}
                  >
                    <div className="text-sm font-semibold text-[var(--text-1)]">{meta.label}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-[var(--text-3)]">当前写作模式：{writingMeta.label}</div>
          </div>
        ) : null}

        {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">文案长度</span>
              <select value={copyLength} onChange={(event) => setCopyLength(event.target.value as CopyLength)} className="theme-input w-full rounded-[16px] px-4 py-3 text-sm">
                {copyLengthList.map((item) => (
                  <option key={item} value={item}>
                    {getCopyLengthMeta(item, "zh").label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">使用场景</span>
              <select value={usageScenario} onChange={(event) => setUsageScenario(event.target.value as UsageScenario)} className="theme-input w-full rounded-[16px] px-4 py-3 text-sm">
                {usageScenarioList.map((item) => (
                  <option key={item} value={item}>
                    {getUsageScenarioMeta(item, "zh").label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--text-2)]">输出风格</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {styleTemplateList.map((style) => {
                const meta = getStyleTemplateMeta(style, "zh");
                const active = styleTemplate === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setStyleTemplate(style)}
                    className={cn(
                      "rounded-[20px] border p-4 text-left transition",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
                    )}
                  >
                    <div className="text-sm font-semibold text-[var(--text-1)]">{meta.label}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-[var(--text-3)]">当前输出风格：{styleMeta.label}</div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">项目名称</span>
            <input name="title" key={`${workspaceMode}-title`} defaultValue={modeMeta.titleDefault} className="theme-input rounded-[16px] px-4 py-3 text-sm" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">选题主题</span>
            <input name="topic" key={`${workspaceMode}-topic`} defaultValue={modeMeta.topicDefault} className="theme-input rounded-[16px] px-4 py-3 text-sm" />
          </label>
        </div>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">项目介绍</span>
          <textarea name="projectIntroduction" rows={3} placeholder="这个项目服务谁、解决什么问题、当前阶段如何。" className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">核心想法</span>
          <textarea name="coreIdea" rows={2} placeholder="一句话写清本轮内容最想打中的表达。" className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">
            {workspaceMode === "SHORT_VIDEO" ? "原始脚本 / 核心想法" : workspaceMode === "COPYWRITING" ? "文案需求 / 核心表达" : "推广需求 / 宣传目标"}
          </span>
          <textarea name="sourceScript" rows={5} key={`${workspaceMode}-script`} defaultValue={modeMeta.sourceScriptDefault} className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" />
        </label>
        {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">风格参照 / 参考样稿</span>
            <textarea
              name="styleReferenceSample"
              rows={5}
              placeholder="可粘贴多段你喜欢的宣传文案，系统只学习风格与结构，不照抄内容。"
              className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7"
            />
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
          <span className="rounded-full border border-[var(--border)] px-3 py-1.5">默认平台：{modeMeta.platforms.join(" / ")}</span>
          <span className="rounded-full border border-[var(--border)] px-3 py-1.5">当前模式：{modeMeta.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "创建中..." : "创建新项目"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => void refreshProjects()} disabled={submitting}>
            刷新列表
          </Button>
          {message ? <div className="text-sm text-[var(--ok-text)]">{message}</div> : null}
          {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
        </div>
      </form>

      <div className="theme-panel-muted space-y-4 rounded-[24px] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索项目名、主题、标签或 ID" className="theme-input rounded-[16px] px-4 py-3 text-sm" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="theme-input rounded-[16px] px-4 py-3 text-sm">
            <option value="ALL">全部状态</option>
            <option value="COMPLETED">已完成</option>
            <option value="RUNNING">进行中</option>
            <option value="FAILED">失败</option>
            <option value="ARCHIVED">已归档</option>
          </select>
          <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value as typeof modeFilter)} className="theme-input rounded-[16px] px-4 py-3 text-sm">
            <option value="ALL">全部模式</option>
            <option value="SHORT_VIDEO">短视频</option>
            <option value="COPYWRITING">文案写作</option>
            <option value="PROMOTION">宣传推广</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="theme-input rounded-[16px] px-4 py-3 text-sm">
            <option value="recent">按置顶与最近打开</option>
            <option value="newest">按最近创建</option>
            <option value="title">按名称</option>
            <option value="trends">按趋势数</option>
            <option value="scenes">按场景数</option>
          </select>
        </div>
        <div className="text-sm text-[var(--text-3)]">
          推荐管理方式：先搜索和筛选，再批量处理。历史项目先归档，避免直接删除造成品牌资产、趋势证据和脚本数据丢失。
        </div>
      </div>

      {showBulkActions ? (
        <div className="theme-panel space-y-4 rounded-[24px] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[var(--text-1)]">批量操作</div>
              <div className="mt-1 text-sm text-[var(--text-2)]">当前已选 {selectedIds.length} 个项目。可批量归档、绑定品牌/行业模板，或统一追加标签。</div>
            </div>
            <Button type="button" variant="ghost" onClick={toggleSelectAll}>
              {visibleProjects.length > 0 && visibleProjects.every((project) => selectedIds.includes(project.id)) ? "取消全选" : "全选当前列表"}
            </Button>
          </div>

          <div className="grid gap-3 xl:grid-cols-[180px_220px_220px_minmax(0,1fr)_auto]">
            <Button type="button" variant="secondary" disabled={bulkPending} onClick={() => void runBulkUpdate({ status: "ARCHIVED" })}>
              批量归档
            </Button>
            <select value={bulkBrandId} onChange={(event) => setBulkBrandId(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm">
              <option value="">批量绑定品牌</option>
              {brandProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.brand_name}
                </option>
              ))}
            </select>
            <select value={bulkIndustryId} onChange={(event) => setBulkIndustryId(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm">
              <option value="">批量绑定行业模板</option>
              {industryTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.industry_name}
                </option>
              ))}
            </select>
            <input value={bulkTags} onChange={(event) => setBulkTags(event.target.value)} placeholder="批量追加标签，多个标签用逗号分隔" className="theme-input rounded-[16px] px-4 py-3 text-sm" />
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
                绑定
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
                加标签
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {visibleProjects.map((project) => (
          <div key={project.id} className="theme-panel grid gap-4 rounded-[24px] p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="pt-1">
              <input type="checkbox" checked={selectedIds.includes(project.id)} onChange={() => toggleSelection(project.id)} className="size-4 accent-[var(--accent-strong)]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold text-[var(--text-1)]">{project.title}</div>
                <span className="theme-chip rounded-full px-2.5 py-1 text-xs font-medium">{project.status}</span>
                {project.is_pinned ? <span className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-strong)]">置顶</span> : null}
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium text-[var(--text-2)]", project.workspace_mode === "SHORT_VIDEO" ? "theme-chip-ok" : "border-[var(--border)]")}>
                  {getWorkspaceModeMeta(project.workspace_mode ?? "SHORT_VIDEO", "zh").label}
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
                {project.id} · trends {project.trend_count} · scenes {project.scene_count}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => router.push(`/?projectId=${project.id}`)}>
                打开
              </Button>
              <Button type="button" variant="ghost" onClick={() => void togglePinned(project.id, !project.is_pinned)}>
                {project.is_pinned ? "取消置顶" : "置顶"}
              </Button>
              {project.status === "ARCHIVED" ? (
                <Button type="button" variant="ghost" onClick={() => void updateProjectStatus(project.id, "COMPLETED")}>
                  恢复
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => void updateProjectStatus(project.id, "ARCHIVED")}>
                  归档
                </Button>
              )}
            </div>
          </div>
        ))}
        {visibleProjects.length === 0 ? <div className="theme-panel rounded-[24px] p-5 text-sm text-[var(--text-2)]">当前筛选条件下没有项目。可以调整搜索词、模式或状态筛选。</div> : null}
      </div>
    </div>
  );
}
