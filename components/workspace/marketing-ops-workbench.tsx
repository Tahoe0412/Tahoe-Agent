"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { GenerateStoryboardButton } from "@/components/workspace/generate-storyboard-button";
import { NextStepLink } from "@/components/workspace/next-step-link";
import { assessAdCreative, assessMarketingMasterCopy } from "@/lib/artifact-quality";
import { getOutputKnowledgePack, type ArtifactReview } from "@/lib/output-artifact-guidance";
import { apiRequest } from "@/lib/client-api";
import { copyLengthList, getCopyLengthMeta, getUsageScenarioMeta, type CopyLength, type UsageScenario, usageScenarioList } from "@/lib/copy-goal";
import type { Locale } from "@/lib/locale-copy";
import { getAdaptationStatusLabel, getPlatformSurfaceMeta, platformSurfaceList, type PlatformSurface } from "@/lib/platform-surface";
import type { StyleReferenceInsight } from "@/lib/style-reference";
import { getStyleTemplateMeta, type StyleTemplate, styleTemplateList } from "@/lib/style-template";
import { getWritingModeMeta, type WritingMode, writingModeList } from "@/lib/writing-mode";

type PromotionalCopyPayload = {
  generation_source?: string;
  quality_diagnosis?: {
    overall_score?: number;
    strengths?: unknown[];
    issues?: unknown[];
    rewrite_focus?: unknown[];
    summary?: string;
  };
  master_angle?: string;
  headline_options?: string[];
  hero_copy?: string;
  long_form_copy?: string;
  proof_points?: string[];
  call_to_action?: string;
  risk_notes?: string[];
  recommended_next_steps?: string[];
};

type AdCreativePayload = {
  target_audience?: string;
  lead_angle?: string;
  core_hook?: string;
  selling_points?: unknown;
  visual_direction?: string;
  shot_tone?: string;
  cta_direction?: string;
};

type MarketingOverview = {
  brandProfile: {
    id: string;
    brandName: string;
    brandStage: string;
    brandVoice: string | null;
    pillarCount: number;
    forbiddenPhraseCount: number;
    platformPriority: string[];
  } | null;
  industryTemplate: {
    id: string;
    industryName: string;
    competitorCount: number;
    recommendedDirections: string[];
    forbiddenTermCount: number;
  } | null;
  latestSprint: {
    id: string;
    name: string;
    status: string;
    goal: string | null;
  } | null;
  strategyTasks: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    priority: number;
    owner: string | null;
    summary: string | null;
    taskJson: unknown;
    createdAt: string | Date;
  }>;
  latestPromotionalCopy: {
    id: string;
    title: string;
    summary: string | null;
    taskJson: unknown;
    createdAt: string | Date;
  } | null;
  promotionalCopyVersions: Array<{
    id: string;
    title: string;
    summary: string | null;
    createdAt: string | Date;
    taskJson: unknown;
  }>;
  latestAdCreative: {
    id: string;
    title: string;
    summary: string | null;
    createdAt: string | Date;
    taskJson: unknown;
  } | null;
  adCreativeVersions: Array<{
    id: string;
    title: string;
    summary: string | null;
    createdAt: string | Date;
    taskJson: unknown;
  }>;
  storyboardSummary: {
    latestStoryboardId: string | null;
    versionNumber: number | null;
    frameCount: number;
    readyFrameCount: number;
    sceneCount: number;
  };
  platformAdaptations: Array<{
    id: string;
    surface: string;
    status: string;
    title: string | null;
    hook: string | null;
    body: string;
    createdAt: string | Date;
    structuredOutput: unknown;
  }>;
  complianceChecks: Array<{
    id: string;
    status: string;
    targetType: string;
    targetId: string;
    needsReview: boolean;
    issueCount: number;
    summary: string | null;
    flaggedIssues: unknown;
    sensitiveHits: unknown;
    createdAt: string | Date;
  }>;
  optimizationReviews: Array<{
    id: string;
    title: string;
    theme: string;
    platform: string;
    summary: string | null;
    nextCount: number;
  }>;
};

function toLines(value: string[] | undefined) {
  return (value ?? []).join("\n");
}

/** Safely render any value as a display string — handles objects from older schema versions. */
function toDisplayString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => toDisplayString(item)).filter(Boolean).join("；");
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.map(([k, v]) => `${k}：${toDisplayString(v)}`).filter(Boolean).join("；");
  }
  return String(value ?? "");
}

function fromLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|[;；]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRichText(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.replace(/\\n/g, "\n").trim();
}

function normalizeArtifactReview(value: unknown): ArtifactReview | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  return {
    status: source.status === "READY" ? "READY" : "NEEDS_REVISION",
    summary: typeof source.summary === "string" ? source.summary.trim() : "",
    strengths: normalizeStringList(source.strengths),
    issues: normalizeStringList(source.issues),
    nextSteps: normalizeStringList(source.nextSteps),
  };
}

function parsePayload(value: unknown): PromotionalCopyPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const diagnosisSource =
    source.quality_diagnosis && typeof source.quality_diagnosis === "object"
      ? (source.quality_diagnosis as Record<string, unknown>)
      : null;
  return {
    generation_source: typeof source.generation_source === "string" ? source.generation_source : undefined,
    quality_diagnosis: diagnosisSource
      ? {
          overall_score: typeof diagnosisSource.overall_score === "number" ? diagnosisSource.overall_score : undefined,
          strengths: Array.isArray(diagnosisSource.strengths) ? diagnosisSource.strengths.map((item) => toDisplayString(item)).filter(Boolean) : [],
          issues: Array.isArray(diagnosisSource.issues) ? diagnosisSource.issues.map((item) => toDisplayString(item)).filter(Boolean) : [],
          rewrite_focus: Array.isArray(diagnosisSource.rewrite_focus) ? diagnosisSource.rewrite_focus.map((item) => toDisplayString(item)).filter(Boolean) : [],
          summary: typeof diagnosisSource.summary === "string" ? diagnosisSource.summary : toDisplayString(diagnosisSource.summary),
        }
      : undefined,
    master_angle: typeof source.master_angle === "string" ? source.master_angle : undefined,
    headline_options: normalizeStringList(source.headline_options),
    hero_copy: normalizeRichText(source.hero_copy),
    long_form_copy: normalizeRichText(source.long_form_copy),
    proof_points: normalizeStringList(source.proof_points),
    call_to_action: typeof source.call_to_action === "string" ? source.call_to_action : undefined,
    risk_notes: normalizeStringList(source.risk_notes),
    recommended_next_steps: normalizeStringList(source.recommended_next_steps),
  };
}

function parseAdCreativePayload(value: unknown): AdCreativePayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  return {
    target_audience: typeof source.target_audience === "string" ? source.target_audience : undefined,
    lead_angle: typeof source.lead_angle === "string" ? source.lead_angle : undefined,
    core_hook: typeof source.core_hook === "string" ? source.core_hook : undefined,
    selling_points: source.selling_points,
    visual_direction: typeof source.visual_direction === "string" ? source.visual_direction : undefined,
    shot_tone: typeof source.shot_tone === "string" ? source.shot_tone : undefined,
    cta_direction: typeof source.cta_direction === "string" ? source.cta_direction : undefined,
  };
}

async function copyToClipboard(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    throw new Error("当前环境不支持剪贴板复制。");
  }

  await navigator.clipboard.writeText(text);
}

