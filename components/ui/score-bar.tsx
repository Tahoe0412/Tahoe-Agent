import { cn } from "@/lib/utils";

export function ScoreBar({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-[var(--text-2)]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-muted)]">
        <div className="h-2 rounded-full bg-[var(--surface-strong)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
