"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
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

type RenderJobInput = {
  prompt?: string;
  notes?: string;
  frame_title?: string;
  shot_goal?: string;
  visual_prompt?: string | null;
  camera_plan?: string | null;
  motion_plan?: string | null;
  references?: Array<{
    id?: string;
    type?: string;
    label?: string;
    fileUrl?: string | null;
  }>;
};

type RenderJobRow = {
  id: string;
  job_type: string;
  job_status: string;
  provider: string;
  provider_model: string | null;
  script_scene_id?: string | null;
  storyboard_frame_id?: string | null;
  input_json?: unknown;
  output_json?: unknown;
  error_message?: string | null;
  render_assets?: Array<{
    id: string;
    asset_type?: string;
    file_name?: string;
    file_url?: string | null;
    mime_type?: string | null;
  }>;
  created_at: string | Date;
};

const jobTypeOptions = renderJobTypeSchema.options;
type RenderJobTypeOption = (typeof jobTypeOptions)[number];
type RenderProviderOption = (typeof renderProviderSchema.options)[number];

const providerConfig = {
  IMAGE: {
    defaultProvider: "COMFYUI",
    providers: ["COMFYUI", "CUSTOM"],
    models: {
      COMFYUI: "flux-dev",
      CUSTOM: "custom-image-v1",
    },
  },
  VIDEO: {
    defaultProvider: "KLING",
    providers: ["KLING", "LUMA", "RUNWAY", "CUSTOM"],
    models: {
      KLING: "kling-v1-6",
      LUMA: "dream-machine",
      RUNWAY: "gen-4-turbo",
      CUSTOM: "custom-video-v1",
    },
  },
  VOICE: {
    defaultProvider: "ELEVENLABS",
    providers: ["ELEVENLABS", "CUSTOM"],
    models: {
      ELEVENLABS: "eleven_multilingual_v2",
      CUSTOM: "custom-voice-v1",
    },
  },
  MUSIC: {
    defaultProvider: "CUSTOM",
    providers: ["CUSTOM"],
    models: {
      CUSTOM: "musicgen-v1",
    },
  },
  PACKAGE: {
    defaultProvider: "CUSTOM",
    providers: ["CUSTOM"],
    models: {
      CUSTOM: "delivery-package-v1",
    },
  },
} as const satisfies Record<
  RenderJobTypeOption,
  {
    defaultProvider: RenderProviderOption;
    providers: RenderProviderOption[];
    models: Partial<Record<RenderProviderOption, string>>;
  }
>;

function getStatusTone(status: string) {
  if (status === "SUCCEEDED") return "theme-chip-ok";
  if (status === "FAILED" || status === "CANCELED") return "theme-chip-danger";
  if (status === "RUNNING" || status === "QUEUED") return "theme-chip-warn";
  return "theme-chip";
}

function buildPrompt(row: ScenePlannerRow) {
  return [row.visualPrompt?.trim(), row.shotGoal?.trim(), row.frameTitle?.trim()].filter(Boolean).join("\n\n");
}

