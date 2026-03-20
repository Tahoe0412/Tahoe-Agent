"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorNotice } from "@/components/ui/error-notice";
import { ProjectIntentPicker } from "@/components/dashboard/project-intent-picker";
import { apiRequest } from "@/lib/client-api";
import {
  getContentLineMeta,
  getOutputTypeMeta,
  type ContentLine,
  type OutputType,
} from "@/lib/content-line";
import {
  deriveProjectTitle,
  getDefaultOutputTypeForContentLine,
  resolveProjectIntent,
} from "@/lib/project-intent";
import { copyLengthList, getCopyLengthMeta, getUsageScenarioMeta, type CopyLength, type UsageScenario, usageScenarioList } from "@/lib/copy-goal";
import type { Locale } from "@/lib/locale-copy";
import { getStyleTemplateMeta, type StyleTemplate, styleTemplateList } from "@/lib/style-template";
import { getWritingModeMeta, type WritingMode, writingModeList } from "@/lib/writing-mode";
import { getWorkspaceModeMeta } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";

type ProjectFormVariant = "dashboard" | "compact";

export function ProjectForm({
  locale = "zh",
  variant = "dashboard",
  onCreated,
  initialContentLine = "MARS_CITIZEN",
  initialOutputType = "NARRATIVE_SCRIPT",
  initialTopic = "",
  initialTitle = "",
}: {
  locale?: Locale;
  variant?: ProjectFormVariant;
  onCreated?: (projectId: string) => void | Promise<void>;
  initialContentLine?: ContentLine;
  initialOutputType?: OutputType;
  initialTopic?: string;
  initialTitle?: string;
}) {
  const router = useRouter();
  const [contentLine, setContentLine] = useState<ContentLine>(initialContentLine);
  const [outputType, setOutputType] = useState<OutputType>(initialOutputType);
  const [writingMode, setWritingMode] = useState<WritingMode>("PRODUCT_PROMO");
  const [styleTemplate, setStyleTemplate] = useState<StyleTemplate>("RATIONAL_PRO");
  const [copyLength, setCopyLength] = useState<CopyLength>("STANDARD");
  const [usageScenario, setUsageScenario] = useState<UsageScenario>("XIAOHONGSHU_POST");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const isCompact = variant === "compact";
  const intent = useMemo(() => resolveProjectIntent({ contentLine, outputType }), [contentLine, outputType]);
  const workspaceMode = intent.workspaceMode;
  const isMarketing = intent.contentLine === "MARKETING";
  const modeMeta = useMemo(() => getWorkspaceModeMeta(workspaceMode, locale), [locale, workspaceMode]);
  const contentLineMeta = useMemo(() => getContentLineMeta(intent.contentLine, locale), [intent.contentLine, locale]);
  const outputTypeMeta = useMemo(() => getOutputTypeMeta(intent.outputType, locale), [intent.outputType, locale]);
  const copyLengthMeta = useMemo(() => getCopyLengthMeta(copyLength, locale), [copyLength, locale]);
  const usageScenarioMeta = useMemo(() => getUsageScenarioMeta(usageScenario, locale), [locale, usageScenario]);
  const ui = locale === "en"
    ? {
        created: (id: string) => `Project ${id} created. You can continue with live connectors and model workflows next.`,
        requestFailed: "Request failed.",
        eyebrow: "Start a New Project",
        title: "Start from the business line and target output",
        description: "Choose what you are trying to produce first. The system derives the recommended workspace, default platforms, and next-step flow from that intent.",
        flowShortVideo: "Trend review -> script rewrite -> storyboard and assets",
        flowCopy: "Brief -> master copy -> channel adaptation -> compliance",
        flowPromo: "Brief -> campaign message -> compliance -> review",
        writingMode: "Writing Mode",
        outputStyle: "Output Style",
        copyLength: "Copy Length",
        usageScenario: "Use Case",
        projectName: "Project Name (Optional)",
        projectNamePlaceholder: "Leave blank to use the topic as the project name",
        projectTopic: "Topic",
        projectTopicPlaceholder: modeMeta.topicDefault,
        projectIntro: "Project Overview",
        projectIntroPlaceholder: "Who is this project for, what does it solve, and what stage is it at right now?",
        coreIdea: "Core Message",
        coreIdeaPlaceholder: "Write the one thought this round really needs to land.",
        sourceLabelScience: "Optional Script / Narration Seed",
        sourceLabelCopy: "Optional Copy Brief / Core Message",
        sourceLabelAd: "Optional Ad Context / Selling Angle",
        sourcePlaceholderScience: "Leave this blank if you only have a topic for now. You can create the project shell first and generate script or storyboard later.",
        sourcePlaceholderCopy: "Paste any draft, product notes, or core message here. You can also leave it blank and start from the brief + topic.",
        sourcePlaceholderAd: "Paste a rough ad angle, campaign note, or key selling point here. It is optional.",
        sourceHint: "Optional. If you leave this blank, Tahoe creates the project shell first and you can continue with generation later.",
        styleReference: "Style Reference / Sample Copy",
        styleReferencePlaceholder: "Paste one to three strong examples. The model learns tone, pacing, sentence length, and structure without copying the text.",
        styleReferenceHint: "Complete sample drafts give you much steadier style control than a few keywords.",
        creating: "Creating...",
        createProject: "Create Project",
      }
    : {
        created: (id: string) => `已创建项目 ${id}，可继续接入真实平台采集与模型编排。`,
        requestFailed: "请求失败",
        eyebrow: "开始新项目",
        title: "先确定业务主线和目标产物",
        description: "先说明你是做火星公民科普，还是做商业 marketing，再说明这一轮想产出什么。系统会据此自动推导工作台、默认平台和推荐流程。",
        flowShortVideo: "趋势研究 -> 脚本重构 -> 分镜与素材",
        flowCopy: "任务单 -> 改写 -> 平台适配 -> 合规",
        flowPromo: "任务单 -> 推广表达 -> 合规 -> 复盘优化",
        writingMode: "写作模式",
        outputStyle: "输出风格",
        copyLength: "文案长度",
        usageScenario: "使用场景",
        projectName: "项目名称（可选）",
        projectNamePlaceholder: "可以留空，系统会默认用主题来命名项目",
        projectTopic: "选题主题",
        projectTopicPlaceholder: modeMeta.topicDefault,
        projectIntro: "项目介绍",
        projectIntroPlaceholder: "这个项目是做什么的、面向谁、当前阶段是什么。",
        coreIdea: "核心想法",
        coreIdeaPlaceholder: "一句话写清这轮真正想打动用户的核心表达。",
        sourceLabelScience: "可选背景脚本 / 口播想法",
        sourceLabelCopy: "可选文案需求 / 主表达",
        sourceLabelAd: "可选广告背景 / 核心卖点",
        sourcePlaceholderScience: "如果你现在只有主题，没有完整脚本，也可以先留空。先创建项目壳，后续再生成脚本或分镜。",
        sourcePlaceholderCopy: "可以粘贴现有文案、产品说明或一句核心表达；如果还没整理好，也可以留空先建项目。",
        sourcePlaceholderAd: "可以粘贴广告方向、Campaign 备注或一句核心卖点；没有也可以留空。",
        sourceHint: "这是可选输入。留空时系统会先创建项目壳，后续再继续生成。",
        styleReference: "风格参照 / 参考样稿",
        styleReferencePlaceholder: "可粘贴 1-3 段你喜欢的文案。模型会学习语气、节奏、句长和结构，不会直接照抄内容。",
        styleReferenceHint: "建议贴多段完整样稿，比只写几个关键词更能稳定控制文风。",
        creating: "创建中...",
        createProject: "创建项目",
      };
  const sourceLabel =
    intent.contentLine === "MARS_CITIZEN"
      ? ui.sourceLabelScience
      : intent.outputType === "PLATFORM_COPY"
        ? ui.sourceLabelCopy
        : ui.sourceLabelAd;
  const sourcePlaceholder =
    intent.contentLine === "MARS_CITIZEN"
      ? ui.sourcePlaceholderScience
      : intent.outputType === "PLATFORM_COPY"
        ? ui.sourcePlaceholderCopy
        : ui.sourcePlaceholderAd;
  const advancedTitle = locale === "en" ? "Advanced options" : "高级选项";
  const advancedHint =
    locale === "en"
      ? "Only open this if you want to shape tone, brief context, or marketing constraints more precisely."
      : "只有在你需要精细控制语气、补充任务背景，或设置营销参数时，再展开这里。";
  const flowLine =
    intent.contentLine === "MARS_CITIZEN"
      ? intent.outputType === "STORYBOARD_SCRIPT"
        ? locale === "en"
          ? "Topic -> storyboard -> render"
          : "主题 -> 分镜 -> 生成"
        : ui.flowShortVideo
      : workspaceMode === "COPYWRITING"
        ? ui.flowCopy
        : ui.flowPromo;

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setMessage(null);
    setSubmitError(null);

    const payload = {
      title: deriveProjectTitle({
        title: String(formData.get("title") || ""),
        topic: String(formData.get("topic") || ""),
      }),
      topic: String(formData.get("topic") || ""),
      sourceScript: String(formData.get("sourceScript") || ""),
      projectIntroduction: String(formData.get("projectIntroduction") || ""),
      coreIdea: String(formData.get("coreIdea") || ""),
      styleReferenceSample: String(formData.get("styleReferenceSample") || ""),
      contentLine: intent.contentLine,
      outputType: intent.outputType,
      writingMode,
      styleTemplate,
      copyLength,
      usageScenario,
      platforms: modeMeta.platforms,
      workspaceMode,
    };

    try {
      const result = await apiRequest<{ project: { id: string } }>("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      setMessage(ui.created(result.project.id));
      await onCreated?.(result.project.id);
      router.push(`/?projectId=${result.project.id}`);
      router.refresh();
    } catch (error) {
      setSubmitError(error);
      setMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className={cn(
        "space-y-6",
        isCompact ? "space-y-5" : "theme-panel rounded-[28px] p-6",
      )}
    >
      {!isCompact ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-3)]">{ui.eyebrow}</div>
          <div className="text-2xl font-semibold tracking-tight text-[var(--text-1)]">{ui.title}</div>
          <div className="max-w-3xl text-sm leading-7 text-[var(--text-2)]">
            {ui.description}
          </div>
        </div>
      ) : null}

      <ProjectIntentPicker
        contentLine={intent.contentLine}
        outputType={intent.outputType}
        locale={locale}
        onContentLineChange={(next) => {
          setContentLine(next);
          setOutputType(getDefaultOutputTypeForContentLine(next));
        }}
        onOutputTypeChange={setOutputType}
      />

      <div
        className={cn(
          "border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4",
          isCompact ? "rounded-xl" : "rounded-[24px]",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", intent.contentLine === "MARS_CITIZEN" ? "theme-chip-ok" : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)]")}>
            {contentLineMeta.icon} {contentLineMeta.label}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)]">
            {outputTypeMeta.label}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)]">
            {modeMeta.label}
          </span>
        </div>
        <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">{flowLine}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
          {(modeMeta.displayPlatforms || modeMeta.platforms).map((platform) => (
            <span key={platform} className="rounded-full border border-[var(--border)] px-3 py-1.5">
              {platform}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--text-2)]">{ui.projectName}</span>
          <input
            name="title"
            key={`${workspaceMode}-title`}
            defaultValue={initialTitle}
            placeholder={ui.projectNamePlaceholder}
            className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--text-2)]">{ui.projectTopic}</span>
          <input
            name="topic"
            key={`${workspaceMode}-topic`}
            defaultValue={initialTopic}
            placeholder={ui.projectTopicPlaceholder}
            className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--text-2)]">{sourceLabel}</span>
        <textarea
          name="sourceScript"
          rows={isCompact ? 4 : 6}
          key={`${outputType}-script`}
          placeholder={sourcePlaceholder}
          className={cn(
            "theme-input w-full px-4 py-3 text-sm leading-7",
            isCompact ? "rounded-xl" : "rounded-3xl",
          )}
        />
        <div className="text-sm text-[var(--text-2)]">{ui.sourceHint}</div>
      </label>

      <Disclosure
        title={<span className="text-sm font-medium text-[var(--text-1)]">{advancedTitle}</span>}
        className={cn(
          "border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-4",
          isCompact ? "rounded-xl" : "rounded-[24px]",
        )}
        summaryClassName="text-sm"
        contentClassName="mt-4 space-y-5 border-t border-[var(--border-soft)] pt-4"
      >
        <div className="text-sm leading-7 text-[var(--text-2)]">{advancedHint}</div>

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

        {isMarketing ? (
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

        {isMarketing ? (
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

        {isMarketing ? (
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

        {isMarketing ? (
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
      </Disclosure>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? ui.creating : ui.createProject}
        </Button>
        {message ? <p className="text-sm text-[var(--text-2)]">{message}</p> : null}
      </div>
      {submitError ? <ErrorNotice error={submitError} locale={locale} /> : null}
    </form>
  );
}
