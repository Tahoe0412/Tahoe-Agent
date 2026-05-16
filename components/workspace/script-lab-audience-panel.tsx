import { Tag } from "@/components/ui/tag";
import type { AudiencePanelReview } from "@/lib/copy-review-panel";

export function renderAudiencePanel(panel: AudiencePanelReview | null, empty: string) {
  if (!panel) {
    return <div className="mt-3 text-sm leading-6 text-[var(--text-2)]">{empty}</div>;
  }

  const reviewersByScore = [...panel.reviewers].sort((a, b) => a.score - b.score);
  const weakestReviewer = reviewersByScore[0];
  const secondWeakestReviewer = reviewersByScore[1];
  const revisionSteps = [
    weakestReviewer
      ? {
          label: `先修：${weakestReviewer.label}`,
          text: weakestReviewer.nextAction || weakestReviewer.concerns[0] || weakestReviewer.verdict,
        }
      : null,
    secondWeakestReviewer
      ? {
          label: `再看：${secondWeakestReviewer.label}`,
          text: secondWeakestReviewer.nextAction || secondWeakestReviewer.concerns[0] || secondWeakestReviewer.verdict,
        }
      : null,
  ].filter((item): item is { label: string; text: string } => Boolean(item?.text));

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{`平均分 ${panel.averageScore}`}</Tag>
        <Tag>{`媒体贴合度 ${panel.styleFitScore}`}</Tag>
        <Tag tone={panel.publishReadiness === "READY" ? "success" : "danger"}>
          {panel.publishReadiness === "READY" ? "可继续发布" : "先修再发"}
        </Tag>
      </div>
      <div className="text-sm leading-6 text-[var(--text-1)]">{panel.overallVerdict}</div>
      <div className="text-sm leading-6 text-[var(--text-2)]">{panel.calibrationSummary}</div>
      {revisionSteps.length ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">怎么改</div>
          <div className="mt-2 space-y-2 text-sm leading-6 text-[var(--text-2)]">
            {revisionSteps.map((step) => (
              <div key={step.label}>
                <span className="font-medium text-[var(--text-1)]">{step.label}：</span>
                {step.text}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        {panel.reviewers.map((reviewer) => (
          <div key={reviewer.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3">
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
            {reviewer.nextAction ? (
              <div className="mt-2 rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] px-2 py-2 text-sm leading-6 text-[var(--text-2)]">
                <span className="font-medium text-[var(--text-1)]">建议修改：</span>
                {reviewer.nextAction}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
