"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { apiRequest } from "@/lib/client-api";
import type { WorkspaceMode } from "@/lib/workspace-mode";

export function WorkflowActions({ projectId, workspaceMode = "SHORT_VIDEO" }: { projectId: string; workspaceMode?: WorkspaceMode }) {
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

  return (
    <div className="theme-panel rounded-[24px] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium text-[var(--text-1)]">流程操作</div>
          <div className="mt-1 text-sm text-[var(--text-2)]">
            {workspaceMode === "SHORT_VIDEO"
              ? "一键串联趋势研究、脚本重构、场景分类、素材判断和报告生成。"
              : workspaceMode === "COPYWRITING"
                ? "当前以文案与平台改写为主，建议优先用任务单、趋势和内容运营模块。"
                : "当前以宣传推广为主，建议优先用任务单、内容运营和合规检查模块。"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {workspaceMode === "SHORT_VIDEO" ? (
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
      {workspaceMode !== "SHORT_VIDEO" ? (
        <div className="mt-3 text-sm text-[var(--text-3)]">
          当前项目不是“短视频模式”，所以隐藏了视频编排型全流程按钮。
        </div>
      ) : null}
      {message ? <div className="mt-3 text-sm text-[var(--text-2)]">{message}</div> : null}
      {error ? <div className="mt-3"><ErrorNotice error={error} onRetry={lastAction ? () => void run(lastAction) : undefined} /></div> : null}
    </div>
  );
}
