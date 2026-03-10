"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";

const stages = ["BRIEF", "RESEARCH", "SCRIPT", "STORYBOARD", "ASSET_PLAN", "RENDER", "DELIVERY"] as const;
const statuses = ["PENDING", "APPROVED", "CHANGES_REQUESTED", "REJECTED"] as const;
const primaryStages = ["BRIEF", "RESEARCH", "SCRIPT"] as const;
const secondaryStages = ["STORYBOARD", "ASSET_PLAN", "RENDER", "DELIVERY"] as const;

type ApprovalRecord = {
  id: string;
  stage: (typeof stages)[number];
  approval_status: (typeof statuses)[number];
  target_version: number;
  reviewer_label: string | null;
  decision_summary: string | null;
  approved_at: Date | null;
};

function toneForStatus(status: (typeof statuses)[number]) {
  if (status === "APPROVED") return "theme-chip-ok";
  if (status === "CHANGES_REQUESTED") return "theme-chip-warn";
  if (status === "REJECTED") return "theme-chip-danger";
  return "theme-chip";
}

function stageLabel(stage: (typeof stages)[number]) {
  const map = {
    BRIEF: "任务单",
    RESEARCH: "研究方向",
    SCRIPT: "主稿 / 脚本",
    STORYBOARD: "分镜",
    ASSET_PLAN: "素材准备",
    RENDER: "出图 / 出片",
    DELIVERY: "最终交付",
  } as const;

  return map[stage];
}

function stageDescription(stage: (typeof stages)[number]) {
  const map = {
    BRIEF: "确认这次到底要做什么、给谁看、希望对方做什么。",
    RESEARCH: "确认趋势和方向是否足够支撑这次表达。",
    SCRIPT: "确认主稿或脚本已经可以进入下一步。",
    STORYBOARD: "确认分镜方向和镜头结构没有跑偏。",
    ASSET_PLAN: "确认需要什么素材、还缺什么。",
    RENDER: "确认生成或制作结果可进入交付。",
    DELIVERY: "确认可以正式对外使用。",
  } as const;

  return map[stage];
}

function statusLabel(status: (typeof statuses)[number]) {
  const map = {
    PENDING: "待确认",
    APPROVED: "通过",
    CHANGES_REQUESTED: "需修改",
    REJECTED: "不通过",
  } as const;

  return map[status];
}

