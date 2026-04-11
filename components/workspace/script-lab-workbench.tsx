"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
import { ErrorNotice } from "@/components/ui/error-notice";
import { PanelCard } from "@/components/ui/panel-card";
import { Tag } from "@/components/ui/tag";
import { assessPublishCopy, assessScenePrompt, assessVideoTitlePack } from "@/lib/artifact-quality";
import { normalizeAudiencePanelReview, type AudiencePanelReview } from "@/lib/copy-review-panel";
import { getOutputKnowledgePack, reviewOutputArtifact } from "@/lib/output-artifact-guidance";
import { apiRequest } from "@/lib/client-api";
import { normalizeStringList, normalizeString, normalizeArtifactReview, copyToClipboard } from "@/lib/utils";

type ScriptLabRow = {
  id: string;
  sceneOrder: number;
  originalText: string;
  rewritten: string;
  shotGoal: string;
  durationSec: number;
  visualPriority: string[];
  avoid: string[];
  labels: string[];
  classification: {
    humanType: string;
    motionType: string;
    lipSyncType: string;
    assetDependencyType: string;
    productionClass: string;
    difficultyScore: number;
    riskFlags: string[];
  } | null;
  assets: string[];
  assetReady: boolean;
  missingAssets: string[];
  uploadedAssets: Array<{
    id: string;
    type: string;
    fileName: string;
    continuityGroup: string | null;
    fileUrl?: string | null;
  }>;
  continuityGroup: string;
};

type OutputArtifact = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string | Date;
  taskJson: unknown;
};

type MarsOutputs = {
  latestVideoTitlePack: OutputArtifact | null;
  videoTitlePacks: OutputArtifact[];
  latestPublishCopy: OutputArtifact | null;
  publishCopyPacks: OutputArtifact[];
};

type ScriptDraftPreview = {
  id: string;
  title: string | null;
  originalText: string;
  structuredOutput: unknown;
  rawPayload: unknown;
  modelName: string | null;
  sourceType: string;
  createdAt: string | Date;
  versionNumber?: number;
};



