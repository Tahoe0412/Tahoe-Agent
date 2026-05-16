export function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="theme-panel-muted rounded-[16px] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-[var(--text-1)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--text-2)]">{caption}</div>
    </div>
  );
}
