export function ScoreRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid size-16 place-items-center rounded-full shadow-inner"
        style={{
          background: `conic-gradient(var(--surface-strong) ${value * 3.6}deg, var(--surface-muted) 0deg)`,
        }}
      >
        <div className="grid size-11 place-items-center rounded-full bg-[var(--surface-solid)] text-xs font-semibold text-[var(--text-1)] shadow-sm">
          {value}
        </div>
      </div>
      <div className="min-w-0">
        <div className="line-clamp-2 text-sm font-medium text-[var(--text-1)]">{label}</div>
        <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-3)]">综合分数</div>
      </div>
    </div>
  );
}