function renderAudiencePanel(panel: AudiencePanelReview | null, empty: string) {
  if (!panel) {
    return <div className="mt-3 text-sm leading-6 text-[var(--text-2)]">{empty}</div>;
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{`平均分 ${panel.averageScore}`}</Tag>
        <Tag>{`媒体贴合度 ${panel.styleFitScore}`}</Tag>
        <Tag tone={panel.publishReadiness === "READY" ? "success" : "danger"}>{panel.publishReadiness === "READY" ? "可继续发布" : "先修再发"}</Tag>
      </div>
      <div className="text-sm leading-6 text-[var(--text-1)]">{panel.overallVerdict}</div>
      <div className="text-sm leading-6 text-[var(--text-2)]">{panel.calibrationSummary}</div>
      <div className="space-y-2">
        {panel.reviewers.map((reviewer) => (
          <div key={reviewer.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--text-1)]">{reviewer.label}</div>
              <span className="text-sm font-semibold text-[var(--text-1)]">{reviewer.score}</span>
            </div>
            <div className="mt-1 text-sm leading-6 text-[var(--text-2)]">{reviewer.verdict}</div>
            {reviewer.concerns.length ? (
              <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                {reviewer.concerns.slice(0, 2).map((item) => (
                  <div key={item}>- {item}</div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}





function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="theme-panel-muted rounded-[22px] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{label}</div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-1)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--text-2)]">{caption}</div>
    </div>
  );
}

export function ScriptLabWorkbench({
  projectId,
  rows,
  marsOutputs,
  latestDraftPreview,
}: {
  projectId: string;
  rows: ScriptLabRow[];
  marsOutputs: MarsOutputs;
  latestDraftPreview?: ScriptDraftPreview | null;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [rewritten, setRewritten] = useState(rows[0]?.rewritten ?? "");
  const [shotGoal, setShotGoal] = useState(rows[0]?.shotGoal ?? "");
  const [visualPriority, setVisualPriority] = useState(rows[0]?.visualPriority.join(", ") ?? "");
  const [avoid, setAvoid] = useState(rows[0]?.avoid.join(", ") ?? "");
  const [continuityGroup, setContinuityGroup] = useState(rows[0]?.continuityGroup ?? "");
  const [durationSec, setDurationSec] = useState(rows[0]?.durationSec ?? 6);
  const [pending, setPending] = useState<"save" | "classify" | "assets" | null>(null);
  const [lastAction, setLastAction] = useState<"save" | "classify" | "assets" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recommendedTitle, setRecommendedTitle] = useState("");
  const [titleAngleSummary, setTitleAngleSummary] = useState("");
  const [titleOptionsText, setTitleOptionsText] = useState("");
  const [publishPrimaryTitle, setPublishPrimaryTitle] = useState("");
  const [publishLeadIn, setPublishLeadIn] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishHighlightsText, setPublishHighlightsText] = useState("");
  const [publishCta, setPublishCta] = useState("");
  const [artifactPending, setArtifactPending] = useState<"title" | "publish" | null>(null);

  const selectedScene = useMemo(() => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null, [rows, selectedId]);
  const latestVideoTitlePayload = (marsOutputs.latestVideoTitlePack?.taskJson as Record<string, unknown> | null) ?? null;
  const latestPublishCopyPayload = (marsOutputs.latestPublishCopy?.taskJson as Record<string, unknown> | null) ?? null;
  const hasTitlePack = Boolean(marsOutputs.latestVideoTitlePack);
  const hasPublishCopy = Boolean(marsOutputs.latestPublishCopy);
  const titleKnowledgeNotes = normalizeStringList(latestVideoTitlePayload?.knowledge_notes);
  const publishKnowledgeNotes = normalizeStringList(latestPublishCopyPayload?.knowledge_notes);
  const titleAudiencePanel = normalizeAudiencePanelReview(latestVideoTitlePayload?.audience_panel_review);
  const publishAudiencePanel = normalizeAudiencePanelReview(latestPublishCopyPayload?.audience_panel_review);
  const latestDraftStructured = (latestDraftPreview?.structuredOutput as Record<string, unknown> | null) ?? null;
  const latestDraftAudiencePanel = normalizeAudiencePanelReview(latestDraftStructured?.audience_panel_review);
  const latestDraftSections = {
    title: normalizeString(latestDraftStructured?.title) || latestDraftPreview?.title || "",
    opening: normalizeString(latestDraftStructured?.opening),
    body: normalizeString(latestDraftStructured?.body),
    closing: normalizeString(latestDraftStructured?.closing),
  };
  const titleArtifactReview =
    normalizeArtifactReview(latestVideoTitlePayload?.artifact_review) ??
    (hasTitlePack ? reviewOutputArtifact("VIDEO_TITLE", latestVideoTitlePayload ?? {}) : null);
  const publishArtifactReview =
    normalizeArtifactReview(latestPublishCopyPayload?.artifact_review) ??
    (hasPublishCopy ? reviewOutputArtifact("PUBLISH_COPY", latestPublishCopyPayload ?? {}) : null);
  const readySceneCount = rows.filter((row) => row.assetReady).length;
  const totalRiskFlags = rows.reduce((count, row) => count + (row.classification?.riskFlags.length ?? 0), 0);
  const promptReadySceneCount = rows.filter((row) => {
    const hasVisualPriority = row.visualPriority.length > 0;
    const hasAvoid = row.avoid.length > 0;
    const hasContinuity = row.continuityGroup.trim().length > 0;
    const rewrittenLongEnough = row.rewritten.trim().length >= 40;
    return hasVisualPriority && hasAvoid && hasContinuity && rewrittenLongEnough;
  }).length;
  const scriptFeedback = useMemo(() => {
    const completed: string[] = [];
    if (rows.length > 0) completed.push(`已拆出 ${rows.length} 个镜头单元`);
    if (hasTitlePack) completed.push("标题包已生成");
    if (hasPublishCopy) completed.push("发布文案已生成");

    let weakest = "先继续把镜头文本改到更清楚、更可执行。";
    let next = "从左侧挑一条最关键镜头开始细修，然后补跑分类或素材分析。";

    if (latestDraftAudiencePanel?.reviewers?.length && latestDraftAudiencePanel.publishReadiness !== "READY") {
      const weakestReviewer = [...latestDraftAudiencePanel.reviewers].sort((a, b) => a.score - b.score)[0];
      weakest = weakestReviewer?.concerns?.slice(0, 2).join("；") || "主稿还不够像一篇能直接发布的内容。";
      next = weakestReviewer?.nextAction || "先修主稿的信息密度、证据感和段落推进，再处理包装。";
    } else if (!hasTitlePack) {
      weakest = "还缺少内容标题包，发布包装没有闭环。";
      next = "回总览页点“内容标题”，拿到第一版标题包后再回这里微调。";
    } else if (!hasPublishCopy) {
      weakest = "还缺少发布文案，发布层还不完整。";
      next = "回总览页点“发布文案”，补出可直接发布的一版说明文案。";
    } else if (publishAudiencePanel?.reviewers?.length && publishAudiencePanel.publishReadiness !== "READY") {
      const weakestReviewer = [...publishAudiencePanel.reviewers].sort((a, b) => a.score - b.score)[0];
      weakest = weakestReviewer?.concerns?.slice(0, 2).join("；") || "模拟观众判断当前发布包装还不适合直接发。";
      next = weakestReviewer?.nextAction || "先解决掉分最严重的观众异议，再继续下游工作。";
    } else if (titleAudiencePanel?.reviewers?.length && titleAudiencePanel.publishReadiness !== "READY") {
      const weakestReviewer = [...titleAudiencePanel.reviewers].sort((a, b) => a.score - b.score)[0];
      weakest = weakestReviewer?.concerns?.slice(0, 2).join("；") || "模拟观众判断当前标题包还不够能停住人。";
      next = weakestReviewer?.nextAction || "先补强标题钩子和区分度，再继续推进。";
    } else if (readySceneCount < rows.length) {
      weakest = `还有 ${rows.length - readySceneCount} 个镜头没到可执行状态。`;
      next = "优先处理待补素材的条目，把这条内容推进到可做配图说明 / 图片生产。";
    } else if (promptReadySceneCount < rows.length) {
      weakest = `还有 ${rows.length - promptReadySceneCount} 个镜头不够适合 Nano Banana / Seedance / Veo 的后续生成。`;
      next = "补齐连续性锚点、视觉重点和 avoid 标签，确保每镜头都是单主体、单动作、清晰环境。";
    } else if (totalRiskFlags > 0) {
      weakest = `当前还有 ${totalRiskFlags} 个风险标记需要复核。`;
      next = "先检查高风险镜头的动作、口型和素材依赖，再决定是否进入下游生成。";
    } else {
      weakest = "主稿、发布包装和配图提示词都比较完整，可以进入配图说明 / 图片生产。";
      next = "继续去配图说明或图片生产页，把这条内容推进到图片生产阶段。";
    }

    return {
      completed: completed.join(" · ") || "脚本工作区已准备好。",
      weakest,
      next,
    };
  }, [hasPublishCopy, hasTitlePack, latestDraftAudiencePanel, promptReadySceneCount, publishAudiencePanel, readySceneCount, rows.length, titleAudiencePanel, totalRiskFlags]);
  const titleQualityAlerts = useMemo(
    () =>
      hasTitlePack
        ? assessVideoTitlePack({
            recommendedTitle,
            titleOptions: titleOptionsText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          })
        : [],
    [hasTitlePack, recommendedTitle, titleOptionsText],
  );
  const publishQualityAlerts = useMemo(
    () =>
      hasPublishCopy
        ? assessPublishCopy({
            leadIn: publishLeadIn,
            description: publishDescription,
            highlights: publishHighlightsText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
            cta: publishCta,
          })
        : [],
    [hasPublishCopy, publishCta, publishDescription, publishHighlightsText, publishLeadIn],
  );
  const selectedSceneQualityAlerts = useMemo(
    () =>
      assessScenePrompt({
        rewritten,
        shotGoal,
        visualPriority: visualPriority
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        avoid: avoid
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        continuityGroup,
      }),
    [avoid, continuityGroup, rewritten, shotGoal, visualPriority],
  );

  useEffect(() => {
    setRecommendedTitle(
      normalizeString(latestVideoTitlePayload?.recommended_title) ||
        marsOutputs.latestVideoTitlePack?.summary ||
        marsOutputs.latestVideoTitlePack?.title ||
        "",
    );
    setTitleAngleSummary(normalizeString(latestVideoTitlePayload?.angle_summary));
    setTitleOptionsText(normalizeStringList(latestVideoTitlePayload?.title_options).join("\n"));
  }, [latestVideoTitlePayload, marsOutputs.latestVideoTitlePack]);

  useEffect(() => {
    setPublishPrimaryTitle(normalizeString(latestPublishCopyPayload?.primary_title) || marsOutputs.latestPublishCopy?.title || "");
    setPublishLeadIn(normalizeString(latestPublishCopyPayload?.lead_in));
    setPublishDescription(normalizeString(latestPublishCopyPayload?.video_description));
    setPublishHighlightsText(normalizeStringList(latestPublishCopyPayload?.highlights).join("\n"));
    setPublishCta(normalizeString(latestPublishCopyPayload?.publish_cta));
  }, [latestPublishCopyPayload, marsOutputs.latestPublishCopy]);

  function syncWithScene(sceneId: string) {
    const scene = rows.find((row) => row.id === sceneId);
    if (!scene) {
      return;
    }

    setSelectedId(scene.id);
    setRewritten(scene.rewritten);
    setShotGoal(scene.shotGoal);
    setVisualPriority(scene.visualPriority.join(", "));
    setAvoid(scene.avoid.join(", "));
    setContinuityGroup(scene.continuityGroup);
    setDurationSec(scene.durationSec);
    setMessage(null);
    setError(null);
  }

  async function saveScene() {
    if (!selectedScene) {
      return;
    }

    setPending("save");
    setLastAction("save");
    setMessage(null);
    setError(null);

    try {
      await apiRequest(`/api/projects/${projectId}/scenes/${selectedScene.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rewritten_for_ai: rewritten,
          shot_goal: shotGoal,
          continuity_group: continuityGroup,
          duration_sec: durationSec,
          visual_priority: visualPriority
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          avoid: avoid
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      setMessage("Scene 已保存。");
      router.refresh();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(null);
    }
  }

  async function rerunClassification() {
    if (!selectedScene) {
      return;
    }

    setPending("classify");
    setLastAction("classify");
    setMessage(null);
    setError(null);

    try {
      await apiRequest(`/api/projects/${projectId}/scenes/${selectedScene.id}/classify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rewritten_for_ai: rewritten,
        }),
      });

      setMessage("分类已重跑。");
      router.refresh();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(null);
    }
  }

  async function rerunAssets() {
    if (!selectedScene) {
      return;
    }

    setPending("assets");
    setLastAction("assets");
    setMessage(null);
    setError(null);

    try {
      await apiRequest(`/api/projects/${projectId}/scenes/${selectedScene.id}/assets/analyze`, {
        method: "POST",
      });

      setMessage("素材依赖已重算。");
      router.refresh();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(null);
    }
  }

  async function copyVideoTitlePack() {
    if (!marsOutputs.latestVideoTitlePack) {
      return;
    }

    const recommendedTitle =
      normalizeString(latestVideoTitlePayload?.recommended_title) ||
      marsOutputs.latestVideoTitlePack.summary ||
      marsOutputs.latestVideoTitlePack.title;
    const angleSummary = normalizeString(latestVideoTitlePayload?.angle_summary);
    const titleOptions = normalizeStringList(latestVideoTitlePayload?.title_options);
    const text = [
      `推荐标题：${recommendedTitle}`,
      angleSummary ? `角度说明：${angleSummary}` : "",
      titleOptions.length ? `备选标题：\n${titleOptions.map((item) => `- ${item}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await copyToClipboard(text);
      setMessage("标题包已复制。");
      setError(null);
    } catch (requestError) {
      setError(requestError);
    }
  }

  async function copyPublishCopy() {
    if (!marsOutputs.latestPublishCopy) {
      return;
    }

    const primaryTitle = normalizeString(latestPublishCopyPayload?.primary_title) || marsOutputs.latestPublishCopy.title;
    const leadIn = normalizeString(latestPublishCopyPayload?.lead_in);
    const description = normalizeString(latestPublishCopyPayload?.video_description);
    const highlights = normalizeStringList(latestPublishCopyPayload?.highlights);
    const publishCta = normalizeString(latestPublishCopyPayload?.publish_cta);
    const text = [
      primaryTitle,
      leadIn,
      description,
      highlights.length ? `亮点：\n${highlights.map((item) => `- ${item}`).join("\n")}` : "",
      publishCta ? `CTA：${publishCta}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await copyToClipboard(text);
      setMessage("发布文案已复制。");
      setError(null);
    } catch (requestError) {
      setError(requestError);
    }
  }

  async function saveVideoTitlePack() {
    const titleOptions = titleOptionsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!recommendedTitle.trim()) {
      setError(new Error("请先填写推荐标题。"));
      return;
    }

    setArtifactPending("title");
    setMessage(null);
    setError(null);

    try {
      await apiRequest(`/api/projects/${projectId}/strategy-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_type: "SCRIPT",
          task_status: "DONE",
          task_title: `内容标题包 · ${recommendedTitle.trim()}`,
          task_summary: recommendedTitle.trim(),
          priority_score: 84,
          task_json: {
            kind: "VIDEO_TITLE_PACK",
            output_type: "VIDEO_TITLE",
            generated_at: new Date().toISOString(),
            recommended_title: recommendedTitle.trim(),
            angle_summary: titleAngleSummary.trim(),
            title_options: titleOptions.length ? titleOptions : [recommendedTitle.trim()],
            edited_in_place: true,
          },
        }),
      });
      setMessage("标题包已另存为新版本。");
      router.refresh();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setArtifactPending(null);
    }
  }

  async function savePublishCopyPack() {
    const highlights = publishHighlightsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!publishPrimaryTitle.trim() || !publishDescription.trim()) {
      setError(new Error("请先填写发布标题和正文。"));
      return;
    }

    setArtifactPending("publish");
    setMessage(null);
    setError(null);

    try {
      await apiRequest(`/api/projects/${projectId}/strategy-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_type: "SCRIPT",
          task_status: "DONE",
          task_title: `发布文案 · ${publishPrimaryTitle.trim()}`,
          task_summary: publishLeadIn.trim() || publishPrimaryTitle.trim(),
          priority_score: 82,
          task_json: {
            kind: "PUBLISH_COPY",
            output_type: "PUBLISH_COPY",
            generated_at: new Date().toISOString(),
            primary_title: publishPrimaryTitle.trim(),
            lead_in: publishLeadIn.trim(),
            video_description: publishDescription.trim(),
            highlights,
            publish_cta: publishCta.trim(),
            edited_in_place: true,
          },
        }),
      });
      setMessage("发布文案已另存为新版本。");
      router.refresh();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setArtifactPending(null);
    }
  }

  const [showShotEditor, setShowShotEditor] = useState(false);

  if (!selectedScene) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ── Section 1: Title Pack + Publish Copy (primary area) ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard title="内容标题包" description="编辑推荐标题和备选标题，用于图文发布包装。">
          <div className="space-y-4">
            {marsOutputs.latestVideoTitlePack ? (
              <div className="theme-panel-muted rounded-[24px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">推荐标题</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => void copyVideoTitlePack()}>
                      复制标题包
                    </Button>
                    <Button variant="secondary" className="h-auto px-3 py-1.5 text-xs" onClick={() => void saveVideoTitlePack()} disabled={artifactPending !== null}>
                      {artifactPending === "title" ? "保存中..." : "另存新版本"}
                    </Button>
                    <Tag>{new Date(marsOutputs.latestVideoTitlePack.createdAt).toLocaleString("zh-CN")}</Tag>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">推荐标题</div>
                    <input value={recommendedTitle} onChange={(event) => setRecommendedTitle(event.target.value)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">角度说明</div>
                    <textarea value={titleAngleSummary} onChange={(event) => setTitleAngleSummary(event.target.value)} rows={3} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">备选标题</div>
                    <textarea value={titleOptionsText} onChange={(event) => setTitleOptionsText(event.target.value)} rows={4} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">创作知识</div>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                        {(titleKnowledgeNotes.length ? titleKnowledgeNotes : getOutputKnowledgePack("VIDEO_TITLE").knowledgeNotes).map((item) => (
                          <div key={item}>- {item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">系统复核</div>
                      <div className="mt-3 text-sm leading-6 text-[var(--text-1)]">{titleArtifactReview?.summary ?? "当前版本还没有复核结果。"}</div>
                      {titleArtifactReview?.issues.length ? (
                        <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                          {titleArtifactReview.issues.slice(0, 3).map((item) => (
                            <div key={item}>- {item}</div>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">观众评分</div>
                      {renderAudiencePanel(titleAudiencePanel, "系统完成第二轮复核后，这里会出现多观众评分。")}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border)] p-4 text-sm leading-7 text-[var(--text-2)]">
                还没有生成标题包。回到总览页点一下“内容标题”就能补上。
              </div>
            )}
          </div>
        </PanelCard>

        <PanelCard title="发布文案" description="保留一版可直接复制到抖音、小红书或视频简介区的发布文案。">
          {marsOutputs.latestPublishCopy ? (
            <div className="space-y-4">
              <div className="theme-panel-muted rounded-[24px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">当前版本</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => void copyPublishCopy()}>
                      复制发布文案
                    </Button>
                    <Button variant="secondary" className="h-auto px-3 py-1.5 text-xs" onClick={() => void savePublishCopyPack()} disabled={artifactPending !== null}>
                      {artifactPending === "publish" ? "保存中..." : "另存新版本"}
                    </Button>
                    <Tag>{new Date(marsOutputs.latestPublishCopy.createdAt).toLocaleString("zh-CN")}</Tag>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">发布标题</div>
                    <input value={publishPrimaryTitle} onChange={(event) => setPublishPrimaryTitle(event.target.value)} className="theme-input w-full rounded-xl px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">导语</div>
                    <textarea value={publishLeadIn} onChange={(event) => setPublishLeadIn(event.target.value)} rows={3} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">发布正文</div>
                    <textarea value={publishDescription} onChange={(event) => setPublishDescription(event.target.value)} rows={6} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">亮点</div>
                      <textarea value={publishHighlightsText} onChange={(event) => setPublishHighlightsText(event.target.value)} rows={4} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">CTA</div>
                      <textarea value={publishCta} onChange={(event) => setPublishCta(event.target.value)} rows={4} className="theme-input w-full rounded-2xl px-4 py-3 text-sm leading-7" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">创作知识</div>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                        {(publishKnowledgeNotes.length ? publishKnowledgeNotes : getOutputKnowledgePack("PUBLISH_COPY").knowledgeNotes).map((item) => (
                          <div key={item}>- {item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">系统复核</div>
                      <div className="mt-3 text-sm leading-6 text-[var(--text-1)]">{publishArtifactReview?.summary ?? "当前版本还没有复核结果。"}</div>
                      {publishArtifactReview?.issues.length ? (
                        <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                          {publishArtifactReview.issues.slice(0, 3).map((item) => (
                            <div key={item}>- {item}</div>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">观众评分</div>
                      {renderAudiencePanel(publishAudiencePanel, "系统完成第二轮复核后，这里会出现多观众评分。")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border)] p-4 text-sm leading-7 text-[var(--text-2)]">
              还没有生成发布文案。回到总览页点一下"发布文案"就能补上。
            </div>
          )}
        </PanelCard>
      </div>

      {/* ── Section 2: Summary cards ── */}
      <PanelCard title="当前判断" description="这条内容已经到哪一步、最该补哪里、下一步怎么继续。">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="theme-panel-muted rounded-[22px] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">已完成</div>
            <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{scriptFeedback.completed}</div>
          </div>
          <div className="theme-panel-muted rounded-[22px] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">当前最弱处</div>
            <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{scriptFeedback.weakest}</div>
          </div>
          <div className="theme-panel-muted rounded-[22px] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">建议下一步</div>
            <div className="mt-3 text-sm leading-7 text-[var(--text-1)]">{scriptFeedback.next}</div>
          </div>
        </div>
      </PanelCard>

      {latestDraftPreview && (latestDraftSections.opening || latestDraftSections.body || latestDraftSections.closing || latestDraftAudiencePanel) ? (
        <PanelCard title="主稿复核" description="主稿本身是否像一篇能发的图文，要先于镜头和包装成立。">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              <div className="theme-panel-muted rounded-[22px] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">主稿标题</div>
                    <div className="mt-2 text-lg font-semibold text-[var(--text-1)]">
                      {latestDraftSections.title || "当前主稿"}
                    </div>
                  </div>
                  {latestDraftPreview.versionNumber ? (
                    <Tag>{`v${latestDraftPreview.versionNumber}`}</Tag>
                  ) : null}
                </div>
              </div>

              {latestDraftSections.opening ? (
                <div className="theme-panel-muted rounded-[22px] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">开头</div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-1)]">{latestDraftSections.opening}</div>
                </div>
              ) : null}

              {latestDraftSections.body ? (
                <div className="theme-panel-muted rounded-[22px] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">主体</div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-1)]">
                    {latestDraftSections.body}
                  </div>
                </div>
              ) : null}

              {latestDraftSections.closing ? (
                <div className="theme-panel-muted rounded-[22px] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">结尾</div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-1)]">{latestDraftSections.closing}</div>
                </div>
              ) : null}
            </div>

            <div className="theme-panel-muted rounded-[22px] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">观众评分</div>
              {renderAudiencePanel(latestDraftAudiencePanel, "系统完成主稿复核后，这里会出现多观众评分。")}
            </div>
          </div>
        </PanelCard>
      ) : null}

      {/* ── Section 3: Collapsible shot editor ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)]">
        <button
          type="button"
          onClick={() => setShowShotEditor((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[var(--surface-muted)]"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--text-1)]">镜头打磨（高级）</div>
            <div className="mt-0.5 text-xs text-[var(--text-3)]">
              {rows.length} 个镜头 · {readySceneCount} 可执行 · {totalRiskFlags} 风险标记
            </div>
          </div>
          <div className={`text-[var(--text-3)] transition-transform ${showShotEditor ? "rotate-180" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </button>

        {showShotEditor && (
          <div className="space-y-6 border-t border-[var(--border)] px-6 py-6">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="镜头数" value={String(rows.length)} caption="当前脚本镜头单元数" />
              <StatCard label="可执行镜头" value={String(readySceneCount)} caption="素材齐备、可直接下游生产" />
              <StatCard label="风险标记" value={String(totalRiskFlags)} caption="需要额外审阅的风险标记" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
              <PanelCard title="快速镜头编辑" description="先选镜头、改 AI 重构、保存或重跑。其他细项先收进高级信息。">
                <div className="grid gap-5 lg:grid-cols-[0.48fr_1fr]">
                  <div className="space-y-3">
                    {rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => syncWithScene(row.id)}
                        className={`w-full rounded-[24px] border p-4 text-left transition ${
                          row.id === selectedScene.id
                            ? "theme-panel-strong border-transparent"
                            : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                          <div className="text-base font-semibold">镜头 {row.sceneOrder}</div>
                            <div className={`mt-1 text-xs ${row.id === selectedScene.id ? "text-white/72" : "text-[var(--text-2)]"}`}>{row.continuityGroup}</div>
                          </div>
                          <Tag tone={row.assetReady ? "success" : "danger"}>{row.assetReady ? "已齐备" : "待补素材"}</Tag>
                        </div>
                        <div className={`mt-3 line-clamp-2 text-sm font-medium ${row.id === selectedScene.id ? "text-[var(--text-inverse)]" : "text-[var(--text-1)]"}`}>{row.shotGoal}</div>
                        <div className={`mt-2 line-clamp-3 text-sm leading-6 ${row.id === selectedScene.id ? "text-white/84" : "text-[var(--text-2)]"}`}>{row.rewritten}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.labels.slice(0, 4).map((label) => (
                            <Tag key={label}>{label}</Tag>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="theme-panel-muted rounded-[24px] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag>{selectedScene.continuityGroup}</Tag>
                        <Tag>{selectedScene.durationSec}s</Tag>
                        {selectedScene.classification ? <Tag>{selectedScene.classification.productionClass}</Tag> : null}
                        <Tag tone={selectedScene.assetReady ? "success" : "danger"}>{selectedScene.assetReady ? "素材齐备" : "待补素材"}</Tag>
                      </div>
                      <div className="mt-3 text-sm leading-6 text-[var(--text-2)]">
                        {selectedScene.classification
                          ? `当前分类为 ${selectedScene.classification.humanType} / ${selectedScene.classification.motionType} / ${selectedScene.classification.lipSyncType}，制作难度 ${selectedScene.classification.difficultyScore}。`
                          : "当前 scene 还没有分类结果。"}
                      </div>
                    </div>

                    <div className="theme-panel-muted rounded-[24px] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">原始文本</div>
                      <div className="mt-3 min-h-24 rounded-[20px] border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-sm leading-7 text-[var(--text-1)]">
                        {selectedScene.originalText}
                      </div>
                    </div>

                    <div className="theme-panel-muted rounded-[24px] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">AI 重构文本</div>
                      <label className="mt-4 grid gap-2">
                        <span className="text-sm font-medium text-[var(--text-2)]">先把这个镜头改成更清楚、更可执行的一版。</span>
                        <textarea
                          value={rewritten}
                          onChange={(event) => setRewritten(event.target.value)}
                          rows={8}
                          className="theme-input rounded-[20px] px-4 py-3 text-sm leading-7"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void saveScene()} disabled={pending !== null}>
                        {pending === "save" ? "保存中..." : "保存 Scene"}
                      </Button>
                      <Button variant="secondary" onClick={() => void rerunClassification()} disabled={pending !== null}>
                        {pending === "classify" ? "重跑中..." : "重跑分类"}
                      </Button>
                      <Button variant="secondary" onClick={() => void rerunAssets()} disabled={pending !== null}>
                        {pending === "assets" ? "分析中..." : "重跑素材分析"}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowAdvanced((value) => !value)}>
                        {showAdvanced ? "收起高级信息" : "展开高级信息"}
                      </Button>
                    </div>

                    {message ? <div className="theme-chip-ok rounded-2xl px-3 py-2 text-sm">{message}</div> : null}
                    {error ? (
                      <ErrorNotice
                        error={error}
                        onRetry={
                          lastAction === "save"
                            ? () => void saveScene()
                            : lastAction === "classify"
                              ? () => void rerunClassification()
                              : lastAction === "assets"
                                ? () => void rerunAssets()
                                : undefined
                        }
                      />
                    ) : null}

                    {showAdvanced ? (
                      <>
                        <div className="theme-panel-muted rounded-[24px] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">镜头设定</div>
                          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
                            <label className="grid gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">镜头目标</span>
                              <input value={shotGoal} onChange={(event) => setShotGoal(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" />
                            </label>
                            <div className="grid gap-4 md:grid-cols-2">
                              <label className="grid gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">连续性分组</span>
                                <input value={continuityGroup} onChange={(event) => setContinuityGroup(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" />
                              </label>
                              <label className="grid gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">时长（秒）</span>
                                <input type="number" min={1} max={120} value={durationSec} onChange={(event) => setDurationSec(Number(event.target.value))} className="theme-input rounded-[16px] px-4 py-3 text-sm" />
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="theme-panel-muted rounded-[24px] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">视觉指令</div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">视觉重点</span>
                              <input value={visualPriority} onChange={(event) => setVisualPriority(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" />
                            </label>
                            <label className="grid gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">避免项</span>
                              <input value={avoid} onChange={(event) => setAvoid(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" />
                            </label>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </PanelCard>

              <DetailPanel title={`镜头 ${selectedScene.sceneOrder} 详情`} className="xl:sticky xl:top-6 xl:self-start">
              <div>
                <div className="text-sm font-medium text-[var(--text-inverse)]">分类标签</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedScene.labels.length > 0 ? selectedScene.labels.map((label) => <Tag key={label}>{label}</Tag>) : <Tag>待分类</Tag>}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-inverse)]">风险标记</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedScene.classification?.riskFlags.length ? (
                    selectedScene.classification.riskFlags.map((flag) => (
                      <Tag key={flag} tone="danger">{flag}</Tag>
                    ))
                  ) : (
                    <div>暂无明显风险标记。</div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-inverse)]">素材依赖</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedScene.assets.length ? selectedScene.assets.map((asset) => <Tag key={asset}>{asset}</Tag>) : <div>尚未生成素材依赖。</div>}
                </div>
                {selectedScene.missingAssets.length ? <div className="mt-3 text-[var(--danger-text)]">{selectedScene.missingAssets.join("；")}</div> : <div className="mt-3 text-[var(--ok-text)]">当前素材判断为齐备。</div>}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-inverse)]">已登记素材</div>
                <div className="mt-3 space-y-2">
                  {selectedScene.uploadedAssets.length ? (
                    selectedScene.uploadedAssets.map((asset) => (
                      <div key={asset.id} className="rounded-2xl border border-[rgba(255,255,255,0.1)] px-3 py-2">
                        <div className="text-sm text-[var(--text-inverse)]">
                          {asset.fileUrl ? (
                            <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="underline decoration-[rgba(255,255,255,0.2)] underline-offset-4">
                              {asset.fileName}
                            </a>
                          ) : (
                            asset.fileName
                          )}
                        </div>
                        <div className="text-xs text-white/58">
                          {asset.type}
                          {asset.continuityGroup ? ` · ${asset.continuityGroup}` : ""}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>尚未登记任何素材元数据。</div>
                  )}
                </div>
              </div>
            </DetailPanel>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
