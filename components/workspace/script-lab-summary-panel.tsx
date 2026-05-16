import { PanelCard } from "@/components/ui/panel-card";

export type ScriptLabFeedback = {
  completed: string;
  weakest: string;
  next: string;
};

export function ScriptLabSummaryPanel({ feedback }: { feedback: ScriptLabFeedback }) {
  return (
    <PanelCard title="下一步" description="">
      <div className="border-y border-[var(--border)] bg-[var(--surface-muted)] py-4 text-sm leading-7 text-[var(--text-1)]">
        {feedback.next}
      </div>
    </PanelCard>
  );
}
