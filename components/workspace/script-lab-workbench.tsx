"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
import { ErrorNotice } from "@/components/ui/error-notice";
import { PanelCard } from "@/components/ui/panel-card";
import { Tag } from "@/components/ui/tag";
import { DailyRunPackagingNotice } from "@/components/workspace/daily-run-packaging-notice";
import { renderAudiencePanel } from "@/components/workspace/script-lab-audience-panel";
import { ScriptLabDraftReviewPanel } from "@/components/workspace/script-lab-draft-review-panel";
import { QualityAlertList } from "@/components/workspace/script-lab-quality-alerts";
import { StatCard } from "@/components/workspace/script-lab-stat-card";
import { ScriptLabSummaryPanel } from "@/components/workspace/script-lab-summary-panel";
import type { MarsOutputs, ScriptDraftPreview, ScriptLabRow } from "@/components/workspace/script-lab-types";
import { assessPublishCopy, assessScenePrompt, assessVideoTitlePack } from "@/lib/artifact-quality";
import { normalizeAudiencePanelReview } from "@/lib/copy-review-panel";
import { getOutputKnowledgePack, reviewOutputArtifact } from "@/lib/output-artifact-guidance";
import { apiRequest } from "@/lib/client-api";
import { normalizeStringList, normalizeString, normalizeArtifactReview, copyToClipboard } from "@/lib/utils";

