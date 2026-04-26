"use client";

import {
  getContentLineMeta,
  getOutputTypeMeta,
  getOutputTypesForLine,
  type ContentLine,
  type OutputType,
} from "@/lib/content-line";
import { cn } from "@/lib/utils";
import { FileText, Images, Type, AlignLeft, Send } from "lucide-react";

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
        <div className="grid border-t border-[var(--border)] md:grid-cols-2">
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
                  "group border-b border-[var(--border)] p-4 text-left transition duration-200 md:border-r md:last:border-r-0",
                  active
                    ? "bg-[var(--accent-soft)]"
                    : "bg-transparent hover:bg-[var(--surface-muted)]",
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                    active ? "border-[var(--accent)] text-[var(--accent-strong)]" : "border-[var(--border)] text-[var(--text-2)] group-hover:text-[var(--accent)]"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-base font-semibold tracking-tight text-[var(--text-1)]">{meta.label}</div>
                </div>
                <div className="mt-4 text-sm leading-relaxed text-[var(--text-2)]">{meta.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {contentLine === "MARS_CITIZEN" ? (
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--text-2)]">
            {locale === "en" ? "Default package" : "默认内容包"}
          </div>
          <div className="border-y border-[var(--border)] py-4">
            <div className="grid grid-cols-5 gap-3">
              {[
                { icon: FileText, label: locale === "en" ? "Draft" : "主稿" },
                { icon: Images, label: locale === "en" ? "Image Brief" : "配图说明" },
                { icon: Type, label: locale === "en" ? "Title" : "标题" },
                { icon: AlignLeft, label: locale === "en" ? "Summary" : "摘要" },
                { icon: Send, label: locale === "en" ? "Publish Copy" : "发布文案" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-transparent text-[var(--accent)]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-1)]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--text-2)]">{ui.outputType}</div>
          <div className="grid border-t border-[var(--border)] md:grid-cols-2 xl:grid-cols-3">
            {getOutputTypesForLine(contentLine).map((type) => {
              const meta = getOutputTypeMeta(type, locale);
              const active = outputType === type;
              return (
                <button
                  key={type}
                  type="button"
                onClick={() => onOutputTypeChange(type)}
                className={cn(
                    "border-b border-[var(--border)] p-4 text-left transition duration-200 md:border-r xl:[&:nth-child(3n)]:border-r-0",
                    active
                      ? "bg-[var(--accent-soft)]"
                      : "bg-transparent hover:bg-[var(--surface-muted)]",
                  )}
                >
                  <div className="text-sm font-semibold tracking-tight text-[var(--text-1)]">{meta.label}</div>
                  <div className="mt-1.5 text-sm leading-relaxed text-[var(--text-2)]">{meta.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
