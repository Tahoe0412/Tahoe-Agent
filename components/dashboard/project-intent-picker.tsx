"use client";

import {
  getContentLineMeta,
  getOutputTypeMeta,
  getOutputTypesForLine,
  type ContentLine,
  type OutputType,
} from "@/lib/content-line";
import { cn } from "@/lib/utils";

export function ProjectIntentPicker({
  contentLine,
  outputType,
  locale,
  onContentLineChange,
  onOutputTypeChange,
}: {
  contentLine: ContentLine;
  outputType: OutputType;
  locale: "zh" | "en";
  onContentLineChange: (next: ContentLine) => void;
  onOutputTypeChange: (next: OutputType) => void;
}) {
  const ui = locale === "en"
    ? {
        contentLine: "Business Line",
        outputType: "Target Output",
      }
    : {
        contentLine: "业务主线",
        outputType: "目标产物",
      };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="text-sm font-medium text-[var(--text-2)]">{ui.contentLine}</div>
        <div className="grid gap-4 md:grid-cols-2">
          {(["MARS_CITIZEN", "MARKETING"] as const).map((line) => {
            const meta = getContentLineMeta(line, locale);
            const active = contentLine === line;
            const Icon = meta.icon;
            return (
              <button
                key={line}
                type="button"
                onClick={() => onContentLineChange(line)}
                className={cn(
                  "group rounded-2xl border p-5 text-left transition duration-300",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
                    : "border-[var(--border-soft)] bg-[var(--surface-solid)] hover:-translate-y-0.5 hover:border-[var(--border)] hover:shadow-md",
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    active ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-2)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)]"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-base font-semibold tracking-tight text-[var(--text-1)]">{meta.label}</div>
                </div>
                <div className="mt-4 text-sm leading-relaxed text-[var(--text-2)]">{meta.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-[var(--text-2)]">{ui.outputType}</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {getOutputTypesForLine(contentLine).map((type) => {
            const meta = getOutputTypeMeta(type, locale);
            const active = outputType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onOutputTypeChange(type)}
                className={cn(
                  "rounded-xl border p-4 text-left transition duration-200",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
                    : "border-[var(--border-soft)] bg-[var(--surface-solid)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]",
                )}
              >
                <div className="text-sm font-semibold tracking-tight text-[var(--text-1)]">{meta.label}</div>
                <div className="mt-1.5 text-sm leading-relaxed text-[var(--text-2)]">{meta.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
