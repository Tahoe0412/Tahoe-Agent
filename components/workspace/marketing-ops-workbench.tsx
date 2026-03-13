"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { copyLengthList, getCopyLengthMeta, getUsageScenarioMeta, type CopyLength, type UsageScenario, usageScenarioList } from "@/lib/copy-goal";
import { getAdaptationStatusLabel, getPlatformSurfaceMeta, platformSurfaceList, type PlatformSurface } from "@/lib/platform-surface";
import type { StyleReferenceInsight } from "@/lib/style-reference";
import { getStyleTemplateMeta, type StyleTemplate, styleTemplateList } from "@/lib/style-template";
import { getWritingModeMeta, type WritingMode, writingModeList } from "@/lib/writing-mode";

type PromotionalCopyPayload = {
  generation_source?: string;
  quality_diagnosis?: {
    overall_score?: number;
    strengths?: string[];
    issues?: string[];
    rewrite_focus?: string[];
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

function fromLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean);
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

function parsePayload(value: unknown): PromotionalCopyPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  return {
    generation_source: typeof source.generation_source === "string" ? source.generation_source : undefined,
    quality_diagnosis: source.quality_diagnosis as PromotionalCopyPayload["quality_diagnosis"],
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

export function MarketingOpsWorkbench({
  projectId,
  marketingOverview,
  projectConfig,
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

  const activeBrandId = marketingOverview.brandProfile?.id;
  const activeSprintId = marketingOverview.latestSprint?.id;
  const writingMeta = getWritingModeMeta(writingMode, "zh");
  const styleMeta = getStyleTemplateMeta(styleTemplate, "zh");
  const copyLengthMeta = getCopyLengthMeta(copyLength, "zh");
  const usageScenarioMeta = getUsageScenarioMeta(usageScenario, "zh");
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
  const latestCheckForSelected = useMemo(
    () => marketingOverview.complianceChecks.find((item) => item.targetId === selectedAdaptationId),
    [marketingOverview.complianceChecks, selectedAdaptationId],
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
        throw new Error(response.ok ? "服务器返回了非 JSON 响应。" : `服务器返回了错误 (${response.status})，可能是请求超时。请稍后重试。`);
      }
      if (!payload.success) {
        throw new Error(payload.error?.detail || payload.error?.message || "操作失败。");
      }
      setMessage(successMessage);
      router.refresh();
      return payload;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "操作失败。");
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
      `写作模式已切换为“${getWritingModeMeta(next, "zh").label}”。`,
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
      `输出风格已切换为“${getStyleTemplateMeta(next, "zh").label}”。`,
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
      `文案长度已切换为“${getCopyLengthMeta(next, "zh").label}”。`,
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
      `使用场景已切换为“${getUsageScenarioMeta(next, "zh").label}”。`,
    );
  }

  async function generatePromotionalCopy() {
    const result = await request(`/api/projects/${projectId}/promotional-copy`, { method: "POST" }, "promo-copy", "宣传主稿已生成。");
    if (result) {
      setSelectedVersionId(null);
    }
  }

  async function diagnoseAndEnhanceCopy() {
    if (!masterAngle.trim() || !heroCopy.trim() || !longFormCopy.trim()) {
      setError("请先有一版主稿，再执行诊断与增强。");
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
      "主稿诊断与增强已完成，已生成新版本。",
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
      "宣传主稿已另存为新版本。",
    );
    if (result) {
      setSelectedVersionId(null);
    }
  }

  async function generateAdaptationFromDraft() {
    if (!longFormCopy.trim()) {
      setError("请先生成或填写宣传主稿正文，再做平台改写。");
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
      "平台版本已生成。",
    );
  }

  async function runComplianceCheck() {
    if (!selectedAdaptation) {
      setError("请先选择一条平台稿件。");
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
      "合规检查已完成。",
    );
  }

  return (
    <div className="space-y-6">
      <PanelCard title="快速流程" description="先选写法，再出一版主稿，再做平台稿和合规。高级编辑先收起来。">
        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">品牌</div>
            <div className="mt-2 text-base font-semibold text-[var(--text-1)]">{marketingOverview.brandProfile?.brandName ?? "未绑定"}</div>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">行业模板</div>
            <div className="mt-2 text-base font-semibold text-[var(--text-1)]">{marketingOverview.industryTemplate?.industryName ?? "未绑定"}</div>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">主稿版本</div>
            <div className="mt-2 text-base font-semibold text-[var(--text-1)]">{versions.length}</div>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">平台稿 / 合规</div>
            <div className="mt-2 text-base font-semibold text-[var(--text-1)]">{marketingOverview.platformAdaptations.length} / {marketingOverview.complianceChecks.length}</div>
          </div>
        </div>

        {!marketingOverview.brandProfile || !marketingOverview.industryTemplate ? (
          <div className="mb-5 rounded-[18px] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm leading-7 text-[var(--warning-text)]">
            当前项目还没有完整绑定品牌档案或行业模板。这样生成的主稿会更容易泛化，风格也更难稳定。要测试高质量结果，建议至少先补齐品牌定位、品牌语气、禁止表达和行业边界。
          </div>
        ) : null}

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm font-medium text-[var(--text-2)]">写作模式</div>
            <select
              value={writingMode}
              onChange={(event) => void updateWritingMode(event.target.value as WritingMode)}
              className="theme-input w-full rounded-[16px] px-4 py-3 text-sm"
              disabled={pending !== null}
            >
              {writingModeList.map((mode) => (
                <option key={mode} value={mode}>
                  {getWritingModeMeta(mode, "zh").label}
                </option>
              ))}
            </select>
            <div className="text-sm text-[var(--text-2)]">{writingMeta.description}</div>
          </label>
          <label className="space-y-2">
            <div className="text-sm font-medium text-[var(--text-2)]">输出风格</div>
            <select
              value={styleTemplate}
              onChange={(event) => void updateStyleTemplate(event.target.value as StyleTemplate)}
              className="theme-input w-full rounded-[16px] px-4 py-3 text-sm"
              disabled={pending !== null}
            >
              {styleTemplateList.map((style) => (
                <option key={style} value={style}>
                  {getStyleTemplateMeta(style, "zh").label}
                </option>
              ))}
            </select>
            <div className="text-sm text-[var(--text-2)]">{styleMeta.description}</div>
          </label>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm font-medium text-[var(--text-2)]">文案长度</div>
            <select
              value={copyLength}
              onChange={(event) => void updateCopyLength(event.target.value as CopyLength)}
              className="theme-input w-full rounded-[16px] px-4 py-3 text-sm"
              disabled={pending !== null}
            >
              {copyLengthList.map((item) => (
                <option key={item} value={item}>
                  {getCopyLengthMeta(item, "zh").label}
                </option>
              ))}
            </select>
            <div className="text-sm text-[var(--text-2)]">{copyLengthMeta.description}</div>
          </label>
          <label className="space-y-2">
            <div className="text-sm font-medium text-[var(--text-2)]">使用场景</div>
            <select
              value={usageScenario}
              onChange={(event) => void updateUsageScenario(event.target.value as UsageScenario)}
              className="theme-input w-full rounded-[16px] px-4 py-3 text-sm"
              disabled={pending !== null}
            >
              {usageScenarioList.map((item) => (
                <option key={item} value={item}>
                  {getUsageScenarioMeta(item, "zh").label}
                </option>
              ))}
            </select>
            <div className="text-sm text-[var(--text-2)]">{usageScenarioMeta.description}</div>
          </label>
        </div>

        {styleReferenceSample ? (
          <div className="mb-5 rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">风格参照</div>
            <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">当前项目已附带参考样稿。生成主稿时会学习它的语气、节奏和结构，但不会直接照抄内容。可在顶部“编辑项目信息”里继续补充。</div>
            {styleReferenceInsight ? (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-[var(--surface-solid)] px-3 py-3 text-sm leading-7 text-[var(--text-2)]">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">标题风格</div>
                  {styleReferenceInsight.titleStyleLines.map((line) => (
                    <div key={line}>• {line}</div>
                  ))}
                </div>
                <div className="rounded-xl bg-[var(--surface-solid)] px-3 py-3 text-sm leading-7 text-[var(--text-2)]">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">开头风格</div>
                  {styleReferenceInsight.openingStyleLines.map((line) => (
                    <div key={line}>• {line}</div>
                  ))}
                </div>
                <div className="rounded-xl bg-[var(--surface-solid)] px-3 py-3 text-sm leading-7 text-[var(--text-2)]">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">正文节奏</div>
                  {styleReferenceInsight.bodyRhythmLines.map((line) => (
                    <div key={line}>• {line}</div>
                  ))}
                </div>
              </div>
            ) : null}
            {styleReferenceInsight ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {styleReferenceInsight.summaryLines.map((line) => (
                  <div key={line} className="rounded-xl bg-[var(--surface-solid)] px-3 py-2 text-sm leading-7 text-[var(--text-2)]">
                    {line}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-[var(--text-2)]">{styleReferenceSample}</div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void generatePromotionalCopy()} disabled={pending !== null}>
            {pending === "promo-copy" ? "生成中..." : "生成宣传主稿"}
          </Button>
          <Button variant="secondary" onClick={() => void diagnoseAndEnhanceCopy()} disabled={pending !== null}>
            {pending === "enhance-copy" ? "增强中..." : "诊断并增强主稿"}
          </Button>
          <Button variant="secondary" onClick={() => void savePromotionalCopyVersion()} disabled={pending !== null}>
            {pending === "save-copy" ? "保存中..." : "另存为新版本"}
          </Button>
          <Button variant="secondary" onClick={() => void generateAdaptationFromDraft()} disabled={pending !== null}>
            {pending === "quick-adapt" ? "生成中..." : "从当前主稿生成平台稿"}
          </Button>
          <Button variant="secondary" onClick={() => void runComplianceCheck()} disabled={pending !== null}>
            {pending === "compliance" ? "检查中..." : "对选中平台稿执行合规检查"}
          </Button>
        </div>
        {message ? <div className="mt-4 text-sm text-[var(--ok-text)]">{message}</div> : null}
        {error ? <div className="mt-4 text-sm text-[var(--danger-text)]">{error}</div> : null}
      </PanelCard>

      <PanelCard title="当前主稿" description="默认只聚焦当前成稿，版本对比和平台稿细节后移。">
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-[1fr_0.62fr]">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">版本标题</label>
                <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="theme-input w-full rounded-[16px] px-4 py-3 text-sm" placeholder="例如：宣传文案主稿 v3" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">主宣传角度</label>
                <input value={masterAngle} onChange={(event) => setMasterAngle(event.target.value)} className="theme-input w-full rounded-[16px] px-4 py-3 text-sm" placeholder="本轮传播要主打的商业角度" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">开场摘要</label>
              <textarea value={heroCopy} onChange={(event) => setHeroCopy(event.target.value)} rows={4} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="一段能直接拿去做宣传开头的摘要" />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">完整宣传主稿</label>
              <textarea value={longFormCopy} onChange={(event) => setLongFormCopy(event.target.value)} rows={14} className="theme-input w-full rounded-[22px] px-4 py-4 text-sm leading-8" placeholder="完整宣传文案正文" />
            </div>

            {selectedVersion ? (() => {
              const payload = parsePayload(selectedVersion.taskJson);
              const diagnosis = payload?.quality_diagnosis;
              if (!diagnosis) return null;
              return (
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">质量诊断</div>
                      <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{diagnosis.summary ?? "当前版本已有质量诊断。"}</div>
                    </div>
                    {typeof diagnosis.overall_score === "number" ? (
                      <div className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-1)]">
                        质量分 {diagnosis.overall_score}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-[var(--surface-solid)] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">当前优点</div>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-2)]">
                        {(diagnosis.strengths ?? []).map((item) => (
                          <div key={item}>• {item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-solid)] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">主要问题</div>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-2)]">
                        {(diagnosis.issues ?? []).map((item) => (
                          <div key={item}>• {item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-solid)] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">增强重点</div>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-2)]">
                        {(diagnosis.rewrite_focus ?? []).map((item) => (
                          <div key={item}>• {item}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : null}

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowAdvanced((value) => !value)}>
                {showAdvanced ? "收起高级编辑" : "展开高级编辑"}
              </Button>
            </div>

            {showAdvanced ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">标题备选</label>
                    <textarea value={headlineOptions} onChange={(event) => setHeadlineOptions(event.target.value)} rows={5} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="每行一条标题" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">核心卖点 / 证据点</label>
                    <textarea value={proofPoints} onChange={(event) => setProofPoints(event.target.value)} rows={5} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="每行一条证明点或卖点" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">CTA</label>
                    <textarea value={callToAction} onChange={(event) => setCallToAction(event.target.value)} rows={3} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="引导用户下一步动作" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">风险提示</label>
                    <textarea value={riskNotes} onChange={(event) => setRiskNotes(event.target.value)} rows={3} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="每行一条风险提示" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">下一步建议</label>
                    <textarea value={recommendedNextSteps} onChange={(event) => setRecommendedNextSteps(event.target.value)} rows={3} className="theme-input w-full rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="每行一条下一步动作" />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </PanelCard>

      <Disclosure
        className="theme-panel rounded-[24px] p-4"
        summaryClassName="text-sm font-medium text-[var(--text-1)]"
        contentClassName="mt-4 space-y-6"
        title="查看版本对比、平台稿和合规细节"
      >
          <PanelCard title="主稿版本栏" description="只在需要比较和回退时再展开。">
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
                      className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
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
                                  try { p = JSON.parse(text); } catch { throw new Error("服务器返回了非 JSON 响应"); }
                                  if (!p.success) throw new Error(p.error?.message ?? "删除失败");
                                  if (selectedVersionId === item.id) setSelectedVersionId(null);
                                  setMessage("版本已删除。");
                                  router.refresh();
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "删除失败");
                                }
                              })();
                            }}
                          >{deleteArmedId === item.id ? "确认删除" : "✕"}</span>
                        </div>
                      </div>
                      <div className="mt-2 line-clamp-2 text-sm text-[var(--text-2)]">{payload?.hero_copy ?? item.summary ?? "暂无摘要"}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-3)]">
                        <span>{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
                        {payload?.generation_source ? <span className="theme-pill rounded-full px-2 py-1 text-[11px] font-medium">{payload.generation_source}</span> : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-2)]">
                  还没有宣传主稿版本。先点击“生成宣传主稿”。
                </div>
              )}
            </div>
          </PanelCard>

          <div className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
            <PanelCard title="平台稿件" description="需要发布前，再从当前主稿派生平台版本。">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <select value={adaptSurface} onChange={(event) => setAdaptSurface(event.target.value as PlatformSurface)} className="theme-input rounded-[16px] px-4 py-3 text-sm">
                    {platformSurfaceList.map((item) => (
                      <option key={item} value={item}>{getPlatformSurfaceMeta(item, "zh").label}</option>
                    ))}
                  </select>
                  <span className="text-sm text-[var(--text-2)]">当前生成平台：{getPlatformSurfaceMeta(adaptSurface, "zh").label}</span>
                </div>
                <div className="grid gap-3">
                  {marketingOverview.platformAdaptations.length ? (
                    marketingOverview.platformAdaptations.map((item) => {
                      const active = item.id === selectedAdaptationId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedAdaptationId(item.id)}
                          className={`w-full rounded-[18px] border px-4 py-4 text-left transition ${
                            active
                              ? "border-[var(--accent-strong)] bg-[var(--surface-muted)]"
                              : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-[var(--text-1)]">
                              {getPlatformSurfaceMeta(item.surface as PlatformSurface, "zh").label}
                            </div>
                            <span className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{getAdaptationStatusLabel(item.status, "zh")}</span>
                          </div>
                          <div className="mt-2 text-sm text-[var(--text-1)]">{item.title ?? item.hook ?? "未填写标题或开场句"}</div>
                          <div className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--text-2)]">{item.body}</div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-2)]">
                      还没有平台稿件。先从当前主稿生成一个平台版本。
                    </div>
                  )}
                </div>
              </div>
            </PanelCard>

            <PanelCard title="合规检查与执行快照" description="默认后移，需要发布前再展开复核。">
              <div className="space-y-4">
                <div className="theme-panel-muted rounded-[18px] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">当前选中平台稿</div>
                  {selectedAdaptation ? (
                    <div className="mt-3 space-y-2">
                      <div className="font-medium text-[var(--text-1)]">
                        {getPlatformSurfaceMeta(selectedAdaptation.surface as PlatformSurface, "zh").label}
                      </div>
                      <div className="text-sm text-[var(--text-1)]">{selectedAdaptation.title ?? selectedAdaptation.hook ?? "未填写标题或开场句"}</div>
                      <div className="text-sm leading-7 text-[var(--text-2)]">{selectedAdaptation.body}</div>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-[var(--text-2)]">请先从左侧选择一条平台稿件。</div>
                  )}
                </div>

                <div className="theme-panel-muted rounded-[18px] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">最新检查结果</div>
                  {latestCheckForSelected ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{getAdaptationStatusLabel(latestCheckForSelected.status, "zh")}</span>
                        {latestCheckForSelected.needsReview ? <span className="text-xs text-[var(--danger-text)]">需要人工复核</span> : null}
                      </div>
                      <div className="text-sm leading-7 text-[var(--text-2)]">{latestCheckForSelected.summary ?? "暂无风险总结。"}</div>
                      {Array.isArray(latestCheckForSelected.flaggedIssues) && latestCheckForSelected.flaggedIssues.length ? (
                        <div className="space-y-2">
                          {(latestCheckForSelected.flaggedIssues as Array<{ type?: string; text?: string; reason?: string }>).slice(0, 6).map((item, index) => (
                            <div key={`${item.type ?? "issue"}-${index}`} className="rounded-[14px] bg-[var(--surface-solid)] px-3 py-2 text-sm text-[var(--text-2)]">
                              <div className="font-medium text-[var(--text-1)]">{item.type ?? "风险项"} · {item.text ?? "未命名内容"}</div>
                              <div className="mt-1">{item.reason ?? "需要人工进一步判断。"}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[var(--text-2)]">未命中明显风险。</div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-[var(--text-2)]">当前平台稿还没有检查记录。</div>
                  )}
                </div>
              </div>
            </PanelCard>
          </div>
      </Disclosure>
    </div>
  );
}
