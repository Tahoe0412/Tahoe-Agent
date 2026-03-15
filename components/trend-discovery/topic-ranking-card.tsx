import { Flame, TrendingUp, Minus, ExternalLink } from "lucide-react";
import type { TopicRankingItem, TopicHeatLevel } from "@/types/trend-discovery";

const HEAT_CONFIG: Record<TopicHeatLevel, { icon: typeof Flame; label: string; className: string }> = {
  HOT: { icon: Flame, label: "爆发", className: "border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400" },
  RISING: { icon: TrendingUp, label: "上升", className: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400" },
  STABLE: { icon: Minus, label: "平稳", className: "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400" },
};

interface TopicRankingCardProps {
  item: TopicRankingItem;
  onCreateProject?: (topicKey: string, label: string) => void;
}

export function TopicRankingCard({ item, onCreateProject }: TopicRankingCardProps) {
  const heat = HEAT_CONFIG[item.heatLevel];
  const HeatIcon = heat.icon;

  return (
    <div className="group rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-5 transition hover:border-[var(--accent)] hover:shadow-[0_8px_24px_rgba(75,143,106,0.08)]">
      {/* Header: rank + name + heat badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-sm font-bold text-[var(--text-2)]">
            {item.rank}
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold text-[var(--text-1)]">{item.label}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-3)]">
              <span>{item.sourcePlatforms.join(" · ")}</span>
              <span>·</span>
              <span>{item.evidenceCount} 条证据</span>
              <span>·</span>
              <span>{item.score} 分</span>
            </div>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${heat.className}`}>
          <HeatIcon className="size-3" />
          {heat.label}
        </span>
      </div>

      {/* Evidence preview */}
      {item.topEvidence.length > 0 && (
        <div className="mt-4 space-y-2">
          {item.topEvidence.map((evidence, idx) => (
            <a
              key={idx}
              href={evidence.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-2)] transition hover:bg-[var(--surface-solid)] hover:text-[var(--text-1)]"
            >
              <ExternalLink className="size-3 shrink-0 text-[var(--text-3)]" />
              <span className="min-w-0 truncate">{evidence.title}</span>
              <span className="ml-auto shrink-0 text-[var(--text-3)]">{evidence.platform}</span>
            </a>
          ))}
        </div>
      )}

      {/* CTA */}
      {onCreateProject && (
        <button
          type="button"
          onClick={() => onCreateProject(item.topicKey, item.label)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-medium text-[var(--accent-strong)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          用这个建项目 →
        </button>
      )}
    </div>
  );
}
