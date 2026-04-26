"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
import { ErrorNotice } from "@/components/ui/error-notice";
import { PanelCard } from "@/components/ui/panel-card";
import { ScoreBar } from "@/components/ui/score-bar";
import { Tag } from "@/components/ui/tag";
import { apiRequest } from "@/lib/client-api";
import { reviewImageBrief } from "@/lib/image-brief-review";
import { getFeedbackIssueLabel, summarizeRowFeedback } from "@/lib/render-job-feedback";

type ScenePlannerRow = {
  id: string;
  sceneOrder: number;
  frameId: string | null;
  frameOrder: number;
  frameStatus: string;
  frameTitle: string;
  rewritten: string;
  shotGoal: string;
  durationSec: number;
  continuityGroup: string;
  productionClass: string;
  difficulty: number;
  riskFlags: string[];
  assetReady: boolean;
  requiredAssets: string[];
  uploadedAssets: Array<{
    id: string;
    type: string;
    fileName: string;
    continuityGroup: string | null;
    fileUrl?: string | null;
  }>;
  missing: string[];
  cameraPlan: string | null;
  motionPlan: string | null;
  compositionNotes: string | null;
  visualPrompt: string | null;
  onScreenText: string | null;
  narrationText: string | null;
  referenceCount: number;
  storyboardVersion: number | null;
  references: Array<{
    id: string;
    type: string;
    label: string;
    fileUrl: string | null;
  }>;
};

type RenderJobFeedbackRow = {
  id: string;
  script_scene_id?: string | null;
  storyboard_frame_id?: string | null;
  output_json?: unknown;
  created_at?: string | Date;
};

const assetTypeOptions = [
  "CHARACTER_BASE",
  "SCENE_BASE",
  "CHARACTER_SCENE_COMPOSITE",
  "VOICE",
  "REFERENCE_IMAGE",
] as const;

function PlannerStat({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="theme-panel-muted rounded-[22px] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">{label}</div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-1)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--text-2)]">{caption}</div>
    </div>
  );
}

function getReviewTone(readiness: "READY" | "NEEDS_REVISION") {
  return readiness === "READY" ? "theme-chip-ok" : "theme-chip-warn";
}

