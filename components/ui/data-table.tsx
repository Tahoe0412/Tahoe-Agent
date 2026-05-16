import type { ReactNode } from "react";

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden border-y border-[var(--border)]">
      <div className="grid border-b border-[var(--border)] bg-transparent px-4 py-3 text-xs font-semibold text-[var(--text-3)]" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
        {headers.map((header) => (
          <div key={header}>{header}</div>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid items-start border-t border-[var(--border-soft)] px-4 py-4 text-sm text-[var(--text-2)]"
          style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, cellIndex) => (
            <div key={cellIndex}>{cell}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
