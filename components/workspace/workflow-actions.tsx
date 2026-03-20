"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { apiRequest } from "@/lib/client-api";
import type { ContentLine, OutputType } from "@/lib/content-line";
import type { WorkspaceMode } from "@/lib/workspace-mode";

export function WorkflowActions({
  projectId,
  workspaceMode = "SHORT_VIDEO",
  contentLine,
  outputType,
}: {
  projectId: string;
  workspaceMode?: WorkspaceMode;
  contentLine?: ContentLine;
  outputType?: OutputType;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<"full" | "report" | null>(null);
  const [lastAction, setLastAction] = useState<"full" | "report" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function run(mode: "full" | "report") {
    setPending(mode);
    setLastAction(mode);
    setMessage(null);
    setError(null);
    try {
      await apiRequest<{ scene_count?: number }>(`/api/projects/${projectId}/workflow/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      });

      setMessage(mode === "full" ? "全流程已执行，已更新项目数据。" : "研究报告已重新生成。");

      const query = new URLSearchParams(searchParams.toString());
      query.set("projectId", projectId);
      router.replace(`${pathname}?${query.toString()}` as Route);
      router.refresh();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(null);
    }
  }

  const isStoryboardOutput = outputType === "STORYBOARD_SCRIPT" || outputType === "AD_STORYBOARD";
  const isMarsCitizen = contentLine === "MARS_CITIZEN" || (!contentLine && workspaceMode === "SHORT_VIDEO");
  const showFullWorkflow = isMarsCitizen || isStoryboardOutput;

  return (
    <div className="theme-panel rounded-[24px] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium text-[var(--text-1)]">流程操作</div>
          <div className="mt-1 text-sm text-[var(--text-2)]">
            {showFullWorkflow
              ? "一键串联趋势研究，并在条件满足时继续推进脚本、分镜、素材判断和报告。"
              : "当前项目更适合先产出营销内容，再按需要补充合规与报告。"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {showFullWorkflow ? (
            <Button onClick={() => void run("full")} disabled={pending !== null}>
              {pending === "full" ? "运行中..." : "运行全流程"}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => void run("report")} disabled={pending !== null}>
            {pending === "report" ? "生成中..." : "仅生成报告"}
          </Button>
          <Button variant="ghost" onClick={() => router.refresh()} disabled={pending !== null}>
            刷新
          </Button>
        </div>
      </div>
      {!showFullWorkflow ? (
        <div className="mt-3 text-sm text-[var(--text-3)]">
          当前目标不是脚本 / 分镜型产物，所以默认只保留报告刷新，避免把不必要流程暴露到前台。
        </div>
      ) : null}
      {message ? <div className="mt-3 text-sm text-[var(--text-2)]">{message}</div> : null}
      {error ? <div className="mt-3"><ErrorNotice error={error} onRetry={lastAction ? () => void run(lastAction) : undefined} /></div> : null}
    </div>
  );
}