export function MarketingOpsWorkbench({
  projectId,
  marketingOverview,
  projectConfig,
  locale = "zh",
}: {
  projectId: string;
  marketingOverview: MarketingOverview;
  projectConfig: {
    writingMode: WritingMode;
    styleTemplate: StyleTemplate;
    copyLength: CopyLength;
    usageScenario: UsageScenario;
    styleReferenceSample?: string;
    styleReferenceInsight?: StyleReferenceInsight | null;
  };
  locale?: Locale;
}) {
  const router = useRouter();
  const [adaptSurface, setAdaptSurface] = useState<PlatformSurface>("XIAOHONGSHU_POST");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(marketingOverview.latestPromotionalCopy?.id ?? null);
  const [selectedAdaptationId, setSelectedAdaptationId] = useState<string | null>(marketingOverview.platformAdaptations[0]?.id ?? null);
  const [writingMode, setWritingMode] = useState<WritingMode>(projectConfig.writingMode);
  const [styleTemplate, setStyleTemplate] = useState<StyleTemplate>(projectConfig.styleTemplate);
  const [copyLength, setCopyLength] = useState<CopyLength>(projectConfig.copyLength);
  const [usageScenario, setUsageScenario] = useState<UsageScenario>(projectConfig.usageScenario);
  const [draftTitle, setDraftTitle] = useState("");
  const [masterAngle, setMasterAngle] = useState("");
  const [headlineOptions, setHeadlineOptions] = useState("");
  const [heroCopy, setHeroCopy] = useState("");
  const [longFormCopy, setLongFormCopy] = useState("");
  const [proofPoints, setProofPoints] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [riskNotes, setRiskNotes] = useState("");
  const [recommendedNextSteps, setRecommendedNextSteps] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);
  const [creativeAudience, setCreativeAudience] = useState("");
  const [creativeAngle, setCreativeAngle] = useState("");
  const [creativeHook, setCreativeHook] = useState("");
  const [creativeSellingPoints, setCreativeSellingPoints] = useState("");
  const [creativeVisualDirection, setCreativeVisualDirection] = useState("");
  const [creativeShotTone, setCreativeShotTone] = useState("");
  const [creativeCtaDirection, setCreativeCtaDirection] = useState("");
  const [creativePending, setCreativePending] = useState(false);

  const activeBrandId = marketingOverview.brandProfile?.id;
  const activeSprintId = marketingOverview.latestSprint?.id;
  const writingMeta = getWritingModeMeta(writingMode, locale);
  const styleMeta = getStyleTemplateMeta(styleTemplate, locale);
  const copyLengthMeta = getCopyLengthMeta(copyLength, locale);
  const usageScenarioMeta = getUsageScenarioMeta(usageScenario, locale);
  const timeLocale = locale === "en" ? "en-US" : "zh-CN";
  const ui = locale === "en"
    ? {
        nonJson: "The server returned a non-JSON response.",
        timeout: "The AI request took too long and was interrupted. Try shortening the input or switching to a faster model.",
        updateWritingMode: (label: string) => `Writing mode switched to "${label}".`,
        updateStyle: (label: string) => `Style switched to "${label}".`,
        updateLength: (label: string) => `Copy length switched to "${label}".`,
        updateScenario: (label: string) => `Use case switched to "${label}".`,
        generatedMaster: "A new master draft has been generated.",
        needDraftBeforeEnhance: "Generate or draft a master copy first, then run diagnosis and enhancement.",
        enhanced: "Diagnosis complete. A stronger new version has been created.",
        savedVersion: "The current draft has been saved as a new version.",
        needMasterForAdaptation: "Create or paste the long-form master copy first before generating channel versions.",
        generatedAdaptation: "The channel version has been generated.",
        chooseAdaptation: "Select a channel draft first.",
        complianceDone: "Compliance review completed.",
        headerTitle: "Marketing Content Desk",
        headerDesc: "Polish the current copy, creative direction, and channel drafts in one place.",
        feedbackTitle: "Current read",
        feedbackDesc: "After generation, Tahoe should tell you what exists, what is weak, and what to do next.",
        feedbackDone: "Already generated",
        feedbackWeak: "Weakest point",
        feedbackNext: "Suggested next step",
        unboundBrand: "No brand profile linked",
        unboundTemplate: "No industry template linked",
        summary: (versions: number, adaptations: number, checks: number) => `${versions} master versions · ${adaptations} channel drafts · ${checks} compliance checks`,
        bindWarning: "This project is still missing either a brand profile or an industry template. Without those constraints, the copy is more likely to sound generic and the tone is harder to keep stable.",
        adjustConfig: "Adjust generation settings",
        writingMode: "Writing Mode",
        outputStyle: "Output Style",
        copyLength: "Copy Length",
        usageScenario: "Use Case",
        styleReference: "Style reference",
        styleReferenceDesc: "A reference sample is already attached to this project. New drafts will learn its tone, pacing, and structure.",
        titleStyle: "Title style",
        openingStyle: "Opening pattern",
        bodyRhythm: "Body rhythm",
        editorTitle: "Master Copy Editor",
        editorDesc: "Edit the current master draft. All primary actions stay close to the editor.",
        generating: "AI is drafting...",
        generateMaster: "Generate Master Draft",
        enhancing: "AI is refining...",
        diagnose: "Diagnose & Improve",
        saving: "Saving...",
        saveVersion: "Save as New Version",
        needCopy: "You need a master draft before you can improve it or save another version.",
        versionTitle: "Version Title",
        versionTitlePlaceholder: "For example: Master campaign copy v3",
        masterAngle: "Primary Message Angle",
        masterAnglePlaceholder: "The commercial angle this round should lead with",
        heroCopy: "Opening Summary",
        heroCopyPlaceholder: "A short opening paragraph ready to lead the campaign piece",
        longForm: "Long-Form Master Copy",
        longFormPlaceholder: "The full master marketing draft",
        diagnosisTitle: "Quality diagnosis",
        diagnosisFallback: "A quality diagnosis is available for this version.",
        scoreLabel: "Score",
        strengths: "Strengths",
        issues: "Key issues",
        focus: "Improvement focus",
        collapseAdvanced: "Hide advanced fields",
        expandAdvanced: "Show advanced fields",
        headlineOptions: "Headline Options",
        headlinePlaceholder: "One option per line",
        proofPoints: "Proof Points",
        proofPlaceholder: "One proof point per line",
        cta: "CTA",
        ctaPlaceholder: "What should the audience do next?",
        riskNotes: "Risk Notes",
        riskPlaceholder: "One note per line",
        nextSteps: "Recommended Next Steps",
        nextStepsPlaceholder: "One action per line",
        versionsTitle: "Master Versions",
        versionsDesc: "Switch between historical versions here.",
        confirmDelete: "Confirm delete",
        deleteMark: "✕",
        deleteFailed: "Delete failed",
        deleted: "Version deleted.",
        untitled: "No title or opening line yet",
        noSummary: "No summary yet",
        noVersions: "There are no master versions yet. Start by generating the first draft on the left.",
        channelTitle: "Channel Drafts",
        channelDesc: "Choose a platform and generate a version. The list refreshes right away.",
        targetPlatform: "Target Platform",
        generatingShort: "Generating...",
        generate: "Generate",
        needLongForm: "You need a long-form master draft before creating channel versions.",
        noChannelTitle: "No title or opening line yet",
        noChannelBody: "(No body copy yet)",
        noChannelDrafts: "No channel drafts yet. Pick a platform and click Generate.",
        detailTitle: "Selected Draft & Compliance",
        detailDesc: "Review the chosen channel draft and its compliance result.",
        selectedDraft: "Selected channel draft",
        chooseLeft: "Choose a channel draft from the left first.",
        runComplianceIdle: "Select a channel draft first",
        runningCompliance: "Checking...",
        runCompliance: (label: string) => `Run compliance check for ${label}`,
        complianceResult: "Compliance result",
        needsReview: "Needs manual review",
        noRisk: "No obvious risk found",
        noRiskSummary: "No risk summary available.",
        cleanHit: "No obvious risk items were flagged.",
        issueCount: (count: number) => `${count} risk item${count === 1 ? "" : "s"}`,
        issueTypeFallback: "Risk item",
        unnamedContent: "Unnamed content",
        issueReasonFallback: "This item needs human review.",
        noCheckYetSelected: "There is no compliance record for this draft yet. Run the check from the button above.",
        noCheckYet: "Choose a draft to view its compliance history.",
        creativeTitle: "Ad Creative Direction",
        creativeDesc: "Keep one clear creative pack visible so the ad script and storyboard stay on the same brief.",
        creativeEmpty: "No ad creative pack yet. Use Output Studio on the dashboard to generate one.",
        creativeAudience: "Audience",
        creativeAngle: "Lead angle",
        creativeHook: "Core hook",
        creativeVisual: "Visual direction",
        creativeTone: "Shot tone",
        creativeCta: "CTA direction",
        creativeSellingPoints: "Selling points",
        creativeLatest: "Latest creative",
        creativeHistory: "History",
        creativeCopy: "Copy brief",
        creativeApply: "Use in editor",
        storyboardTitle: "Ad Storyboard",
        storyboardDesc: "Keep ad creative, ad copy, and storyboard linked without leaving Marketing Ops too early.",
        storyboardVersion: "Storyboard version",
        storyboardFrames: "Frames",
        storyboardReady: "Ready frames",
        storyboardGenerate: "Generate ad storyboard",
        storyboardOpen: "Open storyboard planner",
        storyboardHintEmpty: "No storyboard yet. Generate one directly from the current project intent and creative direction.",
        storyboardHintReady: "Storyboard already exists. Open it to keep refining shots, prompts, and assets.",
      }
    : {
        nonJson: "服务器返回了非 JSON 响应。",
        timeout: "AI 模型生成时间过长，请求已中断。建议缩短输入内容或切换更快的模型后重试。",
        updateWritingMode: (label: string) => `写作模式已切换为“${label}”。`,
        updateStyle: (label: string) => `输出风格已切换为“${label}”。`,
        updateLength: (label: string) => `文案长度已切换为“${label}”。`,
        updateScenario: (label: string) => `使用场景已切换为“${label}”。`,
        generatedMaster: "宣传主稿已生成。",
        needDraftBeforeEnhance: "请先有一版主稿，再执行诊断与增强。",
        enhanced: "主稿诊断与增强已完成，已生成新版本。",
        savedVersion: "宣传主稿已另存为新版本。",
        needMasterForAdaptation: "请先生成或填写宣传主稿正文，再做平台改写。",
        generatedAdaptation: "平台版本已生成。",
        chooseAdaptation: "请先选择一条平台稿件。",
        complianceDone: "合规检查已完成。",
        headerTitle: "Marketing 内容台",
        headerDesc: "把当前文案、创意方向和平台稿放在同一个地方持续打磨。",
        feedbackTitle: "当前判断",
        feedbackDesc: "生成完以后，Tahoe 应该直接告诉你现在有什么、最弱在哪、下一步怎么做。",
        feedbackDone: "已生成",
        feedbackWeak: "当前最弱处",
        feedbackNext: "建议下一步",
        unboundBrand: "未绑定品牌",
        unboundTemplate: "未绑定模板",
        summary: (versions: number, adaptations: number, checks: number) => `${versions} 版主稿 · ${adaptations} 篇平台稿 · ${checks} 条合规`,
        bindWarning: "当前项目还没有完整绑定品牌档案或行业模板。生成的主稿会更容易泛化，风格也更难稳定。建议先补齐品牌定位、语气和行业边界。",
        adjustConfig: "调整生成配置",
        writingMode: "写作模式",
        outputStyle: "输出风格",
        copyLength: "文案长度",
        usageScenario: "使用场景",
        styleReference: "风格参照",
        styleReferenceDesc: "当前项目已附带参考样稿。生成主稿时会学习它的语气、节奏和结构。",
        titleStyle: "标题风格",
        openingStyle: "开头风格",
        bodyRhythm: "正文节奏",
        editorTitle: "主稿编辑",
        editorDesc: "编辑当前主稿内容，操作按钮就在上方。",
        generating: "AI 正在生成...",
        generateMaster: "生成新主稿",
        enhancing: "AI 增强中...",
        diagnose: "诊断并增强",
        saving: "保存中...",
        saveVersion: "另存新版本",
        needCopy: "需要先有主稿内容才能增强或另存",
        versionTitle: "版本标题",
        versionTitlePlaceholder: "例如：宣传文案主稿 v3",
        masterAngle: "主宣传角度",
        masterAnglePlaceholder: "本轮传播要主打的商业角度",
        heroCopy: "开场摘要",
        heroCopyPlaceholder: "一段能直接拿去做宣传开头的摘要",
        longForm: "完整宣传主稿",
        longFormPlaceholder: "完整宣传文案正文",
        diagnosisTitle: "质量诊断",
        diagnosisFallback: "当前版本已有质量诊断。",
        scoreLabel: "质量分",
        strengths: "当前优点",
        issues: "主要问题",
        focus: "增强重点",
        collapseAdvanced: "收起高级编辑",
        expandAdvanced: "展开高级编辑",
        headlineOptions: "标题备选",
        headlinePlaceholder: "每行一条标题",
        proofPoints: "核心卖点 / 证据点",
        proofPlaceholder: "每行一条证明点或卖点",
        cta: "CTA",
        ctaPlaceholder: "引导用户下一步动作",
        riskNotes: "风险提示",
        riskPlaceholder: "每行一条风险提示",
        nextSteps: "下一步建议",
        nextStepsPlaceholder: "每行一条下一步动作",
        versionsTitle: "主稿版本",
        versionsDesc: "点击切换历史版本。",
        confirmDelete: "确认删除",
        deleteMark: "✕",
        deleteFailed: "删除失败",
        deleted: "版本已删除。",
        untitled: "未填写标题或开场句",
        noSummary: "暂无摘要",
        noVersions: "还没有宣传主稿版本。先点击左侧的“生成新主稿”。",
        channelTitle: "平台稿件",
        channelDesc: "选择平台并生成，列表即时更新。",
        targetPlatform: "目标平台",
        generatingShort: "生成中...",
        generate: "生成",
        needLongForm: "需要先有主稿正文才能派生平台稿",
        noChannelTitle: "未填写标题或开场句",
        noChannelBody: "（暂无正文内容）",
        noChannelDrafts: "还没有平台稿件。请先选择目标平台并点击“生成”。",
        detailTitle: "稿件详情与合规",
        detailDesc: "查看选中平台稿的内容和合规结果。",
        selectedDraft: "当前选中平台稿",
        chooseLeft: "← 请先从左侧选择一条平台稿件。",
        runComplianceIdle: "请先选中一条平台稿",
        runningCompliance: "检查中...",
        runCompliance: (label: string) => `检查「${label}」合规性`,
        complianceResult: "合规检查结果",
        needsReview: "需要人工复核",
        noRisk: "暂无风险",
        noRiskSummary: "暂无风险总结。",
        cleanHit: "✓ 未命中明显风险。",
        issueCount: (count: number) => `${count} 条风险项`,
        issueTypeFallback: "风险项",
        unnamedContent: "未命名内容",
        issueReasonFallback: "需要人工进一步判断。",
        noCheckYetSelected: "当前平台稿还没有检查记录。请点击上方按钮执行合规检查。",
        noCheckYet: "选择平台稿后可查看检查记录。",
        creativeTitle: "广告创意方向",
        creativeDesc: "把当前广告创意包固定在前面，让广告脚本和分镜始终围绕同一个 brief 展开。",
        creativeEmpty: "还没有广告创意包。先回总览页点一下“广告创意”即可生成。",
        creativeAudience: "目标受众",
        creativeAngle: "主传播角度",
        creativeHook: "核心钩子",
        creativeVisual: "视觉方向",
        creativeTone: "镜头气质",
        creativeCta: "CTA 方向",
        creativeSellingPoints: "核心卖点",
        creativeLatest: "当前创意包",
        creativeHistory: "历史版本",
        creativeCopy: "复制创意包",
        creativeApply: "带入当前编辑",
        storyboardTitle: "广告分镜",
        storyboardDesc: "让广告创意、广告文案和广告分镜在 Marketing Ops 里保持同一条线，不必过早跳走。",
        storyboardVersion: "分镜版本",
        storyboardFrames: "镜头条目",
        storyboardReady: "就绪镜头",
        storyboardGenerate: "生成广告分镜",
        storyboardOpen: "进入分镜页",
        storyboardHintEmpty: "当前还没有分镜。可以直接基于项目意图和创意方向生成第一版。",
        storyboardHintReady: "当前已经有分镜版本了，进入后可以继续细化镜头、提示词和素材。",
      };
  const styleReferenceSample = projectConfig.styleReferenceSample?.trim() ?? "";
  const styleReferenceInsight = projectConfig.styleReferenceInsight ?? null;

  const versions = marketingOverview.promotionalCopyVersions;
  const selectedVersion = useMemo(
    () =>
      versions.find((item) => item.id === selectedVersionId) ??
      (marketingOverview.latestPromotionalCopy
        ? {
            id: marketingOverview.latestPromotionalCopy.id,
            title: marketingOverview.latestPromotionalCopy.title,
            summary: marketingOverview.latestPromotionalCopy.summary,
            createdAt: marketingOverview.latestPromotionalCopy.createdAt,
            taskJson: marketingOverview.latestPromotionalCopy.taskJson,
          }
        : null),
    [marketingOverview.latestPromotionalCopy, selectedVersionId, versions],
  );

  useEffect(() => {
    if (!selectedVersion) {
      return;
    }
    const payload = parsePayload(selectedVersion.taskJson);
    setDraftTitle(selectedVersion.title || "");
    setMasterAngle(payload?.master_angle ?? "");
    setHeadlineOptions(toLines(payload?.headline_options));
    setHeroCopy(payload?.hero_copy ?? selectedVersion.summary ?? "");
    setLongFormCopy(payload?.long_form_copy ?? "");
    setProofPoints(toLines(payload?.proof_points));
    setCallToAction(payload?.call_to_action ?? "");
    setRiskNotes(toLines(payload?.risk_notes));
    setRecommendedNextSteps(toLines(payload?.recommended_next_steps));
  }, [selectedVersionId, selectedVersion]);

  useEffect(() => {
    if (!selectedAdaptationId && marketingOverview.platformAdaptations[0]?.id) {
      setSelectedAdaptationId(marketingOverview.platformAdaptations[0].id);
    }
  }, [marketingOverview.platformAdaptations, selectedAdaptationId]);

  const selectedAdaptation = marketingOverview.platformAdaptations.find((item) => item.id === selectedAdaptationId) ?? null;
  const latestAdCreative = marketingOverview.latestAdCreative ? parseAdCreativePayload(marketingOverview.latestAdCreative.taskJson) : null;
  const latestAdCreativePayload =
    marketingOverview.latestAdCreative?.taskJson && typeof marketingOverview.latestAdCreative.taskJson === "object"
      ? (marketingOverview.latestAdCreative.taskJson as Record<string, unknown>)
      : null;
  const creativeKnowledgeNotes = normalizeStringList(latestAdCreativePayload?.knowledge_notes);
  const creativeArtifactReview = normalizeArtifactReview(latestAdCreativePayload?.artifact_review);
  useEffect(() => {
    setCreativeAudience(latestAdCreative?.target_audience ?? "");
    setCreativeAngle(latestAdCreative?.lead_angle ?? "");
    setCreativeHook(latestAdCreative?.core_hook ?? "");
    setCreativeSellingPoints(toLines(normalizeStringList(latestAdCreative?.selling_points)));
    setCreativeVisualDirection(latestAdCreative?.visual_direction ?? "");
    setCreativeShotTone(latestAdCreative?.shot_tone ?? "");
    setCreativeCtaDirection(latestAdCreative?.cta_direction ?? "");
  }, [marketingOverview.latestAdCreative?.id, latestAdCreative]);
  const latestCheckForSelected = useMemo(
    () => marketingOverview.complianceChecks.find((item) => item.targetId === selectedAdaptationId),
    [marketingOverview.complianceChecks, selectedAdaptationId],
  );
  const selectedVersionPayload = selectedVersion ? parsePayload(selectedVersion.taskJson) : null;
  const creativeVisualReady = Boolean(
    latestAdCreative?.visual_direction?.trim() &&
    latestAdCreative?.shot_tone?.trim() &&
    normalizeStringList(latestAdCreative?.selling_points).length > 0,
  );
  const feedbackSummary = useMemo(() => {
    const completed: string[] = [];
    if (selectedVersion) completed.push(locale === "en" ? "master draft available" : "主稿已生成");
    if (marketingOverview.latestAdCreative) completed.push(locale === "en" ? "ad creative available" : "广告创意已生成");
    if (marketingOverview.platformAdaptations.length > 0) completed.push(locale === "en" ? `${marketingOverview.platformAdaptations.length} channel drafts` : `${marketingOverview.platformAdaptations.length} 条平台稿`);
    if (marketingOverview.storyboardSummary.frameCount > 0) completed.push(locale === "en" ? "ad storyboard available" : "广告分镜已生成");

    const diagnosis = selectedVersionPayload?.quality_diagnosis;
    let weakest =
      locale === "en"
        ? "Start with a usable master draft first."
        : "先拿到一版可用主稿。";
    let next =
      locale === "en"
        ? "Generate the first master draft, then refine message and platform direction."
        : "先生成第一版主稿，再去收紧主传播角度和平台方向。";

    if (!selectedVersion) {
      return {
        done: completed.join(" · ") || (locale === "en" ? "No key artifact yet." : "还没有关键产物。"),
        weakest,
        next,
      };
    }

    if (diagnosis?.issues?.length) {
      weakest = diagnosis.issues.slice(0, 2).map((item) => toDisplayString(item)).join("；");
      next = diagnosis.rewrite_focus?.length
        ? diagnosis.rewrite_focus.slice(0, 2).map((item) => toDisplayString(item)).join("；")
        : (locale === "en" ? "Use the diagnosis and improve this master draft before branching further." : "先根据诊断继续增强这一版主稿，再继续往下派生。");
    } else if (!marketingOverview.latestAdCreative) {
      weakest = locale === "en" ? "The copy exists, but creative direction is still missing." : "文案已有基础，但创意方向还没立起来。";
      next = locale === "en" ? "Generate an ad creative pack so the script and storyboard share one clear brief." : "补一版广告创意包，让脚本和分镜围绕同一个 brief。";
    } else if (!creativeVisualReady) {
      weakest = locale === "en" ? "The creative brief still lacks enough visual direction for Nano Banana / Seedance / Veo." : "当前创意包对 Nano Banana / Seedance / Veo 来说还不够可执行。";
      next = locale === "en" ? "Sharpen visual direction, shot tone, and concrete selling-point imagery so later storyboard prompts stay production-ready." : "补强视觉方向、镜头气质和可视化卖点，让后续广告分镜提示词更适合直接生成。";
    } else if (marketingOverview.platformAdaptations.length === 0) {
      weakest = locale === "en" ? "No platform-ready draft yet." : "还没有平台可用稿。";
      next = locale === "en" ? "Pick a platform and generate the first channel draft from the current master copy." : "选择一个平台，基于当前主稿生成第一条平台稿。";
    } else if (marketingOverview.storyboardSummary.frameCount === 0) {
      weakest = locale === "en" ? "The ad storyboard is not ready yet." : "广告分镜还没准备出来。";
      next = locale === "en" ? "Generate the storyboard after the copy and creative direction feel stable, then verify it is strong enough for Nano Banana / Seedance / Veo shots." : "等文案和创意方向稳定后，继续生成广告分镜，再检查是否足够适合 Nano Banana / Seedance / Veo 的镜头生成。";
    } else if (latestCheckForSelected?.needsReview) {
      weakest = latestCheckForSelected.summary || (locale === "en" ? "The selected channel draft still needs manual compliance review." : "当前平台稿还需要人工复核。");
      next = locale === "en" ? "Resolve the flagged compliance issues before final delivery." : "先处理当前命中的合规风险，再进入最终交付。";
    } else {
      weakest = locale === "en" ? "No major blocker right now." : "当前没有明显硬阻塞。";
      next = locale === "en" ? "Continue refining the strongest platform draft or move into delivery preparation. The current brief is already usable for downstream visual generation." : "继续精修当前最强的平台稿，或直接进入交付准备。当前创意包已经足够支撑后续视觉生成。";
    }

    return {
      done: completed.join(" · ") || (locale === "en" ? "Core marketing artifacts are in progress." : "核心 Marketing 产物已在推进中。"),
      weakest,
      next,
    };
  }, [creativeVisualReady, latestCheckForSelected, locale, marketingOverview.latestAdCreative, marketingOverview.platformAdaptations.length, marketingOverview.storyboardSummary.frameCount, selectedVersion, selectedVersionPayload]);
  const masterCopyQualityAlerts = useMemo(
    () =>
      assessMarketingMasterCopy({
        longFormCopy,
        proofPoints: fromLines(proofPoints),
        callToAction,
        qualityIssues: selectedVersionPayload?.quality_diagnosis?.issues?.map((item) => toDisplayString(item)).filter(Boolean) ?? [],
      }),
    [callToAction, longFormCopy, proofPoints, selectedVersionPayload],
  );
  const creativeQualityAlerts = useMemo(
    () =>
      marketingOverview.latestAdCreative
        ? assessAdCreative({
            hook: creativeHook,
            sellingPoints: fromLines(creativeSellingPoints),
            visualDirection: creativeVisualDirection,
            shotTone: creativeShotTone,
          })
        : [],
    [creativeHook, creativeSellingPoints, creativeShotTone, creativeVisualDirection, marketingOverview.latestAdCreative],
  );

  async function request(path: string, options: RequestInit, key: string, successMessage: string) {
    setPending(key);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(path, options);
      const text = await response.text();
      let payload: { success: boolean; error?: { message?: string; detail?: string } };
      try {
        payload = JSON.parse(text) as typeof payload;
      } catch {
        throw new Error(response.ok ? ui.nonJson : `服务器返回了错误 (${response.status})，可能是请求超时。请稍后重试。`);
      }
      if (!payload.success) {
        throw new Error(payload.error?.detail || payload.error?.message || "操作失败。");
      }
      setMessage(successMessage);
      router.refresh();
      return payload;
    } catch (requestError) {
      const raw = requestError instanceof Error ? requestError.message : "操作失败。";
      const isAbort = requestError instanceof Error && (requestError.name === "AbortError" || raw.includes("aborted"));
      const friendly = isAbort ? ui.timeout : raw;
      setError(friendly);
      return null;
    } finally {
      setPending(null);
    }
  }

  async function updateWritingMode(next: WritingMode) {
    setWritingMode(next);
    await request(
      `/api/projects/${projectId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writing_mode: next }),
      },
      "writing-mode",
      ui.updateWritingMode(getWritingModeMeta(next, locale).label),
    );
  }

  async function updateStyleTemplate(next: StyleTemplate) {
    setStyleTemplate(next);
    await request(
      `/api/projects/${projectId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style_template: next }),
      },
      "style-template",
      ui.updateStyle(getStyleTemplateMeta(next, locale).label),
    );
  }

  async function updateCopyLength(next: CopyLength) {
    setCopyLength(next);
    await request(
      `/api/projects/${projectId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copy_length: next }),
      },
      "copy-length",
      ui.updateLength(getCopyLengthMeta(next, locale).label),
    );
  }

  async function updateUsageScenario(next: UsageScenario) {
    setUsageScenario(next);
    await request(
      `/api/projects/${projectId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usage_scenario: next }),
      },
      "usage-scenario",
      ui.updateScenario(getUsageScenarioMeta(next, locale).label),
    );
  }

  async function generatePromotionalCopy() {
    const result = await request(`/api/projects/${projectId}/promotional-copy`, { method: "POST" }, "promo-copy", ui.generatedMaster);
    if (result) {
      setSelectedVersionId(null);
    }
  }

  async function diagnoseAndEnhanceCopy() {
    if (!masterAngle.trim() || !heroCopy.trim() || !longFormCopy.trim()) {
      setError(ui.needDraftBeforeEnhance);
      return;
    }

    const result = await request(
      `/api/projects/${projectId}/promotional-copy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhance",
          title: draftTitle ? `${draftTitle} · 增强版` : undefined,
          master_angle: masterAngle,
          headline_options: fromLines(headlineOptions),
          hero_copy: heroCopy,
          long_form_copy: longFormCopy,
          proof_points: fromLines(proofPoints),
          call_to_action: callToAction,
          risk_notes: fromLines(riskNotes),
          recommended_next_steps: fromLines(recommendedNextSteps),
          source_task_id: selectedVersionId,
        }),
      },
      "enhance-copy",
      ui.enhanced,
    );
    if (result) {
      setSelectedVersionId(null);
    }
  }

  async function savePromotionalCopyVersion() {
    const result = await request(
      `/api/projects/${projectId}/promotional-copy`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          master_angle: masterAngle,
          headline_options: fromLines(headlineOptions),
          hero_copy: heroCopy,
          long_form_copy: longFormCopy,
          proof_points: fromLines(proofPoints),
          call_to_action: callToAction,
          risk_notes: fromLines(riskNotes),
          recommended_next_steps: fromLines(recommendedNextSteps),
          source_task_id: selectedVersionId,
        }),
      },
      "save-copy",
      ui.savedVersion,
    );
    if (result) {
      setSelectedVersionId(null);
    }
  }

  async function generateAdaptationFromDraft() {
    if (!longFormCopy.trim()) {
      setError(ui.needMasterForAdaptation);
      return;
    }

    await request(
      `/api/projects/${projectId}/platform-adaptations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_profile_id: activeBrandId,
          campaign_sprint_id: activeSprintId,
          source_message: longFormCopy,
          platform_surface: adaptSurface,
          adaptation_status: "READY",
          auto_generate: true,
          structured_output: {
            source: "promotional_copy",
            surface: adaptSurface,
            source_task_id: selectedVersionId,
          },
        }),
      },
      "quick-adapt",
      ui.generatedAdaptation,
    );
  }

  async function runComplianceCheck() {
    if (!selectedAdaptation) {
      setError(ui.chooseAdaptation);
      return;
    }

    await request(
      `/api/projects/${projectId}/compliance-checks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_profile_id: activeBrandId,
          campaign_sprint_id: activeSprintId,
          platform_adaptation_id: selectedAdaptation.id,
          target_type: "PLATFORM_ADAPTATION",
          target_id: selectedAdaptation.id,
          platform_surface: selectedAdaptation.surface,
          title_text: selectedAdaptation.title ?? selectedAdaptation.hook ?? undefined,
        }),
      },
      "compliance",
      ui.complianceDone,
    );
  }

  async function copyCreativeBrief() {
    if (!latestAdCreative) {
      return;
    }

    const text = [
      `${ui.creativeAudience}：${latestAdCreative.target_audience ?? "-"}`,
      `${ui.creativeAngle}：${latestAdCreative.lead_angle ?? "-"}`,
      `${ui.creativeHook}：${latestAdCreative.core_hook ?? "-"}`,
      normalizeStringList(latestAdCreative.selling_points).length
        ? `${ui.creativeSellingPoints}：\n${normalizeStringList(latestAdCreative.selling_points).map((item) => `- ${item}`).join("\n")}`
        : "",
      `${ui.creativeVisual}：${latestAdCreative.visual_direction ?? "-"}`,
      `${ui.creativeTone}：${latestAdCreative.shot_tone ?? "-"}`,
      `${ui.creativeCta}：${latestAdCreative.cta_direction ?? "-"}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await copyToClipboard(text);
      setMessage(locale === "en" ? "Creative brief copied." : "广告创意包已复制。");
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : locale === "en" ? "Copy failed." : "复制失败。");
    }
  }

  function applyCreativeToEditor() {
    if (!latestAdCreative) {
      return;
    }

    setMasterAngle((current) => current.trim() || latestAdCreative.lead_angle || "");
    setHeroCopy((current) => current.trim() || latestAdCreative.core_hook || "");
    setProofPoints((current) => current.trim() || toLines(normalizeStringList(latestAdCreative.selling_points)));
    setCallToAction((current) => current.trim() || latestAdCreative.cta_direction || "");
    setRiskNotes((current) => current.trim() || latestAdCreative.visual_direction || "");
    setShowAdvanced(true);
    setMessage(locale === "en" ? "Creative direction applied to the editor." : "广告创意方向已带入当前编辑区。");
    setError(null);
  }

  async function saveCreativeBriefVersion() {
    if (!creativeHook.trim() || !creativeAngle.trim()) {
      setError(locale === "en" ? "Please fill in the lead angle and core hook first." : "请先填写主传播角度和核心钩子。");
      return;
    }

    setCreativePending(true);
    setMessage(null);
    setError(null);

    try {
      await apiRequest(`/api/projects/${projectId}/strategy-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_profile_id: activeBrandId,
          campaign_sprint_id: activeSprintId,
          task_type: "TOPIC_PLAN",
          task_status: "DONE",
          task_title: `广告创意 · ${creativeHook.trim()}`,
          task_summary: creativeHook.trim(),
          priority_score: 86,
          task_json: {
            kind: "AD_CREATIVE",
            output_type: "AD_CREATIVE",
            generated_at: new Date().toISOString(),
            target_audience: creativeAudience.trim(),
            lead_angle: creativeAngle.trim(),
            core_hook: creativeHook.trim(),
            selling_points: fromLines(creativeSellingPoints),
            visual_direction: creativeVisualDirection.trim(),
            shot_tone: creativeShotTone.trim(),
            cta_direction: creativeCtaDirection.trim(),
            edited_in_place: true,
          },
        }),
      });

      setMessage(locale === "en" ? "Creative brief saved as a new version." : "广告创意包已另存为新版本。");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : locale === "en" ? "Save failed." : "保存失败。");
    } finally {
      setCreativePending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PanelCard title={ui.feedbackTitle} description={ui.feedbackDesc}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.feedbackDone}</div>
            <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{feedbackSummary.done}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.feedbackWeak}</div>
            <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{feedbackSummary.weakest}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.feedbackNext}</div>
            <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{feedbackSummary.next}</div>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title={locale === "en" ? "Quality alerts" : "质量提醒"}
        description={locale === "en" ? "Keep the feedback concrete: hook strength, proof density, and whether the creative is visual enough to shoot." : "只抓最影响交付质量的几个点：钩子、证据密度，以及创意是否已经足够可拍。"}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Master copy" : "主稿"}</div>
            <div className="mt-3 space-y-2">
              {selectedVersion ? masterCopyQualityAlerts.map((alert) => (
                <div key={`${alert.label}-${alert.detail}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-3">
                  <div className="text-sm font-semibold text-[var(--text-1)]">{alert.label}</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--text-2)]">{alert.detail}</div>
                </div>
              )) : <div className="text-sm leading-7 text-[var(--text-2)]">{locale === "en" ? "Generate the first master draft before quality review can say anything useful." : "先拿到第一版主稿，系统才能判断它是不是还停留在空泛层。 "}</div>}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Ad creative" : "广告创意"}</div>
            <div className="mt-3 space-y-2">
              {marketingOverview.latestAdCreative ? creativeQualityAlerts.map((alert) => (
                <div key={`${alert.label}-${alert.detail}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-3">
                  <div className="text-sm font-semibold text-[var(--text-1)]">{alert.label}</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--text-2)]">{alert.detail}</div>
                </div>
              )) : <div className="text-sm leading-7 text-[var(--text-2)]">{locale === "en" ? "Generate an ad creative pack first, then Tahoe can tell you whether it is specific enough for storyboard work." : "先生成一版广告创意包，系统才能判断它是不是已经具体到能继续拆广告分镜。"} </div>}
            </div>
          </div>
        </div>
      </PanelCard>

      {/* ── Header: Project Context & Config ── */}
      <PanelCard title={ui.headerTitle} description={ui.headerDesc}>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="theme-pill rounded-full px-3 py-1 text-xs font-medium">{marketingOverview.brandProfile?.brandName ?? ui.unboundBrand}</span>
          <span className="theme-pill rounded-full px-3 py-1 text-xs font-medium">{marketingOverview.industryTemplate?.industryName ?? ui.unboundTemplate}</span>
          <span className="text-[var(--text-3)]">{ui.summary(versions.length, (marketingOverview.platformAdaptations ?? []).length, (marketingOverview.complianceChecks ?? []).length)}</span>
        </div>

        {!marketingOverview.brandProfile || !marketingOverview.industryTemplate ? (
          <div className="mb-4 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm leading-7 text-[var(--warning-text)]">
            {ui.bindWarning}
          </div>
        ) : null}

        <Disclosure
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4"
          summaryClassName="text-sm font-medium text-[var(--text-1)]"
          contentClassName="mt-4 space-y-4"
          title={ui.adjustConfig}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className="text-sm font-medium text-[var(--text-2)]">{ui.writingMode}</div>
              <select value={writingMode} onChange={(event) => void updateWritingMode(event.target.value as WritingMode)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" disabled={pending !== null}>
                {writingModeList.map((mode) => (<option key={mode} value={mode}>{getWritingModeMeta(mode, locale).label}</option>))}
              </select>
              <div className="text-sm text-[var(--text-2)]">{writingMeta.description}</div>
            </label>
            <label className="space-y-2">
              <div className="text-sm font-medium text-[var(--text-2)]">{ui.outputStyle}</div>
              <select value={styleTemplate} onChange={(event) => void updateStyleTemplate(event.target.value as StyleTemplate)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" disabled={pending !== null}>
                {styleTemplateList.map((style) => (<option key={style} value={style}>{getStyleTemplateMeta(style, locale).label}</option>))}
              </select>
              <div className="text-sm text-[var(--text-2)]">{styleMeta.description}</div>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className="text-sm font-medium text-[var(--text-2)]">{ui.copyLength}</div>
              <select value={copyLength} onChange={(event) => void updateCopyLength(event.target.value as CopyLength)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" disabled={pending !== null}>
                {copyLengthList.map((item) => (<option key={item} value={item}>{getCopyLengthMeta(item, locale).label}</option>))}
              </select>
              <div className="text-sm text-[var(--text-2)]">{copyLengthMeta.description}</div>
            </label>
            <label className="space-y-2">
              <div className="text-sm font-medium text-[var(--text-2)]">{ui.usageScenario}</div>
              <select value={usageScenario} onChange={(event) => void updateUsageScenario(event.target.value as UsageScenario)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" disabled={pending !== null}>
                {usageScenarioList.map((item) => (<option key={item} value={item}>{getUsageScenarioMeta(item, locale).label}</option>))}
              </select>
              <div className="text-sm text-[var(--text-2)]">{usageScenarioMeta.description}</div>
            </label>
          </div>
          {styleReferenceSample ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.styleReference}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.styleReferenceDesc}</div>
              {styleReferenceInsight ? (
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-[var(--surface-solid)] px-3 py-3 text-sm leading-7 text-[var(--text-2)]">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.titleStyle}</div>
                    {(styleReferenceInsight.titleStyleLines ?? []).map((line) => (<div key={line}>• {line}</div>))}
                  </div>
                  <div className="rounded-xl bg-[var(--surface-solid)] px-3 py-3 text-sm leading-7 text-[var(--text-2)]">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.openingStyle}</div>
                    {(styleReferenceInsight.openingStyleLines ?? []).map((line) => (<div key={line}>• {line}</div>))}
                  </div>
                  <div className="rounded-xl bg-[var(--surface-solid)] px-3 py-3 text-sm leading-7 text-[var(--text-2)]">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.bodyRhythm}</div>
                    {(styleReferenceInsight.bodyRhythmLines ?? []).map((line) => (<div key={line}>• {line}</div>))}
                  </div>
                </div>
              ) : null}
              {styleReferenceInsight ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {(styleReferenceInsight.summaryLines ?? []).map((line) => (
                    <div key={line} className="rounded-xl bg-[var(--surface-solid)] px-3 py-2 text-sm leading-7 text-[var(--text-2)]">{line}</div>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-[var(--text-2)]">{styleReferenceSample}</div>
            </div>
          ) : null}
        </Disclosure>

        {message ? <div className="mt-4 rounded-xl bg-[var(--ok-bg,var(--surface-muted))] px-4 py-2 text-sm text-[var(--ok-text)]">{message}</div> : null}
        {error ? <div className="mt-4 rounded-xl bg-[var(--danger-bg,var(--surface-muted))] px-4 py-2 text-sm text-[var(--danger-text)]">{error}</div> : null}
      </PanelCard>

      <PanelCard title={ui.creativeTitle} description={ui.creativeDesc}>
        {marketingOverview.latestAdCreative && latestAdCreative ? (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="theme-panel-muted rounded-[24px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeLatest}</div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => void copyCreativeBrief()}>
                    {ui.creativeCopy}
                  </Button>
                  <Button variant="secondary" className="h-auto px-3 py-1.5 text-xs" onClick={applyCreativeToEditor}>
                    {ui.creativeApply}
                  </Button>
                  <Button variant="secondary" className="h-auto px-3 py-1.5 text-xs" onClick={() => void saveCreativeBriefVersion()} disabled={creativePending}>
                    {creativePending ? (locale === "en" ? "Saving..." : "保存中...") : (locale === "en" ? "Save as version" : "另存新版本")}
                  </Button>
                  <span className="theme-pill rounded-full px-3 py-1 text-xs font-medium">
                    {new Date(marketingOverview.latestAdCreative.createdAt).toLocaleString(timeLocale)}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeAudience}</div>
                  <textarea value={creativeAudience} onChange={(event) => setCreativeAudience(event.target.value)} rows={4} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeAngle}</div>
                  <textarea value={creativeAngle} onChange={(event) => setCreativeAngle(event.target.value)} rows={4} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeHook}</div>
                  <textarea value={creativeHook} onChange={(event) => setCreativeHook(event.target.value)} rows={5} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeVisual}</div>
                  <textarea value={creativeVisualDirection} onChange={(event) => setCreativeVisualDirection(event.target.value)} rows={5} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeTone}</div>
                  <textarea value={creativeShotTone} onChange={(event) => setCreativeShotTone(event.target.value)} rows={5} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeCta}</div>
                <textarea value={creativeCtaDirection} onChange={(event) => setCreativeCtaDirection(event.target.value)} rows={3} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeSellingPoints}</div>
                <div className="mt-3">
                  <textarea value={creativeSellingPoints} onChange={(event) => setCreativeSellingPoints(event.target.value)} rows={8} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Knowledge notes" : "创作知识"}</div>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                    {(creativeKnowledgeNotes.length ? creativeKnowledgeNotes : getOutputKnowledgePack("AD_CREATIVE").knowledgeNotes).map((item) => (
                      <div key={item}>- {item}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "System review" : "系统复核"}</div>
                  <div className="mt-3 text-sm leading-6 text-[var(--text-1)]">
                    {creativeArtifactReview?.summary || (locale === "en" ? "No stored review on this version yet." : "当前版本还没有存档复核结果。")}
                  </div>
                  {creativeArtifactReview?.issues.length ? (
                    <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                      {creativeArtifactReview.issues.slice(0, 3).map((item) => (
                        <div key={item}>- {item}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {marketingOverview.adCreativeVersions.length > 1 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.creativeHistory}</div>
                  <div className="mt-3 space-y-2">
                    {marketingOverview.adCreativeVersions.slice(1).map((item) => (
                      <div key={item.id} className="rounded-xl bg-[var(--surface-muted)] px-3 py-3">
                        <div className="text-sm font-medium text-[var(--text-1)]">{item.title}</div>
                        <div className="mt-1 text-sm leading-7 text-[var(--text-2)]">{item.summary ?? ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm leading-7 text-[var(--text-2)]">
            {ui.creativeEmpty}
          </div>
        )}
      </PanelCard>

      <PanelCard title={ui.storyboardTitle} description={ui.storyboardDesc}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.storyboardVersion}</div>
            <div className="mt-3 text-2xl font-semibold text-[var(--text-1)]">
              {marketingOverview.storyboardSummary.versionNumber ? `v${marketingOverview.storyboardSummary.versionNumber}` : "-"}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.storyboardFrames}</div>
            <div className="mt-3 text-2xl font-semibold text-[var(--text-1)]">{marketingOverview.storyboardSummary.frameCount}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.storyboardReady}</div>
            <div className="mt-3 text-2xl font-semibold text-[var(--text-1)]">
              {marketingOverview.storyboardSummary.readyFrameCount}/{Math.max(marketingOverview.storyboardSummary.frameCount, marketingOverview.storyboardSummary.sceneCount)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <GenerateStoryboardButton projectId={projectId} locale={locale} label={ui.storyboardGenerate} />
          <NextStepLink href={`/scene-planner?projectId=${projectId}`} label={ui.storyboardOpen} />
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-sm leading-7 text-[var(--text-2)]">
          {marketingOverview.storyboardSummary.frameCount > 0 ? ui.storyboardHintReady : ui.storyboardHintEmpty}
        </div>
      </PanelCard>

      {/* ── Phase 1: Master Copy Workspace ── */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard title={ui.editorTitle} description={ui.editorDesc}>
          <div className="space-y-5">
            {/* Action buttons colocated with editor */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void generatePromotionalCopy()} disabled={pending !== null}>
                {pending === "promo-copy" ? ui.generating : ui.generateMaster}
              </Button>
              <Button variant="secondary" onClick={() => void diagnoseAndEnhanceCopy()} disabled={pending !== null || !heroCopy.trim()}>
                {pending === "enhance-copy" ? ui.enhancing : ui.diagnose}
              </Button>
              <Button variant="secondary" onClick={() => void savePromotionalCopyVersion()} disabled={pending !== null || !heroCopy.trim()}>
                {pending === "save-copy" ? ui.saving : ui.saveVersion}
              </Button>
            </div>
            {!heroCopy.trim() && <div className="text-xs text-[var(--text-3)]">{ui.needCopy}</div>}

            <div className="grid gap-4 md:grid-cols-[1fr_0.62fr]">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.versionTitle}</label>
                <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" placeholder={ui.versionTitlePlaceholder} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.masterAngle}</label>
                <input value={masterAngle} onChange={(event) => setMasterAngle(event.target.value)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" placeholder={ui.masterAnglePlaceholder} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.heroCopy}</label>
              <textarea value={heroCopy} onChange={(event) => setHeroCopy(event.target.value)} rows={4} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" placeholder={ui.heroCopyPlaceholder} />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.longForm}</label>
              <textarea value={longFormCopy} onChange={(event) => setLongFormCopy(event.target.value)} rows={14} className="theme-input w-full rounded-2xl px-4 py-4 text-sm leading-8" placeholder={ui.longFormPlaceholder} />
            </div>

            {selectedVersion ? (() => {
              const payload = parsePayload(selectedVersion.taskJson);
              const diagnosis = payload?.quality_diagnosis;
              if (!diagnosis) return null;
              return (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.diagnosisTitle}</div>
                      <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{diagnosis.summary ?? ui.diagnosisFallback}</div>
                    </div>
                    {typeof diagnosis.overall_score === "number" ? (
                      <div className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-1)]">
                        {ui.scoreLabel} {diagnosis.overall_score}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-[var(--surface-solid)] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.strengths}</div>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-2)]">
                        {(diagnosis.strengths ?? []).map((item, idx) => (<div key={idx}>• {toDisplayString(item)}</div>))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-solid)] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.issues}</div>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-2)]">
                        {(diagnosis.issues ?? []).map((item, idx) => (<div key={idx}>• {toDisplayString(item)}</div>))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-solid)] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.focus}</div>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-2)]">
                        {(diagnosis.rewrite_focus ?? []).map((item, idx) => (<div key={idx}>• {toDisplayString(item)}</div>))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : null}

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowAdvanced((value) => !value)}>
                {showAdvanced ? ui.collapseAdvanced : ui.expandAdvanced}
              </Button>
            </div>

            {showAdvanced ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.headlineOptions}</label>
                    <textarea value={headlineOptions} onChange={(event) => setHeadlineOptions(event.target.value)} rows={5} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" placeholder={ui.headlinePlaceholder} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.proofPoints}</label>
                    <textarea value={proofPoints} onChange={(event) => setProofPoints(event.target.value)} rows={5} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" placeholder={ui.proofPlaceholder} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.cta}</label>
                    <textarea value={callToAction} onChange={(event) => setCallToAction(event.target.value)} rows={3} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" placeholder={ui.ctaPlaceholder} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.riskNotes}</label>
                    <textarea value={riskNotes} onChange={(event) => setRiskNotes(event.target.value)} rows={3} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" placeholder={ui.riskPlaceholder} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.nextSteps}</label>
                    <textarea value={recommendedNextSteps} onChange={(event) => setRecommendedNextSteps(event.target.value)} rows={3} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" placeholder={ui.nextStepsPlaceholder} />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </PanelCard>

        {/* Version History (right column) */}
        <PanelCard title={ui.versionsTitle} description={ui.versionsDesc}>
          <div className="space-y-3">
            {versions.length ? (
              versions.map((item) => {
                const payload = parsePayload(item.taskJson);
                const versionNumber = typeof (payload as { version_number?: number } | null)?.version_number === "number"
                  ? (payload as { version_number: number }).version_number
                  : null;
                const active = item.id === selectedVersionId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedVersionId(item.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-[var(--accent-strong)] bg-[var(--surface-muted)]"
                        : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-[var(--text-1)]">{item.title}</div>
                      <div className="flex items-center gap-2">
                        {versionNumber ? <span className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">v{versionNumber}</span> : null}
                        <span
                          role="button"
                          tabIndex={0}
                          className={`rounded-full px-2 py-1 text-xs transition cursor-pointer ${
                            deleteArmedId === item.id
                              ? "bg-[var(--danger-bg)] text-[var(--danger-text)] font-medium"
                              : "text-[var(--text-3)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)]"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (deleteArmedId !== item.id) {
                              setDeleteArmedId(item.id);
                              setTimeout(() => setDeleteArmedId((prev) => prev === item.id ? null : prev), 3000);
                              return;
                            }
                            setDeleteArmedId(null);
                            void (async () => {
                              try {
                                const res = await fetch(`/api/projects/${projectId}/promotional-copy?taskId=${item.id}`, { method: "DELETE" });
                                const text = await res.text();
                                let p: { success: boolean; error?: { message?: string } };
                                try { p = JSON.parse(text); } catch { throw new Error(ui.nonJson); }
                                if (!p.success) throw new Error(p.error?.message ?? ui.deleteFailed);
                                if (selectedVersionId === item.id) setSelectedVersionId(null);
                                setMessage(ui.deleted);
                                router.refresh();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : ui.deleteFailed);
                              }
                            })();
                          }}
                        >{deleteArmedId === item.id ? ui.confirmDelete : ui.deleteMark}</span>
                      </div>
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm text-[var(--text-2)]">{payload?.hero_copy ?? item.summary ?? ui.noSummary}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-3)]">
                      <span>{new Date(item.createdAt).toLocaleString(timeLocale)}</span>
                      {payload?.generation_source ? <span className="theme-pill rounded-full px-2 py-1 text-[11px] font-medium">{payload.generation_source}</span> : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-2)]">
                {ui.noVersions}
              </div>
            )}
          </div>
        </PanelCard>
      </div>

      {/* ── Phase 2 & 3: Platform Adaptations & Compliance ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left: Platform adaptation list + generate form */}
        <PanelCard title={ui.channelTitle} description={ui.channelDesc}>
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <label className="flex-1 space-y-1">
                <div className="text-xs font-medium text-[var(--text-3)]">{ui.targetPlatform}</div>
                <select value={adaptSurface} onChange={(event) => setAdaptSurface(event.target.value as PlatformSurface)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" disabled={pending !== null}>
                  {platformSurfaceList.map((item) => (<option key={item} value={item}>{getPlatformSurfaceMeta(item, locale).label}</option>))}
                </select>
              </label>
              <Button onClick={() => void generateAdaptationFromDraft()} disabled={pending !== null || !longFormCopy.trim()} className="shrink-0">
                {pending === "quick-adapt" ? ui.generatingShort : ui.generate}
              </Button>
            </div>
            {!longFormCopy.trim() && <div className="text-xs text-[var(--text-3)]">{ui.needLongForm}</div>}

            <div className="space-y-3">
              {(marketingOverview.platformAdaptations ?? []).length ? (
                (marketingOverview.platformAdaptations ?? []).map((item) => {
                  const active = item.id === selectedAdaptationId;
                  const statusColor = item.status === "APPROVED" ? "bg-[var(--ok-text)]" : item.status === "DRAFT" ? "bg-[var(--text-3)]" : "bg-[var(--accent)]";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAdaptationId(item.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        active
                          ? "border-[var(--accent-strong)] bg-[var(--surface-muted)] ring-1 ring-[var(--accent-strong)]"
                          : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block size-2 shrink-0 rounded-full ${statusColor}`} />
                          <span className="font-medium text-[var(--text-1)]">{getPlatformSurfaceMeta(item.surface as PlatformSurface, locale).label}</span>
                        </div>
                        <span className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{getAdaptationStatusLabel(item.status, locale)}</span>
                      </div>
                      <div className="mt-2 text-sm text-[var(--text-1)]">{item.title ?? item.hook ?? ui.noChannelTitle}</div>
                      <div className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--text-2)]">{item.body || ui.noChannelBody}</div>
                      <div className="mt-2 text-xs text-[var(--text-3)]">{new Date(item.createdAt).toLocaleString(timeLocale)}</div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-2)]">
                  {ui.noChannelDrafts}
                </div>
              )}
            </div>
          </div>
        </PanelCard>

        {/* Right: Selected adaptation detail + compliance */}
        <PanelCard title={ui.detailTitle} description={ui.detailDesc}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.selectedDraft}</div>
              {selectedAdaptation ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block size-2 rounded-full ${
                      selectedAdaptation.status === "APPROVED" ? "bg-[var(--ok-text)]" : selectedAdaptation.status === "DRAFT" ? "bg-[var(--text-3)]" : "bg-[var(--accent)]"
                    }`} />
                    <span className="font-medium text-[var(--text-1)]">{getPlatformSurfaceMeta(selectedAdaptation.surface as PlatformSurface, locale).label}</span>
                    <span className="theme-pill rounded-full px-2 py-0.5 text-[11px] font-medium">{getAdaptationStatusLabel(selectedAdaptation.status, locale)}</span>
                  </div>
                  <div className="text-sm text-[var(--text-1)]">{selectedAdaptation.title ?? selectedAdaptation.hook ?? ui.noChannelTitle}</div>
                  <div className="line-clamp-4 text-sm leading-7 text-[var(--text-2)]">{selectedAdaptation.body || ui.noChannelBody}</div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-[var(--text-2)]">{ui.chooseLeft}</div>
              )}
            </div>

            {/* Compliance check button — colocated! */}
            <Button variant="secondary" onClick={() => void runComplianceCheck()} disabled={pending !== null || !selectedAdaptation} className="w-full justify-center">
              {pending === "compliance" ? ui.runningCompliance : selectedAdaptation ? ui.runCompliance(getPlatformSurfaceMeta(selectedAdaptation.surface as PlatformSurface, locale).label) : ui.runComplianceIdle}
            </Button>

            {/* Compliance results — colocated! */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.complianceResult}</div>
                {latestCheckForSelected && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    latestCheckForSelected.needsReview
                      ? "bg-[var(--danger-bg,var(--surface-muted))] text-[var(--danger-text)]"
                      : "bg-[var(--ok-bg,var(--surface-muted))] text-[var(--ok-text)]"
                  }`}>
                    <span className={`inline-block size-1.5 rounded-full ${latestCheckForSelected.needsReview ? "bg-[var(--danger-text)]" : "bg-[var(--ok-text)]"}`} />
                    {latestCheckForSelected.needsReview ? ui.needsReview : ui.noRisk}
                  </span>
                )}
              </div>
              {latestCheckForSelected ? (
                <div className="mt-3 space-y-3">
                  <div className="text-sm leading-7 text-[var(--text-2)]">{latestCheckForSelected.summary ?? ui.noRiskSummary}</div>
                  {(() => {
                    const issues = Array.isArray(latestCheckForSelected.flaggedIssues) ? latestCheckForSelected.flaggedIssues : [];
                    if (!issues.length) return <div className="text-sm text-[var(--text-2)]">{ui.cleanHit}</div>;
                    return (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-[var(--danger-text)]">{ui.issueCount(issues.length)}</div>
                        {(issues as Array<{ type?: string; text?: string; reason?: string }>).slice(0, 6).map((item, index) => (
                          <div key={`${String(item?.type ?? "issue")}-${index}`} className="rounded-xl bg-[var(--surface-solid)] px-3 py-2 text-sm text-[var(--text-2)]">
                            <div className="font-medium text-[var(--text-1)]">{String(item?.type ?? ui.issueTypeFallback)} · {String(item?.text ?? ui.unnamedContent)}</div>
                            <div className="mt-1">{String(item?.reason ?? ui.issueReasonFallback)}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="mt-3 text-sm text-[var(--text-2)]">
                  {selectedAdaptation ? ui.noCheckYetSelected : ui.noCheckYet}
                </div>
              )}
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
