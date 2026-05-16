"use client";

import { useState } from "react";
import { PanelCard } from "@/components/ui/panel-card";
import { Tag } from "@/components/ui/tag";
import { renderAudiencePanel } from "@/components/workspace/script-lab-audience-panel";
import type { ScriptDraftPreview } from "@/components/workspace/script-lab-types";
import type { AudiencePanelReview } from "@/lib/copy-review-panel";

export type ScriptDraftSections = {
  title: string;
  opening: string;
  body: string;
  closing: string;
};

export function ScriptLabDraftReviewPanel({
  latestDraftPreview,
  latestDraftSections,
  latestDraftAudiencePanel,
}: {
  latestDraftPreview: ScriptDraftPreview;
  latestDraftSections: ScriptDraftSections;
  latestDraftAudiencePanel: AudiencePanelReview | null;
}) {
  const [showReview, setShowReview] = useState(false);
  const averageScore = latestDraftAudiencePanel?.averageScore;
  const shortVerdict = latestDraftAudiencePanel
    ? latestDraftAudiencePanel.publishReadiness === "READY"
      ? `正文检查：可继续${averageScore ? ` · ${averageScore} 分` : ""}`
      : `正文检查：建议轻改${averageScore ? ` · ${averageScore} 分` : ""}`
    : "正文检查：先确认文章读起来像真人写的。";

  return (
    <PanelCard title="正文检查" description="先确认文章读起来像真人写的。">
      <div className="grid gap-6">
        <div className="space-y-4">
          <div className="theme-panel-muted rounded-[14px] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">主稿标题</div>
                <div className="mt-2 text-lg font-semibold text-[var(--text-1)]">
                  {latestDraftSections.title || "当前主稿"}
                </div>
              </div>
              {latestDraftPreview.versionNumber ? <Tag>{`v${latestDraftPreview.versionNumber}`}</Tag> : null}
            </div>
          </div>

          {latestDraftSections.opening ? (
            <div className="theme-panel-muted rounded-[14px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">开头</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-1)]">
                {latestDraftSections.opening}
              </div>
            </div>
          ) : null}

          {latestDraftSections.body ? (
            <div className="theme-panel-muted rounded-[14px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">主体</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-1)]">{latestDraftSections.body}</div>
            </div>
          ) : null}

          {latestDraftSections.closing ? (
            <div className="theme-panel-muted rounded-[14px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">结尾</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-1)]">
                {latestDraftSections.closing}
              </div>
            </div>
          ) : null}
        </div>

        <div className="theme-panel-muted rounded-[14px] p-4">
          <button
            type="button"
            onClick={() => setShowReview((value) => !value)}
            className="text-sm font-medium text-[var(--text-1)] underline decoration-[var(--border)] underline-offset-4"
          >
            {showReview ? "收起复核详情" : shortVerdict}
          </button>
          {showReview ? (
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">观众评分</div>
              {renderAudiencePanel(latestDraftAudiencePanel, "系统完成主稿复核后，这里会出现多观众评分。")}
            </div>
          ) : null}
        </div>
      </div>
    </PanelCard>
  );
}
