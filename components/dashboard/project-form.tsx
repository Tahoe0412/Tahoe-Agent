"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorNotice } from "@/components/ui/error-notice";
import { ProjectIntentPicker } from "@/components/dashboard/project-intent-picker";
import {
  getContentLineMeta,
  getOutputTypeMeta,
  type ContentLine,
  type OutputType,
} from "@/lib/content-line";
import { apiRequest } from "@/lib/client-api";
import { suggestProjectTitles } from "@/lib/project-brief";
import { getEditorialDirectionPresets, type EditorialDirectionPresetId } from "@/lib/editorial-direction-presets";
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
  initialOwnedMediaPreset = null,
}: {
  locale?: Locale;
  variant?: ProjectFormVariant;
  onCreated?: (projectId: string) => void | Promise<void>;
  initialContentLine?: ContentLine;
  initialOutputType?: OutputType;
  initialTopic?: string;
  initialTitle?: string;
  initialOwnedMediaPreset?: EditorialDirectionPresetId | null;
}) {
  const router = useRouter();
  const ownedMediaPresets = useMemo(() => getEditorialDirectionPresets(locale), [locale]);
  const initialPreset = useMemo(
    () => ownedMediaPresets.find((preset) => preset.id === initialOwnedMediaPreset) ?? null,
    [ownedMediaPresets, initialOwnedMediaPreset],
  );
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
  const isOwnedMedia = intent.contentLine === "MARS_CITIZEN";
  const modeMeta = useMemo(() => getWorkspaceModeMeta(workspaceMode, locale), [locale, workspaceMode]);
  const contentLineMeta = useMemo(() => getContentLineMeta(intent.contentLine, locale), [intent.contentLine, locale]);
  const outputTypeMeta = useMemo(() => getOutputTypeMeta(intent.outputType, locale), [intent.outputType, locale]);
  const copyLengthMeta = useMemo(() => getCopyLengthMeta(copyLength, locale), [copyLength, locale]);
  const usageScenarioMeta = useMemo(() => getUsageScenarioMeta(usageScenario, locale), [locale, usageScenario]);
  const [titleInput, setTitleInput] = useState(initialTitle);
  const [titleIsManual, setTitleIsManual] = useState(!!initialTitle);
  const [titleSuggestionIndex, setTitleSuggestionIndex] = useState(0);
  const [topicInput, setTopicInput] = useState(initialTopic);
  const [projectIntroductionInput, setProjectIntroductionInput] = useState(initialPreset?.introduction ?? "");
  const [coreIdeaInput, setCoreIdeaInput] = useState(initialPreset?.coreIdea ?? "");
  const [sourceScriptInput, setSourceScriptInput] = useState("");
  const [styleReferenceInput, setStyleReferenceInput] = useState(initialPreset?.styleReferenceSample ?? "");
  const [selectedOwnedMediaPreset, setSelectedOwnedMediaPreset] = useState<EditorialDirectionPresetId | null>(initialPreset?.id ?? null);

  // Auto-generate title from topic unless user has typed their own
  const titleSuggestions = useMemo(
    () => suggestProjectTitles({ topicQuery: topicInput, workspaceMode }),
    [topicInput, workspaceMode],
  );
  useEffect(() => {
    setTitleSuggestionIndex(0);
  }, [topicInput, workspaceMode]);

  useEffect(() => {
    if (!titleIsManual && titleSuggestions.length > 0) {
      const idx = titleSuggestionIndex % titleSuggestions.length;
      setTitleInput(titleSuggestions[idx] ?? "");
      return;
    }

    if (!titleIsManual && !topicInput.trim()) {
      setTitleInput("");
    }
  }, [titleSuggestions, titleSuggestionIndex, titleIsManual, topicInput]);

  const cycleTitleSuggestion = useCallback(() => {
    setTitleIsManual(false);
    setTitleSuggestionIndex((i) => i + 1);
  }, []);
  const ui = locale === "en"
    ? {
        created: (id: string) => `Project ${id} created. You can continue with live connectors and model workflows next.`,
        requestFailed: "Request failed.",
        eyebrow: "Start a New Project",
        title: "Fill these first",
        description: "Direction, current topic, raw material.",
        flowShortVideo: "Topic research -> master draft -> image brief -> publish packaging",
        flowCopy: "Brief -> master copy -> channel adaptation -> compliance",
        flowPromo: "Brief -> campaign message -> compliance -> review",
        summaryTitle: "Current path",
        summaryNoteLabel: "What this path is for",
        presetTitle: "Editorial direction",
        presetDesc: "Pick a long-term direction first.",
        presetHint: "The preset fills the background and tone. You still need to name the current topic.",
        qualityTitle: "Three things that improve the first draft",
        qualityOwnedTopic: "Write one precise topic, not a broad category.",
        qualityOwnedSource: "Paste source facts, notes, or judgments instead of empty slogans.",
        qualityOwnedStyle: "When tone matters, paste 1-3 strong Chinese media-style samples instead of generic slogans.",
        qualityMarketingTopic: "Name the product, audience, and real commercial goal.",
        qualityMarketingSource: "Paste raw product notes, selling points, or campaign constraints.",
        qualityMarketingStyle: "Use 1-3 strong platform-native samples when you need a tighter voice.",
        writingMode: "Writing Mode",
        outputStyle: "Output Style",
        copyLength: "Copy Length",
        usageScenario: "Use Case",
        projectName: "Project Name (Optional)",
        projectNamePlaceholder: "Leave blank to use the topic as the project name",
        projectTopic: "Topic",
        projectTopicPlaceholder: modeMeta.topicDefault,
        currentTopicLabel: "Current topic",
        currentTopicPlaceholder: "For example: Should product teams rebuild workflows around AI agents now?",
        currentTopicHint: "The direction is your column. This field is the specific topic for this round.",
        projectIntro: "Project Overview",
        projectIntroPlaceholder: "Write the operating context: who this is for, why this topic matters now, and what kind of deliverable should come out.",
        coreIdea: "Core Message",
        coreIdeaPlaceholder: "Write the one judgment, takeaway, or persuasion point this round really needs to land.",
        sourceLabelScience: "Optional Source Material / Fact Base",
        sourceLabelCopy: "Optional Copy Brief / Core Message",
        sourceLabelAd: "Optional Ad Context / Selling Angle",
        sourcePlaceholderScience: "Paste notes, facts, links, talking points, or your rough angle here. Leave it blank only if you truly want to start from the topic alone.",
        sourcePlaceholderCopy: "Paste any draft, product notes, or core message here. You can also leave it blank and start from the brief + topic.",
        sourcePlaceholderAd: "Paste a rough ad angle, campaign note, or key selling point here. It is optional.",
        sourceHint: "Optional, but strong raw material usually matters more than filling every advanced field.",
        styleReference: "Style Reference / Sample Copy",
        styleReferencePlaceholder: "Paste one to three strong examples only if you want Tahoe to learn a more specific voice, rhythm, or structure.",
        styleReferenceHint: "Use complete samples, not scattered adjectives. Samples shape tone better than keyword lists.",
        writingContextTitle: "Writing context",
        creating: "Creating...",
        createProject: "Create Project",
      }
    : {
        created: (id: string) => `已创建项目 ${id}，可继续接入真实平台采集与模型编排。`,
        requestFailed: "请求失败",
        eyebrow: "开始新项目",
        title: "先填这几项",
        description: "方向、本期题目、素材底稿。",
        flowShortVideo: "选题研究 -> 主稿生成 -> 配图说明 -> 发布包装",
        flowCopy: "任务单 -> 改写 -> 平台适配 -> 合规",
        flowPromo: "任务单 -> 推广表达 -> 合规 -> 复盘优化",
        summaryTitle: "当前路径",
        summaryNoteLabel: "这条路径适合做什么",
        presetTitle: "方向 preset",
        presetDesc: "先选栏目方向，再写本期题目。",
        presetHint: "preset 只会帮你补背景和语气，不会替你决定本期题目。",
        qualityTitle: "最影响首稿质量的 3 件事",
        qualityOwnedTopic: "主题要写成一个明确判断，不要只写大类词。",
        qualityOwnedSource: "尽量贴事实、材料、观察和判断，不要只贴口号。",
        qualityOwnedStyle: "真的在意文风时，优先贴 1-3 段高质量中文媒体样稿，不要贴空口号。",
        qualityMarketingTopic: "把产品、受众和商业目标直接写清楚。",
        qualityMarketingSource: "尽量贴产品资料、卖点、限制条件和 campaign 重点。",
        qualityMarketingStyle: "需要强平台感时，补 1-3 段平台原生好稿，不要贴泛化软文。",
        writingMode: "写作模式",
        outputStyle: "输出风格",
        copyLength: "文案长度",
        usageScenario: "使用场景",
        projectName: "项目名称（可选）",
        projectNamePlaceholder: "可以留空，系统会默认用主题来命名项目",
        projectTopic: "选题主题",
        projectTopicPlaceholder: modeMeta.topicDefault,
        currentTopicLabel: "本期题目",
        currentTopicPlaceholder: "例如：OpenAI 最新 Agent 发布后，产品团队现在该不该重做工作流？",
        currentTopicHint: "方向是长期定位；这里写的是这一篇真正要讨论的具体问题。",
        projectIntro: "项目介绍",
        projectIntroPlaceholder: "把背景交代清楚：这轮为什么做、给谁看、最后要形成什么交付。",
        coreIdea: "核心想法",
        coreIdeaPlaceholder: "一句话写清这轮最想让读者记住的判断、结论或劝服点。",
        sourceLabelScience: "可选背景材料 / 事实底稿",
        sourceLabelCopy: "可选文案需求 / 主表达",
        sourceLabelAd: "可选广告背景 / 核心卖点",
        sourcePlaceholderScience: "可以粘贴事实、笔记、观察、链接摘要或你已经整理出的判断。只有在你想完全从主题起步时才建议留空。",
        sourcePlaceholderCopy: "可以粘贴现有文案、产品说明或一句核心表达；如果还没整理好，也可以留空先建项目。",
        sourcePlaceholderAd: "可以粘贴广告方向、Campaign 备注或一句核心卖点；没有也可以留空。",
        sourceHint: "这是可选输入，但通常也是最影响首稿质量的输入之一。",
        styleReference: "风格参照 / 参考样稿",
        styleReferencePlaceholder: "只有当你想控制语气、节奏、段落结构时再贴。建议放 1-3 段完整样稿，而不是几个形容词。",
        styleReferenceHint: "完整样稿比关键词更能稳定控制文风，系统会学习结构和气质，不直接照抄。",
        writingContextTitle: "写作背景",
        creating: "创建中...",
        createProject: "创建项目",
      };
  const sourceLabel =
    isOwnedMedia
      ? ui.sourceLabelScience
      : intent.outputType === "PLATFORM_COPY"
        ? ui.sourceLabelCopy
        : ui.sourceLabelAd;
  const sourcePlaceholder =
    isOwnedMedia
      ? ui.sourcePlaceholderScience
      : intent.outputType === "PLATFORM_COPY"
        ? ui.sourcePlaceholderCopy
        : ui.sourcePlaceholderAd;
  const advancedTitle = locale === "en" ? "Advanced options" : "高级选项";
  const advancedHint =
    isOwnedMedia
      ? locale === "en"
        ? "Use this only when you want to lock the writing voice with reference samples."
        : "这里只放文风样稿等更细控制项，首稿所需的背景信息已经放到上面了。"
      : locale === "en"
        ? "Only open this if you want to shape tone, brief context, or marketing constraints more precisely."
        : "只有在你需要精细控制语气、补充任务背景，或设置营销参数时，再展开这里。";
  const flowLine =
    isOwnedMedia
      ? intent.outputType === "STORYBOARD_SCRIPT"
        ? locale === "en"
          ? "Topic -> image brief -> image preparation"
          : "主题 -> 配图说明 -> 图片生产"
        : ui.flowShortVideo
      : workspaceMode === "COPYWRITING"
        ? ui.flowCopy
        : ui.flowPromo;
  const qualityChecklist =
    isOwnedMedia
      ? [ui.qualityOwnedTopic, ui.qualityOwnedSource, ui.qualityOwnedStyle]
      : [ui.qualityMarketingTopic, ui.qualityMarketingSource, ui.qualityMarketingStyle];
  const topicLabel = isOwnedMedia ? ui.currentTopicLabel : ui.projectTopic;
  const topicPlaceholder = isOwnedMedia ? ui.currentTopicPlaceholder : ui.projectTopicPlaceholder;
  const topicHint = isOwnedMedia ? ui.currentTopicHint : null;

  function applyOwnedMediaPreset(preset: (typeof ownedMediaPresets)[number]) {
    setSelectedOwnedMediaPreset(preset.id);
    setProjectIntroductionInput(preset.introduction);
    setCoreIdeaInput(preset.coreIdea);
    setStyleReferenceInput(preset.styleReferenceSample);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setSubmitError(null);

    const payload = {
      title: deriveProjectTitle({
        title: titleInput,
        topic: topicInput,
      }),
      topic: topicInput,
      sourceScript: sourceScriptInput,
      projectIntroduction: projectIntroductionInput,
      coreIdea: coreIdeaInput,
      styleReferenceSample: styleReferenceInput,
      contentLine: intent.contentLine,
      outputType: intent.outputType,
      writingMode,
      styleTemplate,
      copyLength,
      usageScenario,
      platforms: modeMeta.platforms.slice(0, 3),
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
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
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

      {isOwnedMedia ? (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] px-5 py-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">{ui.presetTitle}</div>
          <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.presetDesc}</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {ownedMediaPresets.map((preset) => {
              const active = selectedOwnedMediaPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyOwnedMediaPreset(preset)}
                  className={cn(
                    "rounded-2xl border px-4 py-4 text-left transition",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
                      : "border-[var(--border-soft)] bg-[var(--surface-muted)] hover:border-[var(--border)] hover:bg-[var(--surface-solid)]",
                  )}
                >
                  <div className="text-sm font-semibold text-[var(--text-1)]">{preset.label}</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{preset.focus}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-sm text-[var(--text-2)]">{ui.presetHint}</div>
        </div>
      ) : null}

      <div
        className={cn(
          "border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4",
          isCompact ? "rounded-xl" : "rounded-[24px]",
        )}
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">{ui.summaryTitle}</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium", intent.contentLine === "MARS_CITIZEN" ? "theme-chip-ok" : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)]")}>
            <contentLineMeta.icon className="mr-1.5 h-3.5 w-3.5" />
            {contentLineMeta.label}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)]">
            {outputTypeMeta.label}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)]">
            {modeMeta.label}
          </span>
        </div>
        <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">{contentLineMeta.description}</div>
        <div className="mt-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-solid)] px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-3)]">{ui.summaryNoteLabel}</div>
          <div className="mt-2 text-sm leading-7 text-[var(--text-1)]">{flowLine}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
          {(modeMeta.displayPlatforms || modeMeta.platforms).map((platform) => (
            <span key={platform} className="rounded-full border border-[var(--border)] px-3 py-1.5">
              {platform}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] px-5 py-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">{ui.qualityTitle}</div>
        <div className="mt-4 space-y-2">
          {qualityChecklist.map((item, index) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                {index + 1}
              </div>
              <div className="text-sm leading-7 text-[var(--text-1)]">{item}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-[var(--text-2)]">{ui.projectName}</span>
            <div className="flex items-center gap-2">
              {!titleIsManual && topicInput.trim() ? (
                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-strong)]">
                  {locale === "en" ? "Auto-generated" : "自动命名"}
                </span>
              ) : null}
              {titleIsManual ? (
                <button
                  type="button"
                  onClick={cycleTitleSuggestion}
                  className="text-xs text-[var(--accent-strong)] hover:underline"
                >
                  {locale === "en" ? "Reset to auto" : "恢复自动"}
                </button>
              ) : topicInput.trim() ? (
                <button
                  type="button"
                  onClick={cycleTitleSuggestion}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--text-2)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                  title={locale === "en" ? "Try another title" : "换一个"}
                >
                  <RefreshCw className="size-3" />
                  {locale === "en" ? "Another" : "换一个"}
                </button>
              ) : null}
            </div>
          </div>
          <input
            name="title"
            value={titleInput}
            onChange={(event) => {
              setTitleInput(event.target.value);
              setTitleIsManual(true);
            }}
            placeholder={ui.projectNamePlaceholder}
            className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
        </div>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--text-2)]">{topicLabel}</span>
          <input
            name="topic"
            value={topicInput}
            onChange={(event) => setTopicInput(event.target.value)}
            placeholder={topicPlaceholder}
            className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
          {topicHint ? <div className="text-sm text-[var(--text-2)]">{topicHint}</div> : null}
        </label>
      </div>

      {isOwnedMedia ? (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] px-5 py-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">{ui.writingContextTitle}</div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.projectIntro}</span>
              <textarea
                name="projectIntroduction"
                rows={4}
                value={projectIntroductionInput}
                onChange={(event) => setProjectIntroductionInput(event.target.value)}
                placeholder={ui.projectIntroPlaceholder}
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.coreIdea}</span>
              <textarea
                name="coreIdea"
                rows={4}
                value={coreIdeaInput}
                onChange={(event) => setCoreIdeaInput(event.target.value)}
                placeholder={ui.coreIdeaPlaceholder}
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
            </label>
          </div>
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--text-2)]">{sourceLabel}</span>
        <textarea
          name="sourceScript"
          rows={isCompact ? 4 : 6}
          value={sourceScriptInput}
          onChange={(event) => setSourceScriptInput(event.target.value)}
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
        defaultOpen={isMarketing}
        className={cn(
          "border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-4",
          isCompact ? "rounded-xl" : "rounded-[24px]",
        )}
        summaryClassName="text-sm"
        contentClassName="mt-4 space-y-5 border-t border-[var(--border-soft)] pt-4"
      >
        <div className="text-sm leading-7 text-[var(--text-2)]">{advancedHint}</div>

        {!isOwnedMedia ? (
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.projectIntro}</span>
              <textarea
                name="projectIntroduction"
                rows={4}
                value={projectIntroductionInput}
                onChange={(event) => setProjectIntroductionInput(event.target.value)}
                placeholder={ui.projectIntroPlaceholder}
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">{ui.coreIdea}</span>
              <textarea
                name="coreIdea"
                rows={4}
                value={coreIdeaInput}
                onChange={(event) => setCoreIdeaInput(event.target.value)}
                placeholder={ui.coreIdeaPlaceholder}
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
            </label>
          </div>
        ) : null}

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

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--text-2)]">{ui.styleReference}</span>
          <textarea
            name="styleReferenceSample"
            rows={6}
            value={styleReferenceInput}
            onChange={(event) => setStyleReferenceInput(event.target.value)}
            placeholder={ui.styleReferencePlaceholder}
            className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
          />
          <div className="text-sm text-[var(--text-2)]">{ui.styleReferenceHint}</div>
        </label>
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