export function ScriptLabWorkbench({
  projectId,
  rows,
  marsOutputs,
  latestDraftPreview,
  isOwnedMediaPackage = false,
  fastPackageStatus = null,
  locale = "zh",
}: {
  projectId: string;
  rows: ScriptLabRow[];
  marsOutputs: MarsOutputs;
  latestDraftPreview?: ScriptDraftPreview | null;
  isOwnedMediaPackage?: boolean;
  fastPackageStatus?: string | null;
  locale?: "zh" | "en";
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
  const [showTitleMore, setShowTitleMore] = useState(false);
  const [showPublishMore, setShowPublishMore] = useState(false);
  const [showTitleReview, setShowTitleReview] = useState(false);
  const [showPublishReview, setShowPublishReview] = useState(false);

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
    if (rows.length > 0) completed.push(`已生成 ${rows.length} 条配图说明`);
    if (hasTitlePack) completed.push("标题已生成");
    if (hasPublishCopy) completed.push("发布文案已生成");

    let weakest = "正文和发布包装还需要轻改。";
    let next = "下一步：先检查正文，再确认标题和发布文案。";

    if (latestDraftAudiencePanel?.reviewers?.length && latestDraftAudiencePanel.publishReadiness !== "READY") {
      const weakestReviewer = [...latestDraftAudiencePanel.reviewers].sort((a, b) => a.score - b.score)[0];
      weakest = weakestReviewer?.concerns?.slice(0, 2).join("；") || "主稿还不够像一篇能直接发布的内容。";
      next = weakestReviewer?.nextAction || "先修主稿的信息密度、证据感和段落推进，再处理包装。";
    } else if (!hasTitlePack) {
      weakest = "标题还在生成，稍后刷新。";
      next = isOwnedMediaPackage
        ? "下一步：标题还在生成，可以先检查正文，稍后刷新。"
        : "下一步：先补标题，再继续轻改发布文案。";
    } else if (!hasPublishCopy) {
      weakest = "发布文案还在生成，稍后刷新。";
      next = isOwnedMediaPackage
        ? "下一步：发布文案还在生成，可以先检查正文和标题，稍后刷新。"
        : "下一步：补出一版发布文案。";
    } else if (publishAudiencePanel?.reviewers?.length && publishAudiencePanel.publishReadiness !== "READY") {
      const weakestReviewer = [...publishAudiencePanel.reviewers].sort((a, b) => a.score - b.score)[0];
      weakest = weakestReviewer?.concerns?.slice(0, 2).join("；") || "模拟观众判断当前发布包装还不适合直接发。";
      next = weakestReviewer?.nextAction || "先解决掉分最严重的观众异议，再继续下游工作。";
    } else if (titleAudiencePanel?.reviewers?.length && titleAudiencePanel.publishReadiness !== "READY") {
      const weakestReviewer = [...titleAudiencePanel.reviewers].sort((a, b) => a.score - b.score)[0];
      weakest = weakestReviewer?.concerns?.slice(0, 2).join("；") || "模拟观众判断当前标题包还不够能停住人。";
      next = weakestReviewer?.nextAction || "先补强标题钩子和区分度，再继续推进。";
    } else if (readySceneCount < rows.length) {
      weakest = `还有 ${rows.length - readySceneCount} 条配图说明需要确认。`;
      next = "下一步：正文、标题和发布文案确认后，再展开配图细节。";
    } else if (promptReadySceneCount < rows.length) {
      weakest = `还有 ${rows.length - promptReadySceneCount} 条配图说明需要轻改。`;
      next = "下一步：正文、标题和发布文案确认后，再展开配图细节。";
    } else if (totalRiskFlags > 0) {
      weakest = `当前还有 ${totalRiskFlags} 个风险标记需要复核。`;
      next = "下一步：正文、标题和发布文案确认后，再展开配图细节。";
    } else {
      weakest = "正文、标题、发布文案和配图说明都比较完整。";
      next = "下一步：做最后轻改，然后复制标题和发布文案。";
    }

    return {
      completed: completed.join(" · ") || "脚本工作区已准备好。",
      weakest,
      next,
    };
  }, [hasPublishCopy, hasTitlePack, isOwnedMediaPackage, latestDraftAudiencePanel, promptReadySceneCount, publishAudiencePanel, readySceneCount, rows.length, titleAudiencePanel, totalRiskFlags]);
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

      setMessage("配图说明已保存。");
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

      setMessage("素材情况已更新。");
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
          task_title: `标题 · ${recommendedTitle.trim()}`,
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
      setMessage("标题已保存。");
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
      setMessage("发布文案已保存。");
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
      <DailyRunPackagingNotice
        isOwnedMediaPackage={isOwnedMediaPackage}
        packagingIncomplete={!hasTitlePack || !hasPublishCopy || rows.length === 0 || fastPackageStatus === "RUNNING" || fastPackageStatus === "FAILED"}
        packagingStatus={fastPackageStatus}
        hasTitlePack={hasTitlePack}
        hasPublishCopy={hasPublishCopy}
        hasImageBrief={rows.length > 0}
        locale={locale}
      />

      {latestDraftPreview && (latestDraftSections.opening || latestDraftSections.body || latestDraftSections.closing || latestDraftAudiencePanel) ? (
        <ScriptLabDraftReviewPanel
          latestDraftPreview={latestDraftPreview}
          latestDraftSections={latestDraftSections}
          latestDraftAudiencePanel={latestDraftAudiencePanel}
        />
      ) : null}

      <ScriptLabSummaryPanel feedback={scriptFeedback} />

      {/* ── Section 1: Title Pack + Publish Copy (primary area) ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard title="标题" description="确认推荐标题和备选标题。">
          <div className="space-y-4">
            {marsOutputs.latestVideoTitlePack ? (
              <div className="theme-panel-muted rounded-[14px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">推荐标题</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => void copyVideoTitlePack()}>
                      复制标题
                    </Button>
                    <Button variant="secondary" className="h-auto px-3 py-1.5 text-xs" onClick={() => void saveVideoTitlePack()} disabled={artifactPending !== null}>
                      {artifactPending === "title" ? "保存中..." : "保存修改"}
                    </Button>
                    <Tag>{new Date(marsOutputs.latestVideoTitlePack.createdAt).toLocaleString("zh-CN")}</Tag>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">推荐标题</div>
                    <input value={recommendedTitle} onChange={(event) => setRecommendedTitle(event.target.value)} className="theme-input w-full rounded-[14px] px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">备选标题</div>
                    <textarea value={titleOptionsText} onChange={(event) => setTitleOptionsText(event.target.value)} rows={4} className="theme-input w-full rounded-[14px] px-4 py-3 text-sm leading-7" />
                  </div>
                  <QualityAlertList alerts={titleQualityAlerts} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => setShowTitleMore((value) => !value)}>
                      {showTitleMore ? "收起更多字段" : "展开更多字段"}
                    </Button>
                    <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => setShowTitleReview((value) => !value)}>
                      {showTitleReview ? "收起复核详情" : "复核详情"}
                    </Button>
                  </div>
                  {showTitleMore ? (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">角度说明</div>
                      <textarea value={titleAngleSummary} onChange={(event) => setTitleAngleSummary(event.target.value)} rows={3} className="theme-input w-full rounded-[14px] px-4 py-3 text-sm leading-7" />
                    </div>
                  ) : null}
                  {showTitleReview ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">创作知识</div>
                        <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                          {(titleKnowledgeNotes.length ? titleKnowledgeNotes : getOutputKnowledgePack("VIDEO_TITLE").knowledgeNotes).map((item) => (
                            <div key={item}>- {item}</div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">系统复核</div>
                        <div className="mt-3 text-sm leading-6 text-[var(--text-1)]">{titleArtifactReview?.summary ?? "当前版本还没有复核结果。"}</div>
                        {titleArtifactReview?.issues.length ? (
                          <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                            {titleArtifactReview.issues.slice(0, 3).map((item) => (
                              <div key={item}>- {item}</div>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">观众评分</div>
                        {renderAudiencePanel(titleAudiencePanel, "系统完成第二轮复核后，这里会出现多观众评分。")}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-[14px] border border-dashed border-[var(--border)] p-4 text-sm leading-7 text-[var(--text-2)]">
                {isOwnedMediaPackage
                  ? "标题还在生成，稍后刷新。"
                  : "还没有生成标题。"}
              </div>
            )}
          </div>
        </PanelCard>

        <PanelCard title="发布文案" description="确认一版可直接复制发布的文案。" className="scroll-mt-20" id="publish-copy">
          {marsOutputs.latestPublishCopy ? (
            <div className="space-y-4">
              <div className="theme-panel-muted rounded-[14px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">当前版本</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => void copyPublishCopy()}>
                      复制发布文案
                    </Button>
                    <Button variant="secondary" className="h-auto px-3 py-1.5 text-xs" onClick={() => void savePublishCopyPack()} disabled={artifactPending !== null}>
                      {artifactPending === "publish" ? "保存中..." : "保存修改"}
                    </Button>
                    <Tag>{new Date(marsOutputs.latestPublishCopy.createdAt).toLocaleString("zh-CN")}</Tag>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">发布标题</div>
                    <input value={publishPrimaryTitle} onChange={(event) => setPublishPrimaryTitle(event.target.value)} className="theme-input w-full rounded-[14px] px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">导语</div>
                    <textarea value={publishLeadIn} onChange={(event) => setPublishLeadIn(event.target.value)} rows={3} className="theme-input w-full rounded-[14px] px-4 py-3 text-sm leading-7" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">发布正文</div>
                    <textarea value={publishDescription} onChange={(event) => setPublishDescription(event.target.value)} rows={6} className="theme-input w-full rounded-[14px] px-4 py-3 text-sm leading-7" />
                  </div>
                  <QualityAlertList alerts={publishQualityAlerts} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => setShowPublishMore((value) => !value)}>
                      {showPublishMore ? "收起更多字段" : "展开更多字段"}
                    </Button>
                    <Button variant="ghost" className="h-auto px-3 py-1.5 text-xs" onClick={() => setShowPublishReview((value) => !value)}>
                      {showPublishReview ? "收起复核详情" : "复核详情"}
                    </Button>
                  </div>
                  {showPublishMore ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">亮点</div>
                        <textarea value={publishHighlightsText} onChange={(event) => setPublishHighlightsText(event.target.value)} rows={4} className="theme-input w-full rounded-[14px] px-4 py-3 text-sm leading-7" />
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">CTA</div>
                        <textarea value={publishCta} onChange={(event) => setPublishCta(event.target.value)} rows={4} className="theme-input w-full rounded-[14px] px-4 py-3 text-sm leading-7" />
                      </div>
                    </div>
                  ) : null}
                  {showPublishReview ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">创作知识</div>
                        <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                          {(publishKnowledgeNotes.length ? publishKnowledgeNotes : getOutputKnowledgePack("PUBLISH_COPY").knowledgeNotes).map((item) => (
                            <div key={item}>- {item}</div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">系统复核</div>
                        <div className="mt-3 text-sm leading-6 text-[var(--text-1)]">{publishArtifactReview?.summary ?? "当前版本还没有复核结果。"}</div>
                        {publishArtifactReview?.issues.length ? (
                          <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-2)]">
                            {publishArtifactReview.issues.slice(0, 3).map((item) => (
                              <div key={item}>- {item}</div>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">观众评分</div>
                        {renderAudiencePanel(publishAudiencePanel, "系统完成第二轮复核后，这里会出现多观众评分。")}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-[var(--border)] p-4 text-sm leading-7 text-[var(--text-2)]">
              {isOwnedMediaPackage
                ? "发布文案还在生成，稍后刷新。"
                : "还没有生成发布文案。"}
            </div>
          )}
        </PanelCard>
      </div>

      {/* ── Section 3: Collapsible shot editor ── */}
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)]">
        <button
          type="button"
          onClick={() => setShowShotEditor((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[var(--surface-muted)]"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--text-1)]">高级：配图细节</div>
            <div className="mt-0.5 text-xs text-[var(--text-3)]">
              已生成 {rows.length} 条配图说明
            </div>
          </div>
          <div className={`text-[var(--text-3)] transition-transform ${showShotEditor ? "rotate-180" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </button>

        {showShotEditor && (
          <div className="space-y-6 border-t border-[var(--border)] px-6 py-6">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="配图说明" value={String(rows.length)} caption="当前已生成条目" />
              <StatCard label="可继续" value={String(readySceneCount)} caption="可进入后续出图" />
              <StatCard label="需复核" value={String(totalRiskFlags)} caption="建议人工看一眼" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
              <PanelCard title="配图说明编辑" description="只在配图不够清楚时再改。">
                <div className="grid gap-5 lg:grid-cols-[0.48fr_1fr]">
                  <div className="space-y-3">
                    {rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => syncWithScene(row.id)}
                        className={`w-full rounded-[14px] border p-4 text-left transition ${
                          row.id === selectedScene.id
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold">配图 {row.sceneOrder}</div>
                            <div className={`mt-1 text-xs ${row.id === selectedScene.id ? "text-[var(--text-2)]" : "text-[var(--text-2)]"}`}>{row.continuityGroup}</div>
                          </div>
                          <Tag tone={row.assetReady ? "success" : "danger"}>{row.assetReady ? "已齐备" : "待补素材"}</Tag>
                        </div>
                        <div className={`mt-3 line-clamp-2 text-sm font-medium ${row.id === selectedScene.id ? "text-[var(--text-1)]" : "text-[var(--text-1)]"}`}>{row.shotGoal}</div>
                        <div className={`mt-2 line-clamp-3 text-sm leading-6 ${row.id === selectedScene.id ? "text-[var(--text-2)]" : "text-[var(--text-2)]"}`}>{row.rewritten}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.labels.slice(0, 4).map((label) => (
                            <Tag key={label}>{label}</Tag>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="theme-panel-muted rounded-[14px] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag>{selectedScene.continuityGroup}</Tag>
                        <Tag>{selectedScene.durationSec}s</Tag>
                        <Tag tone={selectedScene.assetReady ? "success" : "danger"}>{selectedScene.assetReady ? "素材齐备" : "待补素材"}</Tag>
                      </div>
                      <div className="mt-3 text-sm leading-6 text-[var(--text-2)]">
                        {selectedScene.classification
                          ? `这条配图说明已完成基础判断，难度 ${selectedScene.classification.difficultyScore}。`
                          : "这条配图说明还没有完成基础判断。"}
                      </div>
                    </div>

                    <div className="theme-panel-muted rounded-[14px] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">原始文本</div>
                      <div className="mt-3 min-h-24 rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-sm leading-7 text-[var(--text-1)]">
                        {selectedScene.originalText}
                      </div>
                    </div>

                    <div className="theme-panel-muted rounded-[14px] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">配图说明</div>
                      <label className="mt-4 grid gap-2">
                        <span className="text-sm font-medium text-[var(--text-2)]">把这条配图说明改得更清楚。</span>
                        <textarea
                          value={rewritten}
                          onChange={(event) => setRewritten(event.target.value)}
                          rows={8}
                          className="theme-input rounded-[14px] px-4 py-3 text-sm leading-7"
                        />
                      </label>
                      <div className="mt-4">
                        <QualityAlertList alerts={selectedSceneQualityAlerts} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void saveScene()} disabled={pending !== null}>
                        {pending === "save" ? "保存中..." : "保存配图说明"}
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

                    {message ? <div className="theme-chip-ok rounded-[14px] px-3 py-2 text-sm">{message}</div> : null}
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
                        <div className="theme-panel-muted rounded-[14px] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">配图设定</div>
                          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
                            <label className="grid gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">配图目标</span>
                              <input value={shotGoal} onChange={(event) => setShotGoal(event.target.value)} className="theme-input rounded-[14px] px-4 py-3 text-sm" />
                            </label>
                            <div className="grid gap-4 md:grid-cols-2">
                              <label className="grid gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">连续性分组</span>
                                <input value={continuityGroup} onChange={(event) => setContinuityGroup(event.target.value)} className="theme-input rounded-[14px] px-4 py-3 text-sm" />
                              </label>
                              <label className="grid gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">时长（秒）</span>
                                <input type="number" min={1} max={120} value={durationSec} onChange={(event) => setDurationSec(Number(event.target.value))} className="theme-input rounded-[14px] px-4 py-3 text-sm" />
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="theme-panel-muted rounded-[14px] p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">视觉指令</div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">视觉重点</span>
                              <input value={visualPriority} onChange={(event) => setVisualPriority(event.target.value)} className="theme-input rounded-[14px] px-4 py-3 text-sm" />
                            </label>
                            <label className="grid gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">避免项</span>
                              <input value={avoid} onChange={(event) => setAvoid(event.target.value)} className="theme-input rounded-[14px] px-4 py-3 text-sm" />
                            </label>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </PanelCard>

              <DetailPanel title={`配图 ${selectedScene.sceneOrder} 详情`} className="xl:sticky xl:top-6 xl:self-start">
              <div>
                <div className="text-sm font-medium text-[var(--text-1)]">分类标签</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedScene.labels.length > 0 ? selectedScene.labels.map((label) => <Tag key={label}>{label}</Tag>) : <Tag>待分类</Tag>}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-1)]">风险标记</div>
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
                <div className="text-sm font-medium text-[var(--text-1)]">素材情况</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedScene.assets.length ? selectedScene.assets.map((asset) => <Tag key={asset}>{asset}</Tag>) : <div>尚未生成素材判断。</div>}
                </div>
                {selectedScene.missingAssets.length ? <div className="mt-3 text-[var(--danger-text)]">{selectedScene.missingAssets.join("；")}</div> : <div className="mt-3 text-[var(--ok-text)]">当前素材判断为齐备。</div>}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-1)]">已登记素材</div>
                <div className="mt-3 space-y-2">
                  {selectedScene.uploadedAssets.length ? (
                    selectedScene.uploadedAssets.map((asset) => (
                      <div key={asset.id} className="rounded-[14px] border border-[var(--border)] px-3 py-2">
                        <div className="text-sm text-[var(--text-1)]">
                          {asset.fileUrl ? (
                            <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="underline decoration-[var(--border)] underline-offset-4">
                              {asset.fileName}
                            </a>
                          ) : (
                            asset.fileName
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-3)]">
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
