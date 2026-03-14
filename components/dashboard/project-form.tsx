"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectModePicker } from "@/components/dashboard/project-mode-picker";
import { copyLengthList, getCopyLengthMeta, getUsageScenarioMeta, type CopyLength, type UsageScenario, usageScenarioList } from "@/lib/copy-goal";
import type { Locale } from "@/lib/locale-copy";
import { getStyleTemplateMeta, type StyleTemplate, styleTemplateList } from "@/lib/style-template";
import { getWritingModeMeta, type WritingMode, writingModeList } from "@/lib/writing-mode";
import { getWorkspaceModeMeta, type WorkspaceMode } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";

export function ProjectForm({ locale = "zh" }: { locale?: Locale }) {
  const router = useRouter();
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("SHORT_VIDEO");
  const [writingMode, setWritingMode] = useState<WritingMode>("PRODUCT_PROMO");
  const [styleTemplate, setStyleTemplate] = useState<StyleTemplate>("RATIONAL_PRO");
  const [copyLength, setCopyLength] = useState<CopyLength>("STANDARD");
  const [usageScenario, setUsageScenario] = useState<UsageScenario>("XIAOHONGSHU_POST");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const modeMeta = useMemo(() => getWorkspaceModeMeta(workspaceMode, locale), [locale, workspaceMode]);
  const writingMeta = useMemo(() => getWritingModeMeta(writingMode, locale), [locale, writingMode]);
  const styleMeta = useMemo(() => getStyleTemplateMeta(styleTemplate, locale), [locale, styleTemplate]);
  const copyLengthMeta = useMemo(() => getCopyLengthMeta(copyLength, locale), [copyLength, locale]);
  const usageScenarioMeta = useMemo(() => getUsageScenarioMeta(usageScenario, locale), [locale, usageScenario]);
  const ui = locale === "en"
    ? {
        created: (id: string) => `Project ${id} created. You can continue with live connectors and model workflows next.`,
        requestFailed: "Request failed.",
        eyebrow: "Start a New Project",
        title: "Choose the kind of work you want to finish first",
        description: "Each mode narrows the navigation, default platforms, and recommended flow so the workspace stays focused from the start.",
        modeSummary: "Mode Summary",
        flowShortVideo: "Trend review -> script rewrite -> storyboard and assets",
        flowCopy: "Brief -> master copy -> channel adaptation -> compliance",
        flowPromo: "Brief -> campaign message -> compliance -> review",
        currentWritingMode: "Current writing mode",
        currentStyle: "Current style",
        currentLength: "Current length",
        currentScenario: "Current use case",
        writingMode: "Writing Mode",
        outputStyle: "Output Style",
        copyLength: "Copy Length",
        usageScenario: "Use Case",
        projectName: "Project Name",
        projectTopic: "Topic",
        projectIntro: "Project Overview",
        projectIntroPlaceholder: "Who is this project for, what does it solve, and what stage is it at right now?",
        coreIdea: "Core Message",
        coreIdeaPlaceholder: "Write the one thought this round really needs to land.",
        sourceLabelShortVideo: "Source Script / Core Idea",
        sourceLabelCopy: "Copy Brief / Core Message",
        sourceLabelPromo: "Campaign Need / Promotion Goal",
        styleReference: "Style Reference / Sample Copy",
        styleReferencePlaceholder: "Paste one to three strong examples. The model learns tone, pacing, sentence length, and structure without copying the text.",
        styleReferenceHint: "Complete sample drafts give you much steadier style control than a few keywords.",
        defaultPlatforms: "Default platforms",
        currentMode: "Current mode",
        creating: "Creating...",
        createProject: "Create Project",
      }
    : {
        created: (id: string) => `已创建项目 ${id}，可继续接入真实平台采集与模型编排。`,
        requestFailed: "请求失败",
        eyebrow: "开始新项目",
        title: "先选择你要完成的工作",
        description: "不同模式会自动收缩导航、默认平台和推荐流程，避免用户一上来就看到全部复杂能力。",
        modeSummary: "模式说明",
        flowShortVideo: "趋势研究 -> 脚本重构 -> 分镜与素材",
        flowCopy: "任务单 -> 改写 -> 平台适配 -> 合规",
        flowPromo: "任务单 -> 推广表达 -> 合规 -> 复盘优化",
        currentWritingMode: "当前写作模式",
        currentStyle: "当前输出风格",
        currentLength: "文案长度",
        currentScenario: "使用场景",
        writingMode: "写作模式",
        outputStyle: "输出风格",
        copyLength: "文案长度",
        usageScenario: "使用场景",
        projectName: "项目名称",
        projectTopic: "选题主题",
        projectIntro: "项目介绍",
        projectIntroPlaceholder: "这个项目是做什么的、面向谁、当前阶段是什么。",
        coreIdea: "核心想法",
        coreIdeaPlaceholder: "一句话写清这轮真正想打动用户的核心表达。",
        sourceLabelShortVideo: "原始脚本 / 核心想法",
        sourceLabelCopy: "文案需求 / 核心表达",
        sourceLabelPromo: "推广需求 / 宣传目标",
        styleReference: "风格参照 / 参考样稿",
        styleReferencePlaceholder: "可粘贴 1-3 段你喜欢的文案。模型会学习语气、节奏、句长和结构，不会直接照抄内容。",
        styleReferenceHint: "建议贴多段完整样稿，比只写几个关键词更能稳定控制文风。",
        defaultPlatforms: "默认平台",
        currentMode: "当前模式",
        creating: "创建中...",
        createProject: "创建项目",
      };
  const sourceLabel =
    workspaceMode === "SHORT_VIDEO"
      ? ui.sourceLabelShortVideo
      : workspaceMode === "COPYWRITING"
        ? ui.sourceLabelCopy
        : ui.sourceLabelPromo;

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setMessage(null);

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { success: boolean; data?: { project: { id: string } }; error?: { message: string } };

    if (result.success && result.data) {
      setMessage(ui.created(result.data.project.id));
      router.push(`/?projectId=${result.data.project.id}`);
    } else {
      setMessage(result.error?.message || ui.requestFailed);
    }

    setSubmitting(false);
  }

  return (
    <form action={handleSubmit} className="theme-panel space-y-6 rounded-[28px] p-6">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-3)]">{ui.eyebrow}</div>
        <div className="text-2xl font-semibold tracking-tight text-[var(--text-1)]">{ui.title}</div>
        <div className="max-w-3xl text-sm leading-7 text-[var(--text-2)]">
          {ui.description}
        </div>
      </div>

      <ProjectModePicker value={workspaceMode} locale={locale} onChange={setWorkspaceMode} />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="theme-panel-muted rounded-[24px] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-3)]">{ui.modeSummary}</div>
          <div className="mt-3 text-2xl font-semibold text-[var(--text-1)]">{modeMeta.label}</div>
          <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">{modeMeta.description}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(modeMeta.displayPlatforms || modeMeta.platforms).map((platform) => (
              <span key={platform} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)]">
                {platform}
              </span>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {[
              workspaceMode === "SHORT_VIDEO" ? ui.flowShortVideo : null,
              workspaceMode === "COPYWRITING" ? ui.flowCopy : null,
              workspaceMode === "PROMOTION" ? ui.flowPromo : null,
            ]
              .filter(Boolean)
              .map((line) => (
                <div key={line} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
                  {line}
                </div>
              ))}
          </div>
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
              {ui.currentWritingMode}: <span className="font-medium text-[var(--text-1)]">{writingMeta.label}</span>
            </div>
          ) : null}
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
              {ui.currentStyle}: <span className="font-medium text-[var(--text-1)]">{styleMeta.label}</span>
            </div>
          ) : null}
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
              {ui.currentLength}: <span className="font-medium text-[var(--text-1)]">{copyLengthMeta.label}</span>
            </div>
          ) : null}
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
              {ui.currentScenario}: <span className="font-medium text-[var(--text-1)]">{usageScenarioMeta.label}</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.writingMode}</span>
              <div className="grid gap-3 md:grid-cols-2">
                {writingModeList.map((mode) => {
                  const meta = getWritingModeMeta(mode, locale);
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
            </div>
          ) : null}

          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.outputStyle}</span>
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
            </div>
          ) : null}

          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-2)]">{ui.copyLength}</span>
                <select value={copyLength} onChange={(event) => setCopyLength(event.target.value as CopyLength)} className="theme-input w-full rounded-2xl px-4 py-3 text-sm">
                  {copyLengthList.map((item) => (
                    <option key={item} value={item}>
                      {getCopyLengthMeta(item, locale).label}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-[var(--text-2)]">{copyLengthMeta.description}</div>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-2)]">{ui.usageScenario}</span>
                <select value={usageScenario} onChange={(event) => setUsageScenario(event.target.value as UsageScenario)} className="theme-input w-full rounded-2xl px-4 py-3 text-sm">
                  {usageScenarioList.map((item) => (
                    <option key={item} value={item}>
                      {getUsageScenarioMeta(item, locale).label}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-[var(--text-2)]">{usageScenarioMeta.description}</div>
              </label>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.projectName}</span>
              <input
                name="title"
                key={`${workspaceMode}-title`}
                defaultValue={modeMeta.titleDefault}
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.projectTopic}</span>
              <input
                name="topic"
                key={`${workspaceMode}-topic`}
                defaultValue={modeMeta.topicDefault}
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.projectIntro}</span>
              <textarea
                name="projectIntroduction"
                rows={4}
                placeholder={ui.projectIntroPlaceholder}
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.coreIdea}</span>
              <textarea
                name="coreIdea"
                rows={4}
                placeholder={ui.coreIdeaPlaceholder}
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-2)]">{sourceLabel}</span>
            <textarea
              name="sourceScript"
              rows={8}
              key={`${workspaceMode}-script`}
              defaultValue={modeMeta.sourceScriptDefault}
              className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
            />
          </label>

          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.styleReference}</span>
              <textarea
                name="styleReferenceSample"
                rows={6}
                placeholder={ui.styleReferencePlaceholder}
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
              <div className="text-sm text-[var(--text-2)]">{ui.styleReferenceHint}</div>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
            <span className="rounded-full border border-[var(--border)] px-3 py-1.5">{ui.defaultPlatforms}: {modeMeta.platforms.join(" / ")}</span>
            <span className={cn("rounded-full border px-3 py-1.5", workspaceMode === "SHORT_VIDEO" ? "theme-chip-ok" : "border-[var(--border)]")}>
              {ui.currentMode}: {modeMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? ui.creating : ui.createProject}
            </Button>
            {message ? <p className="text-sm text-[var(--text-2)]">{message}</p> : null}
          </div>
        </div>
      </div>
    </form>
  );
}
