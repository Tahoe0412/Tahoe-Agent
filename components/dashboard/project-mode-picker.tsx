"use client";

import type { WorkspaceMode } from "@/lib/workspace-mode";
import { getWorkspaceModeMeta, workspaceModeList } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";

export function ProjectModePicker({
  value,
  locale,
  onChange,
}: {
  value: WorkspaceMode;
  locale: "zh" | "en";
  onChange: (next: WorkspaceMode) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-[var(--text-2)]">{locale === "en" ? "Work Mode" : "工作模式"}</div>
      <div className="grid gap-3 md:grid-cols-3">
        {workspaceModeList.map((mode) => {
          const meta = getWorkspaceModeMeta(mode, locale);
          const active = value === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={cn(
                "rounded-[24px] border p-4 text-left transition",
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
              )}
            >
              <div className="text-base font-semibold text-[var(--text-1)]">{meta.label}</div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
