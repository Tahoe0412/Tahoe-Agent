"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import type { Locale } from "@/lib/locale";
import { renderJobTypeSchema, renderProviderSchema } from "@/schemas/production-control";

type ScenePlannerRow = {
  id: string;
  frameId: string | null;
  frameOrder: number;
  frameTitle: string;
  shotGoal: string;
  visualPrompt: string | null;
  cameraPlan: string | null;
  motionPlan: string | null;
  references: Array<{
    id: string;
    type: string;
    label: string;
    fileUrl: string | null;
  }>;
};

type RenderJobRow = {
  id: string;
  job_type: string;
  job_status: string;
  provider: string;
  provider_model: string | null;
  created_at: string | Date;
};

const jobTypeOptions = renderJobTypeSchema.options;
const providerOptions = renderProviderSchema.options;

function getStatusTone(status: string) {
  if (status === "SUCCEEDED") return "theme-chip-ok";
  if (status === "FAILED" || status === "CANCELED") return "theme-chip-danger";
  if (status === "RUNNING" || status === "QUEUED") return "theme-chip-warn";
  return "theme-chip";
}

function buildPrompt(row: ScenePlannerRow) {
  return [
    row.visualPrompt?.trim(),
    row.shotGoal?.trim(),
    row.frameTitle?.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildNotes(row: ScenePlannerRow, locale: Locale) {
  const sections = [
    `${locale === "en" ? "Frame" : "镜头标题"}: ${row.frameTitle}`,
    `${locale === "en" ? "Shot Goal" : "画面目标"}: ${row.shotGoal}`,
    row.cameraPlan ? `${locale === "en" ? "Camera" : "运镜计划"}: ${row.cameraPlan}` : "",
    row.motionPlan ? `${locale === "en" ? "Motion" : "动作计划"}: ${row.motionPlan}` : "",
    row.references.length
      ? `${locale === "en" ? "References" : "参考素材"}: ${row.references.map((reference) => reference.label).join(", ")}`
      : "",
  ];

  return sections.filter(Boolean).join("\n");
}

function formatDate(value: string | Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RenderLabWorkbench({
  projectId,
  rows,
  jobs,
  locale,
}: {
  projectId: string;
  rows: ScenePlannerRow[];
  jobs: RenderJobRow[];
  locale: Locale;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [jobType, setJobType] = useState<(typeof jobTypeOptions)[number]>("IMAGE");
  const [provider, setProvider] = useState<(typeof providerOptions)[number]>("COMFYUI");
  const [providerModel, setProviderModel] = useState("flux-dev");
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedScene = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;

  useEffect(() => {
    if (!selectedScene) {
      return;
    }

    setPrompt(buildPrompt(selectedScene));
    setNotes(buildNotes(selectedScene, locale));
    setProviderModel((current) => {
      if (current.trim()) {
        return current;
      }

      return jobType === "VIDEO" ? "kling-v1-6" : "flux-dev";
    });
  }, [jobType, locale, selectedScene]);

  useEffect(() => {
    if (!selectedScene) {
      return;
    }

    if (jobType === "VIDEO" && provider === "COMFYUI") {
      setProvider("KLING");
      setProviderModel("kling-v1-6");
      return;
    }

    if (jobType === "IMAGE" && provider === "KLING") {
      setProvider("COMFYUI");
      setProviderModel("flux-dev");
    }
  }, [jobType, provider, selectedScene]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedScene) {
      return;
    }

    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/render-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script_scene_id: selectedScene.id,
          storyboard_frame_id: selectedScene.frameId ?? undefined,
          job_type: jobType,
          provider,
          provider_model: providerModel.trim() || undefined,
          input_json: {
            prompt,
            notes,
            frame_title: selectedScene.frameTitle,
            shot_goal: selectedScene.shotGoal,
            visual_prompt: selectedScene.visualPrompt,
            camera_plan: selectedScene.cameraPlan,
            motion_plan: selectedScene.motionPlan,
            references: selectedScene.references,
          },
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      if (!payload.success) {
        throw new Error(payload.error?.message || (locale === "en" ? "Failed to create render job." : "创建渲染任务失败。"));
      }

      setMessage(locale === "en" ? "Render job created. The latest jobs list has been refreshed." : "渲染任务已创建，最近任务列表已刷新。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : locale === "en" ? "Failed to create render job." : "创建渲染任务失败。");
    } finally {
      setPending(false);
    }
  }

  if (!selectedScene) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
      <PanelCard
        title={locale === "en" ? "Pick a Scene" : "先选一个场景"}
        description={locale === "en" ? "Use existing storyboard rows as the single source of truth for prompt prep." : "直接复用已有分镜行数据，把场景作为生成任务准备的起点。"}
      >
        <div className="space-y-3">
          {rows.map((row) => {
            const selected = row.id === selectedScene.id;

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setSelectedId(row.id);
                  setMessage(null);
                  setError(null);
                }}
                className={`w-full rounded-[24px] border p-5 text-left transition ${
                  selected ? "theme-panel-strong border-transparent" : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={`text-lg font-semibold ${selected ? "text-[var(--text-inverse)]" : "text-[var(--text-1)]"}`}>
                    #{row.frameOrder} {row.frameTitle}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.references.length > 0 ? "theme-chip-ok" : "theme-chip"}`}>
                    {row.references.length} refs
                  </span>
                </div>
                <p className={`mt-3 text-sm leading-6 ${selected ? "text-[color:rgba(246,240,232,0.76)]" : "text-[var(--text-2)]"}`}>{row.shotGoal}</p>
                <div className={`mt-4 grid gap-3 text-sm ${selected ? "text-[color:rgba(246,240,232,0.8)]" : "text-[var(--text-2)]"}`}>
                  <div className="theme-panel-muted rounded-[18px] p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Prompt Seed" : "提示词种子"}</div>
                    <div className="mt-2 line-clamp-3">{row.visualPrompt || (locale === "en" ? "No visual prompt yet." : "当前还没有视觉提示词。")}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PanelCard>

      <div className="space-y-6">
        <PanelCard
          title={locale === "en" ? "Prepare One Render Job" : "准备一个生成任务"}
          description={locale === "en" ? "Keep the first pass lightweight: review the scene, tweak the prompt, and submit one job." : "第一版只做一件事：看场景、微调提示词、提交一个生成任务。"}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Shot Goal" : "画面目标"}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">{selectedScene.shotGoal}</p>
            </div>
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "References" : "参考素材"}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">
                {selectedScene.references.length
                  ? selectedScene.references.map((reference) => reference.label).join(", ")
                  : locale === "en"
                    ? "No references attached yet."
                    : "当前还没有挂参考素材。"}
              </p>
            </div>
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Camera Plan" : "运镜计划"}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">{selectedScene.cameraPlan || (locale === "en" ? "Not specified yet." : "当前还没有填写。")}</p>
            </div>
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Motion Plan" : "动作计划"}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">{selectedScene.motionPlan || (locale === "en" ? "Not specified yet." : "当前还没有填写。")}</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-[var(--text-2)]">
                <span>{locale === "en" ? "Job Type" : "任务类型"}</span>
                <select
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                  value={jobType}
                  onChange={(event) => setJobType(event.target.value as (typeof jobTypeOptions)[number])}
                >
                  {jobTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-[var(--text-2)]">
                <span>{locale === "en" ? "Provider" : "提供方"}</span>
                <select
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                  value={provider}
                  onChange={(event) => setProvider(event.target.value as (typeof providerOptions)[number])}
                >
                  {providerOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-[var(--text-2)]">
                <span>{locale === "en" ? "Model" : "模型名"}</span>
                <input
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                  value={providerModel}
                  onChange={(event) => setProviderModel(event.target.value)}
                  placeholder={jobType === "VIDEO" ? "kling-v1-6" : "flux-dev"}
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm text-[var(--text-2)]">
              <span>{locale === "en" ? "Prompt" : "提示词"}</span>
              <textarea
                className="min-h-44 w-full rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-4 text-sm leading-6 text-[var(--text-1)] outline-none"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </label>

            <label className="block space-y-2 text-sm text-[var(--text-2)]">
              <span>{locale === "en" ? "Notes" : "备注信息"}</span>
              <textarea
                className="min-h-32 w-full rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-4 text-sm leading-6 text-[var(--text-1)] outline-none"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            {message ? <div className="theme-chip-ok rounded-2xl px-3 py-2 text-sm">{message}</div> : null}
            {error ? <div className="theme-chip-danger rounded-2xl px-3 py-2 text-sm">{error}</div> : null}

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-[var(--text-2)]">
                {locale === "en" ? "The selected scene will be linked to this job." : "提交后会把当前场景与该任务关联起来。"}
              </div>
              <Button disabled={pending || !prompt.trim()} type="submit">
                {pending ? (locale === "en" ? "Creating..." : "创建中...") : locale === "en" ? "Create Render Job" : "创建渲染任务"}
              </Button>
            </div>
          </form>
        </PanelCard>

        <PanelCard
          title={locale === "en" ? "Latest Jobs" : "最近渲染任务"}
          description={locale === "en" ? "Stay on the latest pass instead of managing a huge queue." : "只看最近一批任务，保持这一屏聚焦在最新一轮生成。"}
        >
          <div className="space-y-3">
            {jobs.length ? (
              jobs.map((job) => (
                <div key={job.id} className="grid gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-solid)] p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(job.job_status)}`}>{job.job_status}</span>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">
                      {job.job_type} · {job.provider}
                      {job.provider_model ? ` / ${job.provider_model}` : ""}
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-2)]">{job.id}</div>
                  </div>
                  <div className="text-sm text-[var(--text-2)]">{formatDate(job.created_at, locale)}</div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-solid)] p-5 text-sm leading-6 text-[var(--text-2)]">
                {locale === "en" ? "No render jobs yet. Create the first image or video task from the selected scene." : "还没有渲染任务。先从当前场景创建第一个图片或视频任务。"}
              </div>
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