export function ApprovalBoard({
  projectId,
  approvals,
  versionHints,
}: {
  projectId: string;
  approvals: ApprovalRecord[];
  versionHints: Partial<Record<(typeof stages)[number], number>>;
}) {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState<(typeof stages)[number]>(stages[0]);
  const [status, setStatus] = useState<(typeof statuses)[number]>(
    approvals.find((item) => item.stage === stages[0])?.approval_status ?? "PENDING",
  );
  const [reviewerLabel, setReviewerLabel] = useState(approvals.find((item) => item.stage === stages[0])?.reviewer_label ?? "");
  const [decisionSummary, setDecisionSummary] = useState(approvals.find((item) => item.stage === stages[0])?.decision_summary ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedStatus, setShowAdvancedStatus] = useState(false);

  const activeApproval = useMemo(() => approvals.find((item) => item.stage === activeStage) ?? null, [activeStage, approvals]);

  function syncStage(nextStage: (typeof stages)[number]) {
    const nextApproval = approvals.find((item) => item.stage === nextStage) ?? null;
    setActiveStage(nextStage);
    setStatus(nextApproval?.approval_status ?? "PENDING");
    setReviewerLabel(nextApproval?.reviewer_label ?? "");
    setDecisionSummary(nextApproval?.decision_summary ?? "");
    setMessage(null);
    setError(null);
  }

  async function saveApproval() {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/approvals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage: activeStage,
          approval_status: status,
          target_version: versionHints[activeStage] ?? 1,
          reviewer_label: reviewerLabel || undefined,
          decision_summary: decisionSummary || undefined,
        }),
      });

      const payload = (await response.json()) as { success: boolean; error?: { message?: string } };
      if (!payload.success) {
        throw new Error(payload.error?.message || "审批写入失败。");
      }

      setMessage(`${stageLabel(activeStage)} 已更新为“${statusLabel(status)}”。`);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "审批写入失败。");
    } finally {
      setPending(false);
    }
  }

  async function quickSaveApproval(nextStatus: (typeof statuses)[number]) {
    setStatus(nextStatus);
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/approvals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage: activeStage,
          approval_status: nextStatus,
          target_version: versionHints[activeStage] ?? 1,
          reviewer_label: reviewerLabel || undefined,
          decision_summary: decisionSummary || undefined,
        }),
      });

      const payload = (await response.json()) as { success: boolean; error?: { message?: string } };
      if (!payload.success) {
        throw new Error(payload.error?.message || "审批写入失败。");
      }

      setMessage(`${stageLabel(activeStage)} 已更新为“${statusLabel(nextStatus)}”。`);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "审批写入失败。");
      setStatus(activeApproval?.approval_status ?? "PENDING");
    } finally {
      setPending(false);
    }
  }

  return (
    <PanelCard title="审批门" description="把每个阶段的确认动作显式化，避免研究、脚本和分镜直接串线。">
      <div className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-4">
          <div className="space-y-3">
          {primaryStages.map((stage) => {
            const item = approvals.find((record) => record.stage === stage) ?? null;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => syncStage(stage)}
                className={`w-full rounded-[22px] border p-4 text-left transition ${
                  stage === activeStage
                    ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-[var(--text-inverse)]"
                    : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold tracking-[0.04em]">{stageLabel(stage)}</div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      stage === activeStage
                        ? "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.1)] text-[var(--text-inverse)]"
                        : toneForStatus(item?.approval_status ?? "PENDING")
                    }`}
                  >
                    {statusLabel(item?.approval_status ?? "PENDING")}
                  </span>
                </div>
                <div className={`mt-2 text-xs ${stage === activeStage ? "text-[color:rgba(246,240,232,0.72)]" : "text-[var(--text-2)]"}`}>
                  v{item?.target_version ?? versionHints[stage] ?? 1}
                  {item?.reviewer_label ? ` · ${item.reviewer_label}` : ""}
                </div>
                <div className={`mt-3 line-clamp-2 text-sm leading-6 ${stage === activeStage ? "text-[color:rgba(246,240,232,0.84)]" : "text-[var(--text-2)]"}`}>
                  {item?.decision_summary ?? stageDescription(stage)}
                </div>
              </button>
            );
          })}
          </div>

          <Disclosure
            className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4"
            summaryClassName="text-sm font-medium text-[var(--text-1)]"
            contentClassName="mt-3 space-y-3"
            title="制作与交付阶段"
          >
            {secondaryStages.map((stage) => {
              const item = approvals.find((record) => record.stage === stage) ?? null;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => syncStage(stage)}
                  className={`w-full rounded-[18px] border px-4 py-4 text-left transition ${
                    stage === activeStage
                      ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-[var(--text-inverse)]"
                      : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{stageLabel(stage)}</div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        stage === activeStage
                          ? "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.1)] text-[var(--text-inverse)]"
                          : toneForStatus(item?.approval_status ?? "PENDING")
                      }`}
                    >
                      {statusLabel(item?.approval_status ?? "PENDING")}
                    </span>
                  </div>
                  <div className={`mt-2 text-sm leading-6 ${stage === activeStage ? "text-[color:rgba(246,240,232,0.84)]" : "text-[var(--text-2)]"}`}>
                    {item?.decision_summary ?? stageDescription(stage)}
                  </div>
                </button>
              );
            })}
          </Disclosure>
        </div>

        <div className="theme-panel-muted space-y-4 rounded-[24px] p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">当前阶段</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-1)]">{stageLabel(activeStage)}</div>
            <div className="mt-2 text-sm text-[var(--text-2)]">当前目标版本：v{activeApproval?.target_version ?? versionHints[activeStage] ?? 1}</div>
            <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{stageDescription(activeStage)}</div>
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">快速操作</span>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => void quickSaveApproval("APPROVED")} disabled={pending}>
                {pending && status === "APPROVED" ? "保存中..." : "通过当前阶段"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => void quickSaveApproval("CHANGES_REQUESTED")} disabled={pending}>
                {pending && status === "CHANGES_REQUESTED" ? "保存中..." : "标记为需修改"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdvancedStatus((value) => !value)} disabled={pending}>
                {showAdvancedStatus ? "收起高级状态" : "展开高级状态"}
              </Button>
            </div>
          </div>

          {showAdvancedStatus ? (
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">高级状态</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as (typeof statuses)[number])}
                className="theme-input rounded-[16px] px-4 py-3 text-sm"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {statusLabel(item)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">审批人</span>
            <input
              value={reviewerLabel}
              onChange={(event) => setReviewerLabel(event.target.value)}
              className="theme-input rounded-[16px] px-4 py-3 text-sm"
              placeholder="例如 策略负责人"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">结论说明</span>
            <textarea
              value={decisionSummary}
              onChange={(event) => setDecisionSummary(event.target.value)}
              rows={5}
              className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7"
              placeholder="记录为什么通过、为什么要求修改，以及下一步动作。"
            />
          </label>

          <div className="flex items-center gap-3">
            <Button onClick={() => void saveApproval()} disabled={pending}>
              {pending ? "保存中..." : "保存审批结果"}
            </Button>
            {message ? <div className="text-sm text-[var(--ok-text)]">{message}</div> : null}
            {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