function buildNotes(row: ScenePlannerRow, locale: Locale) {
  const sections = [
    `${locale === "en" ? "Frame" : "镜头标题"}: ${row.frameTitle}`,
    `${locale === "en" ? "Shot Goal" : "画面目标"}: ${row.shotGoal}`,
    row.cameraPlan ? `${locale === "en" ? "Camera" : "运镜计划"}: ${row.cameraPlan}` : "",
    row.motionPlan ? `${locale === "en" ? "Motion" : "动作计划"}: ${row.motionPlan}` : "",
    row.references.length ? `${locale === "en" ? "References" : "参考素材"}: ${row.references.map((reference) => reference.label).join(", ")}` : "",
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

function trimPreview(value: string | null | undefined, fallback: string, length = 120) {
  const text = value?.trim();
  if (!text) {
    return fallback;
  }

  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function getDefaultModel(jobType: RenderJobTypeOption, provider: RenderProviderOption) {
  const models = providerConfig[jobType].models as Partial<Record<RenderProviderOption, string>>;
  return models[provider] ?? "";
}

function getJobInput(job: RenderJobRow) {
  if (!job.input_json || typeof job.input_json !== "object") {
    return {} as RenderJobInput;
  }

  return job.input_json as RenderJobInput;
}

function getJobOutput(job: RenderJobRow) {
  if (!job.output_json || typeof job.output_json !== "object") {
    return {} as Record<string, unknown>;
  }

  return job.output_json as Record<string, unknown>;
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
  const [sceneSearch, setSceneSearch] = useState("");
  const [sceneFilter, setSceneFilter] = useState<"ALL" | "REFERENCED" | "PROMPT_READY">("ALL");
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? "");
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState<"ALL" | RenderJobRow["job_status"]>("ALL");
  const [jobScope, setJobScope] = useState<"ALL" | "SELECTED_SCENE">("ALL");
  const [jobSort, setJobSort] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [jobType, setJobType] = useState<RenderJobTypeOption>("IMAGE");
  const [provider, setProvider] = useState<RenderProviderOption>(providerConfig.IMAGE.defaultProvider);
  const [providerModel, setProviderModel] = useState(getDefaultModel("IMAGE", providerConfig.IMAGE.defaultProvider));
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedScene = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;
  const availableProviders = providerConfig[jobType].providers;
  const filteredRows = useMemo(() => {
    const query = sceneSearch.trim().toLowerCase();

    return rows.filter((row) => {
      if (sceneFilter === "REFERENCED" && row.references.length === 0) {
        return false;
      }

      if (sceneFilter === "PROMPT_READY" && !row.visualPrompt?.trim()) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [row.frameTitle, row.shotGoal, row.visualPrompt ?? "", row.references.map((reference) => reference.label).join(" ")].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, sceneFilter, sceneSearch]);
  const filteredJobs = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    const items = jobs.filter((job) => {
      if (jobStatusFilter !== "ALL" && job.job_status !== jobStatusFilter) {
        return false;
      }

      if (jobScope === "SELECTED_SCENE" && selectedScene) {
        const sceneLinked = job.script_scene_id === selectedScene.id || (selectedScene.frameId && job.storyboard_frame_id === selectedScene.frameId);
        if (!sceneLinked) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const input = getJobInput(job);
      const linkedScene =
        rows.find((row) => row.id === job.script_scene_id) ??
        rows.find((row) => row.frameId && row.frameId === job.storyboard_frame_id) ??
        null;
      const haystack = [
        input.frame_title,
        input.prompt,
        input.notes,
        input.shot_goal,
        linkedScene?.frameTitle,
        linkedScene?.shotGoal,
        job.provider,
        job.provider_model,
        job.job_type,
        job.job_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    return [...items].sort((a, b) => {
      const timeDelta = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return jobSort === "NEWEST" ? timeDelta : -timeDelta;
    });
  }, [jobScope, jobSearch, jobSort, jobStatusFilter, jobs, rows, selectedScene]);
  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) ?? jobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0] ?? jobs[0] ?? null;

  useEffect(() => {
    if (!filteredRows.find((row) => row.id === selectedId)) {
      setSelectedId(filteredRows[0]?.id ?? rows[0]?.id ?? "");
    }
  }, [filteredRows, rows, selectedId]);

  useEffect(() => {
    if (!filteredJobs.find((job) => job.id === selectedJobId) && !jobs.find((job) => job.id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0]?.id ?? jobs[0]?.id ?? "");
    }
  }, [filteredJobs, jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedScene) {
      return;
    }

    setPrompt(buildPrompt(selectedScene));
    setNotes(buildNotes(selectedScene, locale));
  }, [locale, selectedScene]);

  function updateJobType(nextJobType: RenderJobTypeOption) {
    const allowedProviders = providerConfig[nextJobType].providers as RenderProviderOption[];
    const nextProvider = allowedProviders.includes(provider) ? provider : providerConfig[nextJobType].defaultProvider;
    setJobType(nextJobType);
    setProvider(nextProvider);
    setProviderModel(getDefaultModel(nextJobType, nextProvider));
  }

  function updateProvider(nextProvider: RenderProviderOption) {
    setProvider(nextProvider);
    setProviderModel(getDefaultModel(jobType, nextProvider));
  }

  function reuseSelectedJob() {
    if (!selectedJob) {
      return;
    }

    const input = getJobInput(selectedJob);

    if (selectedJob.script_scene_id) {
      setSelectedId(selectedJob.script_scene_id);
    }

    updateJobType(selectedJob.job_type as RenderJobTypeOption);
    updateProvider(selectedJob.provider as RenderProviderOption);
    setProviderModel(selectedJob.provider_model || getDefaultModel(selectedJob.job_type as RenderJobTypeOption, selectedJob.provider as RenderProviderOption));
    setPrompt(input.prompt || input.visual_prompt || "");
    setNotes(input.notes || "");
    setMessage(locale === "en" ? "The form has been prefilled from the selected job." : "已基于当前任务回填表单，可继续迭代。");
    setError(null);
  }

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
        data?: { id?: string };
        error?: { message?: string };
      };

      if (!payload.success) {
        throw new Error(payload.error?.message || (locale === "en" ? "Failed to create render job." : "创建渲染任务失败。"));
      }

      setMessage(locale === "en" ? "Render job created. The latest jobs list has been refreshed." : "渲染任务已创建，最近任务列表已刷新。");
      if (payload.data?.id) {
        setSelectedJobId(payload.data.id);
        setJobScope("ALL");
        setJobSort("NEWEST");
      }
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
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <PanelCard
        title={locale === "en" ? "Find the Right Scene" : "先定位对的场景"}
        description={locale === "en" ? "Search and filter storyboard rows before turning them into render tasks." : "先筛出真正要开工的镜头，再把它转成渲染任务。"}
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <label className="space-y-2 text-sm text-[var(--text-2)]">
              <span>{locale === "en" ? "Search scenes" : "搜索场景"}</span>
              <input
                value={sceneSearch}
                onChange={(event) => setSceneSearch(event.target.value)}
                placeholder={locale === "en" ? "Frame title, shot goal, prompt..." : "按标题、目标、提示词搜索"}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-[var(--text-2)]">
              <span>{locale === "en" ? "Filter" : "筛选条件"}</span>
              <select
                value={sceneFilter}
                onChange={(event) => setSceneFilter(event.target.value as "ALL" | "REFERENCED" | "PROMPT_READY")}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
              >
                <option value="ALL">{locale === "en" ? "All scenes" : "全部场景"}</option>
                <option value="REFERENCED">{locale === "en" ? "With references" : "只看有参考"}</option>
                <option value="PROMPT_READY">{locale === "en" ? "Prompt ready" : "只看提示词已就绪"}</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-2)]">
            <span className="theme-chip rounded-full px-2.5 py-1 font-medium">{locale === "en" ? `${filteredRows.length} visible` : `当前显示 ${filteredRows.length} 个`}</span>
            <span className="theme-chip-ok rounded-full px-2.5 py-1 font-medium">{locale === "en" ? `${rows.filter((row) => row.references.length > 0).length} with refs` : `${rows.filter((row) => row.references.length > 0).length} 个有参考`}</span>
            <span className="theme-chip rounded-full px-2.5 py-1 font-medium">{locale === "en" ? `${rows.filter((row) => row.visualPrompt?.trim()).length} prompt-ready` : `${rows.filter((row) => row.visualPrompt?.trim()).length} 个提示词已就绪`}</span>
          </div>

          <div className="space-y-3">
            {filteredRows.length ? (
              filteredRows.map((row) => {
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
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.references.length > 0 ? "theme-chip-ok" : "theme-chip"}`}>{row.references.length} refs</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.visualPrompt?.trim() ? "theme-chip-ok" : "theme-chip"}`}>
                          {row.visualPrompt?.trim() ? (locale === "en" ? "prompt ready" : "提示词就绪") : locale === "en" ? "prompt pending" : "待补提示词"}
                        </span>
                      </div>
                    </div>
                    <p className={`mt-3 text-sm leading-6 ${selected ? "text-[color:rgba(246,240,232,0.76)]" : "text-[var(--text-2)]"}`}>{row.shotGoal}</p>
                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="theme-panel-muted rounded-[18px] p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Prompt Seed" : "提示词种子"}</div>
                        <div className="mt-2 line-clamp-3 text-[var(--text-1)]">{row.visualPrompt || (locale === "en" ? "No visual prompt yet." : "当前还没有视觉提示词。")}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-solid)] p-5 text-sm leading-6 text-[var(--text-2)]">
                {locale === "en" ? "No scenes match the current search. Try a different keyword or filter." : "当前搜索条件下没有匹配场景，换个关键词或筛选条件试试。"}
              </div>
            )}
          </div>
        </div>
      </PanelCard>

      <div className="space-y-6">
        <PanelCard
          title={locale === "en" ? "Prepare One Better Job" : "准备一个更完整的任务"}
          description={locale === "en" ? "Use scene context, smarter defaults, and one clean submission path." : "把场景上下文、智能默认值和一次提交路径合在一起。"}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Shot Goal" : "画面目标"}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">{selectedScene.shotGoal}</p>
            </div>
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "References" : "参考素材"}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-1)]">
                {selectedScene.references.length ? selectedScene.references.map((reference) => reference.label).join(", ") : locale === "en" ? "No references attached yet." : "当前还没有挂参考素材。"}
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
                  onChange={(event) => updateJobType(event.target.value as (typeof jobTypeOptions)[number])}
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
                  onChange={(event) => updateProvider(event.target.value as (typeof renderProviderSchema.options)[number])}
                >
                  {availableProviders.map((option) => (
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
                  placeholder={getDefaultModel(jobType, provider)}
                />
              </label>
            </div>

            <div className="theme-panel-muted rounded-[22px] p-4 text-sm text-[var(--text-2)]">
              {locale === "en"
                ? `Suggested combo: ${jobType} -> ${provider} / ${getDefaultModel(jobType, provider)}`
                : `推荐组合：${jobType} -> ${provider} / ${getDefaultModel(jobType, provider)}`}
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
              <div className="text-sm text-[var(--text-2)]">{locale === "en" ? "The selected scene will be linked to this job." : "提交后会把当前场景与该任务关联起来。"}</div>
              <Button disabled={pending || !prompt.trim()} type="submit">
                {pending ? (locale === "en" ? "Creating..." : "创建中...") : locale === "en" ? "Create Render Job" : "创建渲染任务"}
              </Button>
            </div>
          </form>
        </PanelCard>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
          <PanelCard
            title={locale === "en" ? "Latest Jobs" : "最近渲染任务"}
            description={locale === "en" ? "Treat recent jobs like a working thread: filter, reorder, and jump back into the right run." : "把最近任务当成工作线程来用：筛选、排序、再回到最该继续的那一条。"}
          >
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm text-[var(--text-2)]">
                  <span>{locale === "en" ? "Search jobs" : "搜索任务"}</span>
                  <input
                    value={jobSearch}
                    onChange={(event) => setJobSearch(event.target.value)}
                    placeholder={locale === "en" ? "Prompt, frame, provider..." : "按提示词、镜头、provider 搜索"}
                    className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-2 text-sm text-[var(--text-2)]">
                    <span>{locale === "en" ? "Status" : "状态"}</span>
                    <select
                      value={jobStatusFilter}
                      onChange={(event) => setJobStatusFilter(event.target.value as "ALL" | RenderJobRow["job_status"])}
                      className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                    >
                      <option value="ALL">{locale === "en" ? "All" : "全部"}</option>
                      <option value="QUEUED">QUEUED</option>
                      <option value="RUNNING">RUNNING</option>
                      <option value="SUCCEEDED">SUCCEEDED</option>
                      <option value="FAILED">FAILED</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="CANCELED">CANCELED</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-[var(--text-2)]">
                    <span>{locale === "en" ? "Scope" : "范围"}</span>
                    <select
                      value={jobScope}
                      onChange={(event) => setJobScope(event.target.value as "ALL" | "SELECTED_SCENE")}
                      className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                    >
                      <option value="ALL">{locale === "en" ? "All jobs" : "全部任务"}</option>
                      <option value="SELECTED_SCENE">{locale === "en" ? "Selected scene" : "当前场景"}</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-[var(--text-2)]">
                    <span>{locale === "en" ? "Order" : "排序"}</span>
                    <select
                      value={jobSort}
                      onChange={(event) => setJobSort(event.target.value as "NEWEST" | "OLDEST")}
                      className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                    >
                      <option value="NEWEST">{locale === "en" ? "Newest first" : "最新优先"}</option>
                      <option value="OLDEST">{locale === "en" ? "Oldest first" : "最早优先"}</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-2)]">
                <span className="theme-chip rounded-full px-2.5 py-1 font-medium">
                  {locale === "en" ? `${filteredJobs.length} in view` : `当前视图 ${filteredJobs.length} 条`}
                </span>
                <span className="theme-chip-warn rounded-full px-2.5 py-1 font-medium">
                  {locale === "en" ? `${jobs.filter((job) => job.job_status === "RUNNING" || job.job_status === "QUEUED").length} active` : `${jobs.filter((job) => job.job_status === "RUNNING" || job.job_status === "QUEUED").length} 条进行中`}
                </span>
                <span className="theme-chip-ok rounded-full px-2.5 py-1 font-medium">
                  {locale === "en" ? `${jobs.filter((job) => job.job_status === "SUCCEEDED").length} done` : `${jobs.filter((job) => job.job_status === "SUCCEEDED").length} 条成功`}
                </span>
              </div>

              <div className="space-y-3">
                {filteredJobs.length ? (
                  filteredJobs.map((job) => {
                  const input = getJobInput(job);
                  const linkedScene =
                    rows.find((row) => row.id === job.script_scene_id) ??
                    rows.find((row) => row.frameId && row.frameId === job.storyboard_frame_id) ??
                    null;
                  const selected = selectedJob?.id === job.id;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`grid w-full gap-3 rounded-[22px] border p-4 text-left transition ${
                        selected ? "theme-panel-strong border-transparent" : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(job.job_status)}`}>{job.job_status}</span>
                        <div className={`text-sm ${selected ? "text-[color:rgba(246,240,232,0.72)]" : "text-[var(--text-2)]"}`}>{formatDate(job.created_at, locale)}</div>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${selected ? "text-[var(--text-inverse)]" : "text-[var(--text-1)]"}`}>
                          {(input.frame_title || linkedScene?.frameTitle || (locale === "en" ? "Untitled frame" : "未命名镜头"))}
                        </div>
                        <div className={`mt-1 text-sm ${selected ? "text-[color:rgba(246,240,232,0.74)]" : "text-[var(--text-2)]"}`}>
                          {job.job_type} · {job.provider}
                          {job.provider_model ? ` / ${job.provider_model}` : ""}
                        </div>
                        {linkedScene ? (
                          <div className={`mt-1 text-xs ${selected ? "text-[color:rgba(246,240,232,0.62)]" : "text-[var(--text-3)]"}`}>
                            {locale === "en" ? "Scene" : "场景"} #{linkedScene.frameOrder}
                          </div>
                        ) : null}
                      </div>
                      <div className={`text-sm leading-6 ${selected ? "text-[color:rgba(246,240,232,0.84)]" : "text-[var(--text-1)]"}`}>
                        {trimPreview(input.prompt || input.shot_goal || linkedScene?.shotGoal, locale === "en" ? "No prompt summary yet." : "当前还没有任务摘要。")}
                      </div>
                    </button>
                  );
                  })
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-solid)] p-5 text-sm leading-6 text-[var(--text-2)]">
                    {jobs.length
                      ? locale === "en"
                        ? "No jobs match the current filters. Try widening the scope or clearing the search."
                        : "当前筛选条件下没有匹配任务，试试放宽范围或清空搜索。"
                      : locale === "en"
                        ? "No render jobs yet. Create the first image or video task from the selected scene."
                        : "还没有渲染任务。先从当前场景创建第一个图片或视频任务。"}
                  </div>
                )}
              </div>
            </div>
          </PanelCard>

          <DetailPanel title={locale === "en" ? "Job Details" : "任务详情"} className="xl:sticky xl:top-6 xl:self-start">
            {selectedJob ? (
              (() => {
                const input = getJobInput(selectedJob);
                const output = getJobOutput(selectedJob);
                const linkedScene =
                  rows.find((row) => row.id === selectedJob.script_scene_id) ??
                  rows.find((row) => row.frameId && row.frameId === selectedJob.storyboard_frame_id) ??
                  null;

                return (
                  <>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{input.frame_title || linkedScene?.frameTitle || (locale === "en" ? "Untitled frame" : "未命名镜头")}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.6)]">
                        {selectedJob.job_type} · {selectedJob.provider}
                        {selectedJob.provider_model ? ` / ${selectedJob.provider_model}` : ""}
                      </div>
                      <div className="mt-4">
                        <Button type="button" variant="secondary" onClick={reuseSelectedJob}>
                          {locale === "en" ? "Continue From This Job" : "基于这条任务继续生成"}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Linked Scene" : "关联场景"}</div>
                      <div className="mt-2">{linkedScene ? `#${linkedScene.frameOrder} ${linkedScene.frameTitle}` : locale === "en" ? "No linked scene found." : "当前未找到可匹配场景。"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Prompt Summary" : "提示词摘要"}</div>
                      <div className="mt-2">{trimPreview(input.prompt || input.visual_prompt || linkedScene?.visualPrompt, locale === "en" ? "No prompt captured." : "当前没有记录提示词。", 240)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Notes" : "备注"}</div>
                      <div className="mt-2 whitespace-pre-wrap">{trimPreview(input.notes, locale === "en" ? "No notes attached." : "当前没有附加备注。", 240)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Job Status" : "任务状态"}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(selectedJob.job_status)}`}>{selectedJob.job_status}</span>
                        <span className="rounded-full border border-[rgba(255,255,255,0.1)] px-2.5 py-1 text-xs font-medium">
                          {formatDate(selectedJob.created_at, locale)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Outputs" : "任务输出"}</div>
                      {selectedJob.render_assets?.length ? (
                        <div className="mt-3 space-y-3">
                          {selectedJob.render_assets.map((asset) => (
                            <div key={asset.id} className="rounded-2xl border border-[rgba(255,255,255,0.1)] p-3">
                              <div className="text-sm text-[var(--text-inverse)]">
                                {asset.file_url ? (
                                  <a href={asset.file_url} target="_blank" rel="noreferrer" className="underline decoration-[rgba(255,255,255,0.2)] underline-offset-4">
                                    {asset.file_name || asset.asset_type || asset.id}
                                  </a>
                                ) : (
                                  asset.file_name || asset.asset_type || asset.id
                                )}
                              </div>
                              <div className="mt-1 text-xs text-[color:rgba(246,240,232,0.58)]">
                                {asset.asset_type || (locale === "en" ? "Output asset" : "输出素材")}
                                {asset.mime_type ? ` · ${asset.mime_type}` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2">
                          {selectedJob.job_status === "SUCCEEDED"
                            ? locale === "en"
                              ? "This job succeeded, but no output assets have been attached yet."
                              : "这条任务已成功，但当前还没有挂接输出素材。"
                            : locale === "en"
                              ? "No output assets yet. Once generation finishes, results should appear here."
                              : "当前还没有输出素材，任务完成后结果会优先出现在这里。"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Output Summary" : "输出摘要"}</div>
                      <div className="mt-2 whitespace-pre-wrap">
                        {trimPreview(
                          typeof output.summary === "string"
                            ? output.summary
                            : typeof output.result_summary === "string"
                              ? output.result_summary
                              : typeof output.message === "string"
                                ? output.message
                                : "",
                          locale === "en" ? "No structured output summary yet." : "当前还没有结构化输出摘要。",
                          280,
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "References" : "参考素材"}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(input.references?.length ? input.references : linkedScene?.references ?? []).length ? (
                          (input.references?.length ? input.references : linkedScene?.references ?? []).map((reference, index) => (
                            <span key={`${reference.label ?? "reference"}-${index}`} className="rounded-full border border-[rgba(255,255,255,0.1)] px-2.5 py-1 text-xs font-medium">
                              {reference.label || reference.type || (locale === "en" ? "Reference" : "参考")}
                            </span>
                          ))
                        ) : (
                          <div>{locale === "en" ? "No references captured for this job." : "这个任务还没有挂参考素材。"}</div>
                        )}
                      </div>
                    </div>
                    {selectedJob.error_message ? (
                      <div>
                        <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Error" : "错误信息"}</div>
                        <div className="mt-2 text-[var(--danger-text)]">{selectedJob.error_message}</div>
                      </div>
                    ) : null}
                  </>
                );
              })()
            ) : (
              <div>{locale === "en" ? "Select a job to inspect its scene, prompt, and reference context." : "选择一条任务后，这里会展开它的场景、提示词和参考上下文。"}</div>
            )}
          </DetailPanel>
        </div>
      </div>
    </div>
  );
}
