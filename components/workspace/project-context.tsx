"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FolderKanban, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import type { StyleReferenceInsight } from "@/lib/style-reference";
import type { Locale } from "@/lib/locale-copy";
import { copy } from "@/lib/locale-copy";
import { copyLengthList, getCopyLengthMeta, getUsageScenarioMeta, type CopyLength, type UsageScenario, usageScenarioList } from "@/lib/copy-goal";
import { getStyleTemplateMeta, styleTemplateList, type StyleTemplate } from "@/lib/style-template";
import { getWritingModeMeta, writingModeList, type WritingMode } from "@/lib/writing-mode";
import type { WorkspaceMode } from "@/lib/workspace-mode";
import { getWorkspaceModeMeta } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";

export function ProjectContext({
  project,
  recentProjects,
  locale,
  density = "compact",
}: {
  project: {
    id: string;
    title: string;
    topic_query: string;
    workspaceMode?: WorkspaceMode;
    introduction?: string | null;
    coreIdea?: string | null;
    originalScript?: string | null;
    styleReferenceSample?: string | null;
    styleReferenceInsight?: StyleReferenceInsight | null;
    writingMode?: WritingMode | null;
    writingModeLabel?: string | null;
    styleTemplate?: StyleTemplate | null;
    styleTemplateLabel?: string | null;
    copyLength?: CopyLength | null;
    copyLengthLabel?: string | null;
    usageScenario?: UsageScenario | null;
    usageScenarioLabel?: string | null;
  } | null;
  recentProjects: Array<{ id: string; title: string; topic_query: string; is_pinned?: boolean }>;
  locale: Locale;
  density?: "compact" | "expanded";
}) {
  const router = useRouter();
  const text = copy[locale].common;
  const modeLabel = project?.workspaceMode ? getWorkspaceModeMeta(project.workspaceMode, locale).label : null;
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(project?.title ?? "");
  const [topicQuery, setTopicQuery] = useState(project?.topic_query ?? "");
  const [introduction, setIntroduction] = useState(project?.introduction ?? "");
  const [coreIdea, setCoreIdea] = useState(project?.coreIdea ?? "");
  const [originalScript, setOriginalScript] = useState(project?.originalScript ?? "");
  const [styleReferenceSample, setStyleReferenceSample] = useState(project?.styleReferenceSample ?? "");
  const [writingMode, setWritingMode] = useState<WritingMode>((project?.writingMode as WritingMode | null) ?? "PRODUCT_PROMO");
  const [styleTemplate, setStyleTemplate] = useState<StyleTemplate>((project?.styleTemplate as StyleTemplate | null) ?? "RATIONAL_PRO");
  const [copyLength, setCopyLength] = useState<CopyLength>((project?.copyLength as CopyLength | null) ?? "STANDARD");
  const [usageScenario, setUsageScenario] = useState<UsageScenario>((project?.usageScenario as UsageScenario | null) ?? "XIAOHONGSHU_POST");
  const [brandProfileId, setBrandProfileId] = useState("");
  const [industryTemplateId, setIndustryTemplateId] = useState("");
  const [availableBrandProfiles, setAvailableBrandProfiles] = useState<Array<{ id: string; brand_name: string }>>([]);
  const [availableIndustryTemplates, setAvailableIndustryTemplates] = useState<Array<{ id: string; industry_name: string }>>([]);

  useEffect(() => {
    if (!project?.id) return;

    void fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        last_opened_at: new Date().toISOString(),
      }),
    });
  }, [project?.id]);

  useEffect(() => {
    if (isEditing && project?.id) {
      void fetch(`/api/projects/${project.id}`)
        .then((res) => res.json())
        .then((payload) => {
          if (payload.success && payload.data) {
            setBrandProfileId(payload.data.brand_profile_id || "");
            setIndustryTemplateId(payload.data.industry_template_id || "");
          }
        });

      void fetch("/api/brand-profiles")
        .then((res) => res.json())
        .then((payload) => {
          if (payload.success && Array.isArray(payload.data)) {
            setAvailableBrandProfiles(payload.data);
          }
        });

      void fetch("/api/industry-templates")
        .then((res) => res.json())
        .then((payload) => {
          if (payload.success && Array.isArray(payload.data)) {
            setAvailableIndustryTemplates(payload.data);
          }
        });
    }
  }, [isEditing, project?.id]);

  useEffect(() => {
    if (!project) {
      return;
    }
    setTitle(project.title ?? "");
    setTopicQuery(project.topic_query ?? "");
    setIntroduction(project.introduction ?? "");
    setCoreIdea(project.coreIdea ?? "");
    setOriginalScript(project.originalScript ?? "");
    setStyleReferenceSample(project.styleReferenceSample ?? "");
    setWritingMode((project.writingMode as WritingMode | null) ?? "PRODUCT_PROMO");
    setStyleTemplate((project.styleTemplate as StyleTemplate | null) ?? "RATIONAL_PRO");
    setCopyLength((project.copyLength as CopyLength | null) ?? "STANDARD");
    setUsageScenario((project.usageScenario as UsageScenario | null) ?? "XIAOHONGSHU_POST");
    setIsEditing(false);
    setMessage(null);
    setError(null);
  }, [project]);

  async function saveProjectContext() {
    if (!project?.id) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          topic_query: topicQuery.trim(),
          raw_script_text: originalScript.trim(),
          project_introduction: introduction.trim(),
          core_idea: coreIdea.trim(),
          style_reference_sample: styleReferenceSample.trim(),
          writing_mode: writingMode,
          style_template: styleTemplate,
          usage_scenario: usageScenario,
          brand_profile_id: brandProfileId || null,
          industry_template_id: industryTemplateId || null,
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: { message?: string; detail?: string };
      };
      if (!payload.success) {
        throw new Error(payload.error?.detail || payload.error?.message || "保存失败。");
      }
      setMessage("项目信息已更新。");
      setIsEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  const summaryLine = project
    ? [
        project.introduction,
        project.coreIdea,
        project.originalScript,
      ]
        .find((item) => item && item.trim().length > 0)
        ?.trim()
    : null;
  const compactMeta = [
    project?.writingModeLabel ? `写作：${project.writingModeLabel}` : null,
    project?.styleTemplateLabel ? `风格：${project.styleTemplateLabel}` : null,
    project?.copyLengthLabel ? `长度：${project.copyLengthLabel}` : null,
    project?.usageScenarioLabel ? `场景：${project.usageScenarioLabel}` : null,
  ].filter(Boolean) as string[];
  const showExpandedDetails = density === "expanded";
  const detailContent = (
    <div className="grid gap-3 md:grid-cols-2">
      {project?.introduction ? (
        <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目介绍</div>
          <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.introduction}</div>
        </div>
      ) : null}
      {project?.coreIdea ? (
        <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">核心想法</div>
          <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.coreIdea}</div>
        </div>
      ) : null}
      {project?.originalScript ? (
        <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">原始脚本 / 初始输入</div>
          <div className="mt-2 line-clamp-5 text-sm leading-7 text-[var(--text-2)] whitespace-pre-wrap">{project.originalScript}</div>
        </div>
      ) : null}
      {project?.styleReferenceInsight ? (
        <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">系统学到的风格特征</div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {(project.styleReferenceInsight.summaryLines ?? []).slice(0, showExpandedDetails ? undefined : 4).map((line) => (
              <div key={line} className="rounded-xl bg-[var(--surface-solid)] px-3 py-2 text-sm leading-7 text-[var(--text-2)]">
                {line}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {project?.styleReferenceSample ? (
        <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">风格参照 / 参考样稿</div>
          <div className="mt-2 line-clamp-4 text-sm leading-7 text-[var(--text-2)] whitespace-pre-wrap">{project.styleReferenceSample}</div>
        </div>
      ) : null}
    </div>
  );

  if (density === "compact") {
    return (
      <div className="theme-panel overflow-hidden rounded-[30px] px-5 py-5 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-3)]">
              <span>当前项目</span>
              {modeLabel ? <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] text-[var(--text-2)] normal-case tracking-normal">{modeLabel}</span> : null}
              {project ? <span className="text-[10px] tracking-[0.12em] text-[var(--text-3)]">{project.id}</span> : null}
            </div>
            {project ? (
              <>
                <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                  <h3 className="theme-font-display text-[2rem] font-semibold tracking-tight text-[var(--text-1)]">{project.title}</h3>
                </div>
                {project.topic_query ? <div className="mt-1 text-sm text-[var(--text-2)]">{project.topic_query}</div> : null}
                {summaryLine ? <div className="mt-3 max-w-5xl text-sm leading-7 text-[var(--text-2)] line-clamp-2">{summaryLine}</div> : null}
                {compactMeta.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {compactMeta.map((item) => (
                      <span key={item} className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs text-[var(--text-2)]">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-4 rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(183,186,162,0.10),rgba(255,255,255,0.42))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                      <Sparkles className="size-3.5" />
                      Ready for a fresh brief
                    </div>
                    <h3 className="theme-font-display mt-4 text-[2rem] font-semibold tracking-tight text-[var(--text-1)]">还没有选中项目</h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-2)]">
                      先从总览页新建一个项目，或者去项目中心挑一个继续做。选中之后，这里会立刻变成你的任务摘要、边界条件和下一步入口。
                    </p>
                  </div>
                  <div className="grid gap-2 sm:min-w-[220px]">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-between rounded-[20px] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-medium text-[var(--text-inverse)] shadow-[0_18px_38px_rgba(196,111,66,0.22)] transition hover:-translate-y-0.5"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Plus className="size-4" />
                        去总览新建项目
                      </span>
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/project-hub"
                      className="inline-flex items-center justify-between rounded-[20px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-solid)_92%,transparent)] px-4 py-3 text-sm font-medium text-[var(--text-1)] transition hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--accent)_30%,var(--border))]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FolderKanban className="size-4 text-[var(--accent-strong)]" />
                        去项目中心切换
                      </span>
                      <ArrowRight className="size-4 text-[var(--text-3)]" />
                    </Link>
                  </div>
                </div>
                {recentProjects.length > 0 ? (
                  <div className="mt-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">最近项目</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recentProjects.slice(0, 3).map((item) => (
                        <Link
                          key={item.id}
                          href={`/brief-studio?projectId=${item.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-solid)] px-3 py-2 text-sm text-[var(--text-2)] transition hover:border-[color:color-mix(in_srgb,var(--accent)_30%,var(--border-soft))] hover:text-[var(--text-1)]"
                        >
                          <span className="font-medium">{item.title}</span>
                          <ArrowRight className="size-3.5 text-[var(--text-3)]" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {project ? (
                <Button type="button" variant="ghost" onClick={() => setIsEditing((value) => !value)}>
                  {isEditing ? "收起编辑" : "编辑项目信息"}
                </Button>
              ) : null}
              {project && !isEditing && (project.introduction || project.coreIdea || project.originalScript || project.styleReferenceSample || project.styleReferenceInsight) ? (
                <Disclosure
                  title={<span className="text-sm font-medium text-[var(--text-2)]">查看项目背景</span>}
                  defaultOpen={false}
                  className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-solid)] px-4 py-2"
                >
                  <div className="mt-4 border-t border-[var(--border-soft)] pt-4">{detailContent}</div>
                </Disclosure>
              ) : null}
              {message ? <div className="text-sm text-[var(--accent-strong)]">{message}</div> : null}
              {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
            </div>
          </div>
        </div>
        {project && isEditing ? (
          <div className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <label className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目名称</div>
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目主题</div>
                <input value={topicQuery} onChange={(event) => setTopicQuery(event.target.value)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 xl:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目介绍</div>
                <textarea value={introduction} onChange={(event) => setIntroduction(event.target.value)} rows={3} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" />
              </label>
              <label className="space-y-2 xl:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">核心想法</div>
                <textarea value={coreIdea} onChange={(event) => setCoreIdea(event.target.value)} rows={3} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" />
              </label>
              <label className="space-y-2 xl:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">风格参照 / 参考样稿</div>
                <textarea value={styleReferenceSample} onChange={(event) => setStyleReferenceSample(event.target.value)} rows={6} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" />
                <div className="text-xs leading-6 text-[var(--text-3)]">可粘贴多段你喜欢的文案。系统会学习语气、节奏和结构，不会直接照抄内容。</div>
              </label>
              <label className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">品牌档案</div>
                <select value={brandProfileId} onChange={(event) => setBrandProfileId(event.target.value)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                  <option value="">（未绑定 / 清除绑定）</option>
                  {availableBrandProfiles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.brand_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">行业模板</div>
                <select value={industryTemplateId} onChange={(event) => setIndustryTemplateId(event.target.value)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                  <option value="">（未绑定 / 清除绑定）</option>
                  {availableIndustryTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.industry_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 xl:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">写作模式</div>
                <select value={writingMode} onChange={(event) => setWritingMode(event.target.value as WritingMode)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                  {writingModeList.map((item) => (
                    <option key={item} value={item}>
                      {getWritingModeMeta(item, locale).label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">输出风格</div>
                <select value={styleTemplate} onChange={(event) => setStyleTemplate(event.target.value as StyleTemplate)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                  {styleTemplateList.map((item) => (
                    <option key={item} value={item}>
                      {getStyleTemplateMeta(item, locale).label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">文案长度</div>
                <select value={copyLength} onChange={(event) => setCopyLength(event.target.value as CopyLength)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                  {copyLengthList.map((item) => (
                    <option key={item} value={item}>
                      {getCopyLengthMeta(item, locale).label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">使用场景</div>
                <select value={usageScenario} onChange={(event) => setUsageScenario(event.target.value as UsageScenario)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                  {usageScenarioList.map((item) => (
                    <option key={item} value={item}>
                      {getUsageScenarioMeta(item, locale).label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 xl:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">原始脚本 / 初始输入</div>
                <textarea value={originalScript} onChange={(event) => setOriginalScript(event.target.value)} rows={6} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void saveProjectContext()} disabled={saving}>
                {saving ? "保存中..." : "保存项目信息"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setTitle(project?.title ?? "");
                  setTopicQuery(project?.topic_query ?? "");
                  setIntroduction(project?.introduction ?? "");
                  setCoreIdea(project?.coreIdea ?? "");
                  setOriginalScript(project?.originalScript ?? "");
                  setStyleReferenceSample(project?.styleReferenceSample ?? "");
                  setWritingMode((project?.writingMode as WritingMode | null) ?? "PRODUCT_PROMO");
                  setStyleTemplate((project?.styleTemplate as StyleTemplate | null) ?? "RATIONAL_PRO");
                  setCopyLength((project?.copyLength as CopyLength | null) ?? "STANDARD");
                  setUsageScenario((project?.usageScenario as UsageScenario | null) ?? "XIAOHONGSHU_POST");
                  setIsEditing(false);
                  setMessage(null);
                  setError(null);
                }}
                disabled={saving}
              >
                取消
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="theme-panel rounded-[28px] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-3)]">{text.projectContext}</div>
        {project ? (
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <div>
                <div className="text-3xl font-semibold tracking-tight text-[var(--text-1)]">{project.title}</div>
                <div className="mt-2 max-w-3xl text-lg leading-8 text-[var(--text-2)]">{project.topic_query}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-3)]">{project.id}</div>
                  {modeLabel ? <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-2)]">{modeLabel}</span> : null}
                </div>
                {summaryLine ? <div className="mt-3 max-w-5xl text-sm leading-7 text-[var(--text-2)]">{summaryLine}</div> : null}
                {compactMeta.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {compactMeta.map((item) => (
                      <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs text-[var(--text-2)]">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button type="button" variant={isEditing ? "secondary" : "primary"} onClick={() => setIsEditing((value) => !value)}>
                    {isEditing ? "收起编辑" : "编辑项目信息"}
                  </Button>
                  {message ? <div className="text-sm text-[var(--accent-strong)]">{message}</div> : null}
                  {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
                </div>
                {isEditing ? (
                  <div className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <label className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目名称</div>
                        <input value={title} onChange={(event) => setTitle(event.target.value)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm" />
                      </label>
                      <label className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目主题</div>
                        <input value={topicQuery} onChange={(event) => setTopicQuery(event.target.value)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm" />
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目介绍</div>
                        <textarea
                          value={introduction}
                          onChange={(event) => setIntroduction(event.target.value)}
                          rows={3}
                          className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7"
                        />
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">核心想法</div>
                        <textarea value={coreIdea} onChange={(event) => setCoreIdea(event.target.value)} rows={3} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" />
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">风格参照 / 参考样稿</div>
                        <textarea
                          value={styleReferenceSample}
                          onChange={(event) => setStyleReferenceSample(event.target.value)}
                          rows={6}
                          className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7"
                        />
                        <div className="text-xs leading-6 text-[var(--text-3)]">可粘贴多段你喜欢的文案。系统会学习语气、节奏和结构，不会直接照抄内容。</div>
                      </label>
                      <label className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">品牌档案</div>
                        <select value={brandProfileId} onChange={(event) => setBrandProfileId(event.target.value)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                          <option value="">（未绑定 / 清除绑定）</option>
                          {availableBrandProfiles.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.brand_name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">行业模板</div>
                        <select value={industryTemplateId} onChange={(event) => setIndustryTemplateId(event.target.value)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                          <option value="">（未绑定 / 清除绑定）</option>
                          {availableIndustryTemplates.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.industry_name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">写作模式</div>
                        <select value={writingMode} onChange={(event) => setWritingMode(event.target.value as WritingMode)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                          {writingModeList.map((item) => (
                            <option key={item} value={item}>
                              {getWritingModeMeta(item, locale).label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">输出风格</div>
                        <select value={styleTemplate} onChange={(event) => setStyleTemplate(event.target.value as StyleTemplate)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                          {styleTemplateList.map((item) => (
                            <option key={item} value={item}>
                              {getStyleTemplateMeta(item, locale).label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">文案长度</div>
                        <select value={copyLength} onChange={(event) => setCopyLength(event.target.value as CopyLength)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                          {copyLengthList.map((item) => (
                            <option key={item} value={item}>
                              {getCopyLengthMeta(item, locale).label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">使用场景</div>
                        <select value={usageScenario} onChange={(event) => setUsageScenario(event.target.value as UsageScenario)} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm">
                          {usageScenarioList.map((item) => (
                            <option key={item} value={item}>
                              {getUsageScenarioMeta(item, locale).label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">原始脚本 / 初始输入</div>
                        <textarea
                          value={originalScript}
                          onChange={(event) => setOriginalScript(event.target.value)}
                          rows={6}
                          className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button type="button" onClick={() => void saveProjectContext()} disabled={saving}>
                        {saving ? "保存中..." : "保存项目信息"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setTitle(project.title ?? "");
                          setTopicQuery(project.topic_query ?? "");
                          setIntroduction(project.introduction ?? "");
                          setCoreIdea(project.coreIdea ?? "");
                          setOriginalScript(project.originalScript ?? "");
                          setStyleReferenceSample(project.styleReferenceSample ?? "");
                          setWritingMode((project.writingMode as WritingMode | null) ?? "PRODUCT_PROMO");
                          setStyleTemplate((project.styleTemplate as StyleTemplate | null) ?? "RATIONAL_PRO");
                          setCopyLength((project.copyLength as CopyLength | null) ?? "STANDARD");
                          setUsageScenario((project.usageScenario as UsageScenario | null) ?? "XIAOHONGSHU_POST");
                          setIsEditing(false);
                          setMessage(null);
                          setError(null);
                        }}
                        disabled={saving}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : null}
                {showExpandedDetails && (project.introduction || project.coreIdea || project.originalScript || project.styleReferenceSample) ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {project.introduction ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目介绍</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.introduction}</div>
                      </div>
                    ) : null}
                    {project.coreIdea ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">核心想法</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.coreIdea}</div>
                      </div>
                    ) : null}
                    {project.writingModeLabel ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">写作模式</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.writingModeLabel}</div>
                      </div>
                    ) : null}
                    {project.styleTemplateLabel ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">输出风格</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.styleTemplateLabel}</div>
                      </div>
                    ) : null}
                    {project.copyLengthLabel ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">文案长度</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.copyLengthLabel}</div>
                      </div>
                    ) : null}
                    {project.usageScenarioLabel ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">使用场景</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.usageScenarioLabel}</div>
                      </div>
                    ) : null}
                    {project.originalScript ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">原始脚本 / 初始输入</div>
                        <div className="mt-2 line-clamp-4 text-sm leading-7 text-[var(--text-2)] whitespace-pre-wrap">{project.originalScript}</div>
                      </div>
                    ) : null}
                    {project.styleReferenceInsight ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">系统学到的风格特征</div>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          {(project.styleReferenceInsight.summaryLines ?? []).map((line) => (
                            <div key={line} className="rounded-xl bg-[var(--surface-solid)] px-3 py-2 text-sm leading-7 text-[var(--text-2)]">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {project.styleReferenceSample ? (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">风格参照 / 参考样稿</div>
                        <div className="mt-2 line-clamp-5 text-sm leading-7 text-[var(--text-2)] whitespace-pre-wrap">{project.styleReferenceSample}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {!showExpandedDetails && (project.introduction || project.coreIdea || project.originalScript || project.styleReferenceSample || project.styleReferenceInsight) ? (
                  <div className="mt-4">
                    <Disclosure
                      summary="查看项目背景"
                      defaultOpen={false}
                      className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4"
                      summaryClassName="text-sm font-medium text-[var(--text-1)]"
                    >
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {project.introduction ? (
                          <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">项目介绍</div>
                            <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.introduction}</div>
                          </div>
                        ) : null}
                        {project.coreIdea ? (
                          <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">核心想法</div>
                            <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{project.coreIdea}</div>
                          </div>
                        ) : null}
                        {project.originalScript ? (
                          <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">原始脚本 / 初始输入</div>
                            <div className="mt-2 line-clamp-5 text-sm leading-7 text-[var(--text-2)] whitespace-pre-wrap">{project.originalScript}</div>
                          </div>
                        ) : null}
                        {project.styleReferenceInsight ? (
                          <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">系统学到的风格特征</div>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              {(project.styleReferenceInsight.summaryLines ?? []).slice(0, 4).map((line) => (
                                <div key={line} className="rounded-xl bg-[var(--surface-solid)] px-3 py-2 text-sm leading-7 text-[var(--text-2)]">
                                  {line}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {project.styleReferenceSample ? (
                          <div className="rounded-2xl bg-[var(--surface-muted)] p-3 md:col-span-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">风格参照 / 参考样稿</div>
                            <div className="mt-2 line-clamp-4 text-sm leading-7 text-[var(--text-2)] whitespace-pre-wrap">{project.styleReferenceSample}</div>
                          </div>
                        ) : null}
                      </div>
                    </Disclosure>
                  </div>
                ) : null}
              </div>
              <div className="inline-flex items-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                {text.activeProject}
              </div>
            </div>
        ) : (
          <div className="mt-2 text-sm text-[var(--text-2)]">{locale === "en" ? "No projectId selected yet. Create a project first or switch from recent projects." : "未指定 `projectId`。可先创建项目，或从最近项目切换。"}</div>
        )}
      </div>
        <div className="min-w-0 xl:w-[360px]">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-3)]">{text.recentProjects}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentProjects.map((item) => (
              <Link
                key={item.id}
                href={`/?projectId=${item.id}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition",
                  project?.id === item.id
                    ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-[var(--text-inverse)]"
                    : "border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]",
                )}
              >
                {item.is_pinned ? "★ " : ""}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
