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
        <div className="grid gap-3 md:grid-cols-2">
          {(["MARS_CITIZEN", "MARKETING"] as const).map((line) => {
            const meta = getContentLineMeta(line, locale);
            const active = contentLine === line;
            return (
              <button
                key={line}
                type="button"
                onClick={() => onContentLineChange(line)}
                className={cn(
                  "rounded-[24px] border p-4 text-left transition",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{meta.icon}</span>
                  <div className="text-base font-semibold text-[var(--text-1)]">{meta.label}</div>
                </div>
                <div className="mt-3 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
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
                  "rounded-[20px] border p-4 text-left transition",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
                )}
              >
                <div className="text-sm font-semibold text-[var(--text-1)]">{meta.label}</div>
                <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