export function ScenePlannerWorkbench({
  projectId,
  rows,
  jobs,
  showLocalStorageNotice = false,
  uploadStorageMode = "local",
}: {
  projectId: string;
  rows: ScenePlannerRow[];
  jobs: RenderJobFeedbackRow[];
  showLocalStorageNotice?: boolean;
  uploadStorageMode?: "local" | "tencent_cos";
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [assetType, setAssetType] = useState<(typeof assetTypeOptions)[number]>("CHARACTER_BASE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pending, setPending] = useState<"classify" | "assets" | "upload" | "save" | null>(null);
  const [lastAction, setLastAction] = useState<"classify" | "assets" | "upload" | "save" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* ── Scene editing state (merged from Script Lab) ── */
  const [editRewritten, setEditRewritten] = useState(rows[0]?.rewritten ?? "");
  const [editShotGoal, setEditShotGoal] = useState(rows[0]?.shotGoal ?? "");
  const [editVisualPriority, setEditVisualPriority] = useState("");
  const [editAvoid, setEditAvoid] = useState("");

  const selectedScene = useMemo(() => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null, [rows, selectedId]);
  const selectedReview = useMemo(
    () =>
      selectedScene
        ? reviewImageBrief({
            frameTitle: selectedScene.frameTitle,
            shotGoal: selectedScene.shotGoal,
            rewritten: selectedScene.rewritten,
            visualPrompt: selectedScene.visualPrompt,
            cameraPlan: selectedScene.cameraPlan,
            compositionNotes: selectedScene.compositionNotes,
            referenceCount: selectedScene.referenceCount,
            assetReady: selectedScene.assetReady,
            missing: selectedScene.missing,
            riskFlags: selectedScene.riskFlags,
          })
        : null,
    [selectedScene],
  );
  const selectedFeedbackSummary = useMemo(
    () =>
      selectedScene
        ? summarizeRowFeedback({
            jobs,
            scriptSceneId: selectedScene.id,
            frameId: selectedScene.frameId,
          })
        : null,
    [jobs, selectedScene],
  );
  const selectedIsFrameOnly = Boolean(selectedScene?.id.startsWith("frame:"));
  const storyboardVersion = rows[0]?.storyboardVersion ?? null;
  const readyFrames = rows.filter((row) => row.frameStatus === "READY" || row.frameStatus === "LOCKED").length;
  const totalReferences = rows.reduce((sum, row) => sum + row.referenceCount, 0);

  function syncEditFields(scene: ScenePlannerRow) {
    setEditRewritten(scene.rewritten);
    setEditShotGoal(scene.shotGoal);
    setEditVisualPriority("");
    setEditAvoid("");
    setMessage(null);
    setError(null);
  }

  async function saveScene() {
    if (!selectedScene) return;
    if (selectedIsFrameOnly) {
      setMessage("这条配图说明来自手工 storyboard，当前可查看和进入图片任务；如需改写文字，请先重新生成或编辑对应 storyboard 数据。");
      return;
    }

    setPending("save");
    setLastAction("save");
    setMessage(null);
    setError(null);

    try {
      const visualPriorityArr = editVisualPriority.split(",").map((s) => s.trim()).filter(Boolean);
      const avoidArr = editAvoid.split(",").map((s) => s.trim()).filter(Boolean);

      await apiRequest(`/api/projects/${projectId}/scenes/${selectedScene.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewritten_for_ai: editRewritten,
          shot_goal: editShotGoal,
          ...(visualPriorityArr.length ? { visual_priority: visualPriorityArr } : {}),
          ...(avoidArr.length ? { avoid: avoidArr } : {}),
        }),
      });
      setMessage("镜头文本已保存。");
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
    if (selectedIsFrameOnly) {
      setMessage("这条配图说明没有绑定 script scene，不需要重跑条目分类。");
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
        body: JSON.stringify({}),
      });
      setMessage("该镜头的分类已更新。");
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
    if (selectedIsFrameOnly) {
      setMessage("这条配图说明没有绑定 script scene，当前按 storyboard brief 直接进入图片任务。");
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
      setMessage("该镜头的素材依赖已更新。");
      router.refresh();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(null);
    }
  }

  async function saveAssetMetadata() {
    if (!selectedScene) {
      return;
    }
    if (selectedIsFrameOnly) {
      setMessage("这条配图说明没有绑定 script scene，暂不支持在这里上传并回写素材；可先在图片任务里记录参考和反馈。");
      return;
    }

    if (!selectedFile) {
      setError("请先选择一个文件。");
      return;
    }

    setPending("upload");
    setLastAction("upload");
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      formData.set("asset_type", assetType);
      formData.set("script_scene_id", selectedScene.id);
      formData.set("continuity_group", selectedScene.continuityGroup);

      await apiRequest(`/api/projects/${projectId}/assets/upload`, {
        method: "POST",
        body: formData,
      });

      await apiRequest(`/api/projects/${projectId}/scenes/${selectedScene.id}/assets/analyze`, {
        method: "POST",
      });
      setMessage("素材已上传并回写到当前镜头。");
      setSelectedFile(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(null);
    }
  }

  if (!selectedScene) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <PlannerStat label="说明版本" value={storyboardVersion ? `v${storyboardVersion}` : "草稿"} caption="当前启用的配图说明版本" />
        <PlannerStat label="可开工条目" value={`${readyFrames}/${rows.length}`} caption="进入 ready 或 locked 的视觉条目数" />
        <PlannerStat label="素材缺口" value={String(rows.filter((row) => !row.assetReady).length)} caption="仍缺关键参考或素材的条目" />
        <PlannerStat label="参考图" value={String(totalReferences)} caption="已挂到当前视觉条目的参考图数" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <PanelCard title="快速配图面板" description="先判断这张图能不能开工，再补提示词和参考。详细信息先收进高级区。">
          <div className="space-y-4">
            {rows.map((row) => {
              const selected = row.id === selectedScene.id;
              const review = reviewImageBrief({
                frameTitle: row.frameTitle,
                shotGoal: row.shotGoal,
                rewritten: row.rewritten,
                visualPrompt: row.visualPrompt,
                cameraPlan: row.cameraPlan,
                compositionNotes: row.compositionNotes,
                referenceCount: row.referenceCount,
                assetReady: row.assetReady,
                missing: row.missing,
                riskFlags: row.riskFlags,
              });
              const feedbackSummary = summarizeRowFeedback({
                jobs,
                scriptSceneId: row.id,
                frameId: row.frameId,
              });

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(row.id);
                    syncEditFields(row);
                  }}
                  className={`grid w-full gap-5 rounded-[26px] border p-5 text-left transition md:grid-cols-[88px_1fr_210px] ${
                    selected
                      ? "theme-panel-strong border-transparent"
                      : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <div>
                    <div className="text-3xl font-semibold tracking-tight">#{row.frameOrder}</div>
                    <div className={`mt-2 text-xs uppercase tracking-[0.14em] ${selected ? "text-white/66" : "text-[var(--text-3)]"}`}>
                      {row.frameStatus}
                    </div>
                    <div className={`mt-2 text-xs ${selected ? "text-white/72" : "text-[var(--text-2)]"}`}>{row.continuityGroup}</div>
                  </div>

                  <div>
                    <div className={`text-xl font-semibold leading-8 ${selected ? "text-[var(--text-inverse)]" : "text-[var(--text-1)]"}`}>{row.frameTitle}</div>
                    <div className={`mt-2 text-sm leading-6 ${selected ? "text-white/72" : "text-[var(--text-2)]"}`}>{row.shotGoal}</div>
                    <div className={`mt-3 line-clamp-3 text-base leading-7 ${selected ? "text-white/90" : "text-[var(--text-1)]"}`}>{row.rewritten}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Tag>{row.productionClass}</Tag>
                      <Tag>{row.durationSec}s</Tag>
                      <Tag tone={row.referenceCount > 0 ? "success" : "warning"}>{row.referenceCount} refs</Tag>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getReviewTone(review.readiness)}`}>
                        {review.readiness === "READY" ? `可开工 ${review.score}` : `待补强 ${review.score}`}
                      </span>
                      {feedbackSummary ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${feedbackSummary.rewriteCount > 0 ? "theme-chip-danger" : "theme-chip-warn"}`}>
                          {feedbackSummary.rewriteCount > 0 ? `最近退回 ${feedbackSummary.rewriteCount}` : `已有反馈 ${feedbackSummary.totalFeedbacks}`}
                        </span>
                      ) : null}
                      {row.requiredAssets.slice(0, 2).map((asset) => (
                        <Tag key={asset}>{asset}</Tag>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <ScoreBar label="difficulty" value={row.difficulty} />
                    <div className="flex flex-wrap gap-2">
                      <Tag tone={row.assetReady ? "success" : "danger"}>{row.assetReady ? "已齐备" : "待补素材"}</Tag>
                      <Tag tone={row.frameStatus === "READY" || row.frameStatus === "LOCKED" ? "success" : "warning"}>{row.frameStatus}</Tag>
                    </div>
                    <div className={`text-xs ${selected ? "text-white/72" : "text-[var(--text-2)]"}`}>
                      {row.uploadedAssets.length} uploaded / {row.requiredAssets.length} required
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </PanelCard>

        <DetailPanel title={`配图条目 ${selectedScene.frameOrder} 执行面板`}>
          <div>
            <div className="text-sm font-medium text-[var(--text-inverse)]">当前配图条目</div>
            <div className="mt-3 space-y-3 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
              <div className="text-xl font-semibold text-[var(--text-inverse)]">{selectedScene.frameTitle}</div>
              <div className="flex flex-wrap gap-2">
                <Tag>{selectedScene.productionClass}</Tag>
                <Tag>{selectedScene.frameStatus}</Tag>
                <Tag>{selectedScene.durationSec}s</Tag>
                <Tag>{selectedScene.continuityGroup}</Tag>
              </div>
            </div>
          </div>

          {selectedReview ? (
            <div className="space-y-3 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-[var(--text-inverse)]">图片 brief 复核</div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getReviewTone(selectedReview.readiness)}`}>
                  {selectedReview.readiness === "READY" ? "可开工" : "待补强"}
                </span>
              </div>
              <ScoreBar label="readiness" value={selectedReview.score} />
              <div className="text-sm leading-6 text-white/82">{selectedReview.summary}</div>
              {selectedReview.issues.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-white/58">主要问题</div>
                    <div className="mt-2 space-y-2">
                      {selectedReview.issues.slice(0, 3).map((item) => (
                        <div key={item} className="rounded-2xl border border-[rgba(255,196,128,0.18)] bg-[rgba(255,196,128,0.08)] px-3 py-2 text-sm leading-6 text-[color:rgba(255,236,214,0.92)]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-white/58">下一步</div>
                    <div className="mt-2 space-y-2">
                      {selectedReview.nextSteps.slice(0, 3).map((item) => (
                        <div key={item} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm leading-6 text-white/84">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {selectedFeedbackSummary ? (
            <div className="space-y-3 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-[var(--text-inverse)]">最近出图反馈</div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  selectedFeedbackSummary.latestVerdict === "KEEP"
                    ? "theme-chip-ok"
                    : selectedFeedbackSummary.latestVerdict === "REWRITE_BRIEF"
                      ? "theme-chip-danger"
                      : "theme-chip-warn"
                }`}
                >
                  {selectedFeedbackSummary.latestVerdict === "KEEP"
                    ? "最近一版可保留"
                    : selectedFeedbackSummary.latestVerdict === "REWRITE_BRIEF"
                      ? "最近一版退回改 brief"
                      : "最近一版建议重试"}
                </span>
              </div>
              <div className="text-sm leading-6 text-white/82">{selectedFeedbackSummary.summary}</div>
              <div className="flex flex-wrap gap-2">
                <Tag>{selectedFeedbackSummary.totalFeedbacks} 条反馈</Tag>
                {selectedFeedbackSummary.retryCount > 0 ? <Tag tone="warning">重试 {selectedFeedbackSummary.retryCount}</Tag> : null}
                {selectedFeedbackSummary.rewriteCount > 0 ? <Tag tone="danger">退回 {selectedFeedbackSummary.rewriteCount}</Tag> : null}
                {selectedFeedbackSummary.keepCount > 0 ? <Tag tone="success">保留 {selectedFeedbackSummary.keepCount}</Tag> : null}
              </div>
              {selectedFeedbackSummary.topIssues.length ? (
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-white/58">高频问题</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFeedbackSummary.topIssues.map((issue) => (
                      <Tag key={issue} tone="warning">{getFeedbackIssueLabel(issue, "zh")}</Tag>
                    ))}
                  </div>
                </div>
              ) : null}
              {selectedFeedbackSummary.latestNote ? (
                <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm leading-6 text-white/84">
                  {selectedFeedbackSummary.latestNote}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ── Scene text editing (merged from Script Lab) ── */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--text-inverse)]">配图说明编辑</div>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-white/58">画面目标</span>
              <input
                value={editShotGoal}
                onChange={(e) => setEditShotGoal(e.target.value)}
                className="theme-input rounded-[16px] px-4 py-3 text-sm"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-white/58">配图说明</span>
              <textarea
                value={editRewritten}
                onChange={(e) => setEditRewritten(e.target.value)}
                rows={6}
                className="theme-input rounded-[16px] px-4 py-3 text-sm leading-7"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/58">视觉重点（逗号隔开）</span>
                <input
                  value={editVisualPriority}
                  onChange={(e) => setEditVisualPriority(e.target.value)}
                  placeholder="如：火箭发射, 火焰尾迹"
                  className="theme-input rounded-[16px] px-4 py-3 text-sm"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/58">避免项（逗号隔开）</span>
                <input
                  value={editAvoid}
                  onChange={(e) => setEditAvoid(e.target.value)}
                  placeholder="如：手部特写, 文字叠加"
                  className="theme-input rounded-[16px] px-4 py-3 text-sm"
                />
              </label>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-[var(--text-inverse)]">参考与素材</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedScene.references.length > 0 ? (
                selectedScene.references.map((reference) => <Tag key={reference.id}>{reference.type}</Tag>)
              ) : (
                <Tag tone="warning">No references</Tag>
              )}
              {selectedScene.requiredAssets.map((asset) => (
                <Tag key={asset}>{asset}</Tag>
              ))}
            </div>
            {selectedScene.missing.length > 0 ? (
              <div className="mt-3 text-[var(--danger-text)]">{selectedScene.missing.join("；")}</div>
            ) : (
              <div className="mt-3 text-[var(--ok-text)]">当前条目的参考与素材已基本齐备。</div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void saveScene()} disabled={pending !== null || selectedIsFrameOnly}>
              {pending === "save" ? "保存中..." : "保存配图说明"}
            </Button>
            <Button variant="secondary" onClick={() => void rerunClassification()} disabled={pending !== null || selectedIsFrameOnly}>
              {pending === "classify" ? "重跑中..." : "重跑条目分类"}
            </Button>
            <Button variant="secondary" onClick={() => void rerunAssets()} disabled={pending !== null || selectedIsFrameOnly}>
              {pending === "assets" ? "分析中..." : "重跑素材判断"}
            </Button>
            <Button variant="ghost" onClick={() => setShowAdvanced((value) => !value)}>
              {showAdvanced ? "收起高级信息" : "展开高级信息"}
            </Button>
          </div>

          <div className="space-y-3 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
            <div className="text-sm font-medium text-[var(--text-inverse)]">上传参考素材</div>
            {showLocalStorageNotice ? (
              <div className="rounded-2xl border border-[rgba(255,196,128,0.28)] bg-[rgba(255,196,128,0.12)] px-4 py-3 text-xs leading-6 text-[color:rgba(255,236,214,0.92)]">
                当前环境仍使用本地 `public/uploads` 作为素材存储。它适合当前自托管开发与轻量生产，但如果后续要扩大共享或做长期可靠存储，建议切到 S3、R2 或对象存储服务。
              </div>
            ) : null}
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-white/58">Asset Type</span>
              <select
                value={assetType}
                onChange={(event) => setAssetType(event.target.value as (typeof assetTypeOptions)[number])}
                className="theme-input rounded-[16px] px-3 py-3 text-sm"
              >
                {assetTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-white/58">File</span>
              <input
                type="file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="theme-input rounded-[16px] px-3 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--surface-solid)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--text-1)]"
              />
              {selectedFile ? <div className="text-xs text-white/58">{selectedFile.name}</div> : null}
            </label>
            <div className="text-xs text-white/58">
              文件会先上传到当前配置的素材存储，再自动写入素材表并重跑当前条目的素材分析。
              {uploadStorageMode === "tencent_cos" ? " 当前已启用腾讯云对象存储，可用于后续跨实例共享与更稳定的素材沉淀。" : " 当前使用服务端上传和本地存储，建议先控制在 4.5MB 以内，后续再升级对象存储方案。"}
            </div>
            <Button onClick={() => void saveAssetMetadata()} disabled={pending !== null || !selectedFile || selectedIsFrameOnly}>
              {pending === "upload" ? "上传中..." : "上传并更新参考状态"}
            </Button>
          </div>

          <div>
            <div className="text-sm font-medium text-[var(--text-inverse)]">已登记素材</div>
            <div className="mt-3 space-y-2">
              {selectedScene.uploadedAssets.length ? (
                selectedScene.uploadedAssets.map((asset) => (
                  <div key={asset.id} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2">
                    <div className="text-sm text-[var(--text-inverse)]">
                      {asset.fileUrl ? (
                        <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="underline decoration-[rgba(255,255,255,0.18)] underline-offset-4">
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
                <div>尚未登记参考素材。</div>
              )}
            </div>
          </div>

          {showAdvanced ? (
            <>
              <div>
                <div className="text-sm font-medium text-[var(--text-inverse)]">画面计划</div>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-white/58">Composition</div>
                    <div className="mt-2 text-sm leading-7 text-white/88">{selectedScene.compositionNotes ?? "暂无构图说明。"}</div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/58">Camera</div>
                      <div className="mt-2 text-sm leading-7 text-white/88">{selectedScene.cameraPlan ?? "未指定 camera plan。"}</div>
                    </div>
                    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/58">Motion</div>
                      <div className="mt-2 text-sm leading-7 text-white/88">{selectedScene.motionPlan ?? "未指定 motion plan。"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-[var(--text-inverse)]">Prompt 与文案</div>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-white/58">Visual Prompt</div>
                    <div className="mt-2 text-sm leading-7 text-white/90">{selectedScene.visualPrompt ?? selectedScene.rewritten}</div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/58">Narration</div>
                      <div className="mt-2 text-sm leading-7 text-white/88">{selectedScene.narrationText ?? "无旁白补充。"}</div>
                    </div>
                    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/58">On-screen Text</div>
                      <div className="mt-2 text-sm leading-7 text-white/88">{selectedScene.onScreenText ?? "无字幕/贴片要求。"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-[var(--text-inverse)]">风险提示</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedScene.riskFlags.length ? selectedScene.riskFlags.map((flag) => <Tag key={flag} tone="danger">{flag}</Tag>) : <Tag tone="success">暂无明显风险</Tag>}
                </div>
              </div>
            </>
          ) : null}

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
                      : lastAction === "upload"
                        ? () => void saveAssetMetadata()
                        : undefined
              }
            />
          ) : null}
        </DetailPanel>
      </div>
    </div>
  );
}
