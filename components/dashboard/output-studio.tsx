"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Copy, FileText, Layers3, Loader2, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { apiRequest } from "@/lib/client-api";
import {
  getOutputTypeMeta,
  type ContentLine,
  type OutputType,
} from "@/lib/content-line";
import { cn } from "@/lib/utils";

type OutputStudioItem = {
  outputType: OutputType;
  icon: React.ComponentType<{ className?: string }>;
};

const outputItemsByLine: Record<ContentLine, OutputStudioItem[]> = {
  MARS_CITIZEN: [
    { outputType: "VIDEO_TITLE", icon: Type },
    { outputType: "PUBLISH_COPY", icon: Copy },
    { outputType: "STORYBOARD_SCRIPT", icon: Clapperboard },
  ],
  MARKETING: [
    { outputType: "PLATFORM_COPY", icon: FileText },
    { outputType: "AD_CREATIVE", icon: Sparkles },
    { outputType: "AD_STORYBOARD", icon: Layers3 },
  ],
};

type GenerateResult = {
  outputType: string;
  artifactKind: "strategy_task" | "storyboard";
  artifactId: string;
  title: string;
  summary?: string | null;
};

export function OutputStudio({
  projectId,
  contentLine,
  currentOutputType,
  locale = "zh",
}: {
  projectId: string;
  contentLine: ContentLine;
  currentOutputType: OutputType;
  locale?: "zh" | "en";
}) {
  const router = useRouter();
  const [pendingOutput, setPendingOutput] = useState<OutputType | null>(null);
  const [lastResult, setLastResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isPending, startTransition] = useTransition();

  const items = useMemo(() => outputItemsByLine[contentLine], [contentLine]);
  const ui = locale === "en"
    ? {
        eyebrow: "Output Studio",
        title: "Generate the next artifact directly",
        description: "Pick one concrete deliverable. Tahoe should feel like an editor's bench, not a workflow map.",
        current: "Current target",
        suggested: "Suggested next outputs",
        generating: "Generating...",
        generate: "Generate",
        currentBadge: "Current",
        newBadge: "Quick Generate",
        latest: "Latest result",
      }
    : {
        eyebrow: "Output Studio",
        title: "直接生成下一份产物",
        description: "每次只选一个明确产物。Tahoe 更应该像编辑台，而不是流程图。",
        current: "当前目标",
        suggested: "推荐继续生成",
        generating: "生成中...",
        generate: "直接生成",
        currentBadge: "当前目标",
        newBadge: "快速生成",
        latest: "最近结果",
      };

  async function handleGenerate(outputType: OutputType) {
    setPendingOutput(outputType);
    setError(null);
    setLastResult(null);
    try {
      const result = await apiRequest<GenerateResult>(`/api/projects/${projectId}/generate-output`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputType }),
      });
      setLastResult(result);

      startTransition(() => {
        if (outputType === "STORYBOARD_SCRIPT" || outputType === "AD_STORYBOARD") {
          router.push(`/scene-planner?projectId=${projectId}`);
          return;
        }

        if (outputType === "PLATFORM_COPY" || outputType === "AD_CREATIVE") {
          router.push(`/marketing-ops?projectId=${projectId}`);
          return;
        }

        if (outputType === "VIDEO_TITLE" || outputType === "PUBLISH_COPY") {
          router.push(`/script-lab?projectId=${projectId}`);
          return;
        }

        router.refresh();
      });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPendingOutput(null);
    }
  }

  return (
    <section className="theme-panel theme-output-studio rounded-[30px] p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[var(--border-soft)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="theme-kicker text-[11px] font-semibold text-[var(--accent-strong)]">{ui.eyebrow}</div>
          <h3 className="theme-font-display mt-2 text-[2rem] leading-[1.02] tracking-tight text-[var(--text-1)] sm:text-[2.2rem]">
            {ui.title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-[var(--text-2)]">{ui.description}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-solid)_76%,transparent)] px-4 py-3 text-sm text-[var(--text-2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-3)]">{ui.current}</span>
          <div className="mt-1 font-medium text-[var(--text-1)]">{getOutputTypeMeta(currentOutputType, locale).label}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const meta = getOutputTypeMeta(item.outputType, locale);
          const active = item.outputType === currentOutputType;
          const Icon = item.icon;
          const loading = pendingOutput === item.outputType;

          return (
            <article
              key={item.outputType}
              className={cn(
                "theme-output-card rounded-[26px] border p-5",
                active
                  ? "border-[color:color-mix(in_srgb,var(--accent)_44%,white)] bg-[linear-gradient(160deg,rgba(34,184,207,0.12),rgba(255,255,255,0.72))]"
                  : "border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.5))]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="theme-output-icon flex size-11 items-center justify-center rounded-2xl">
                  <Icon className="size-5 text-[var(--accent-strong)]" />
                </div>
                <span className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                  active
                    ? "bg-[var(--accent)]/12 text-[var(--accent-strong)]"
                    : "bg-[var(--surface-muted)] text-[var(--text-3)]",
                )}>
                  {active ? ui.currentBadge : ui.newBadge}
                </span>
              </div>

              <div className="mt-5">
                <div className="text-lg font-semibold text-[var(--text-1)]">{meta.label}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--text-2)]">{meta.description}</p>
              </div>

              <div className="mt-6">
                <Button
                  variant={active ? "primary" : "secondary"}
                  className={cn("w-full justify-center", !active && "shadow-none")}
                  disabled={pendingOutput !== null || isPending}
                  onClick={() => void handleGenerate(item.outputType)}
                >
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {loading ? ui.generating : ui.generate}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {lastResult ? (
        <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-solid)_78%,transparent)] px-5 py-4 text-sm leading-7 text-[var(--text-2)]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">{ui.latest}</div>
          <div className="mt-2 text-base font-semibold text-[var(--text-1)]">{lastResult.title}</div>
          {lastResult.summary ? <div className="mt-1">{lastResult.summary}</div> : null}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5">
          <ErrorNotice error={error} />
        </div>
      ) : null}
    </section>
  );
}
