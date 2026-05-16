export function ScoreRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-[var(--border)] py-3">
      <div className="min-w-12 text-2xl font-semibold text-[var(--text-1)]">
        {value}
      </div>
      <div className="min-w-0">
        <div className="line-clamp-2 text-sm font-medium text-[var(--text-1)]">{label}</div>
        <div className="theme-kicker text-[10px] text-[var(--text-3)]">综合分数</div>
      </div>
    </div>
  );
}
