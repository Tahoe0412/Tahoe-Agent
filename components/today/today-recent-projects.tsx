import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecentProject {
  id: string;
  title: string;
  topic_query: string;
  status: string;
}

interface TodayRecentProjectsProps {
  projects: RecentProject[];
  locale: "zh" | "en";
  onProjectClick: (id: string) => void;
}

export function TodayRecentProjects({
  projects,
  locale,
  onProjectClick,
}: TodayRecentProjectsProps) {
  if (projects.length === 0) return null;

  const t = locale === "zh";

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Clock className="size-5 text-[var(--text-3)]" />
        <h3 className="text-base font-semibold text-[var(--text-1)]">
          {t ? "最近项目" : "Recent Projects"}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.slice(0, 6).map((project) => (
          <button
            key={project.id}
            onClick={() => onProjectClick(project.id)}
            className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--text-1)]">
                {project.title}
              </div>
              <div className="mt-1 truncate text-xs text-[var(--text-3)]">
                {project.topic_query}
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                project.status === "DONE"
                  ? "bg-[var(--ok-bg)] text-[var(--ok-text)]"
                  : "bg-[var(--accent-soft)] text-[var(--accent)]"
              )}
            >
              {project.status === "DONE"
                ? t
                  ? "已完成"
                  : "Done"
                : t
                  ? "进行中"
                  : "Active"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
