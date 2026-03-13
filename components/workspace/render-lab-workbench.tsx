"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function getLinkedScene(rows: ScenePlannerRow[], job: RenderJobRow) {
  return rows.find((row) => row.id === job.script_scene_id) ?? rows.find((row) => row.frameId && row.frameId === job.storyboard_frame_id) ?? null;
}

function getThreadKey(job: RenderJobRow) {
  if (job.script_scene_id) {
    return `scene:${job.script_scene_id}`;
  }

  if (job.storyboard_frame_id) {
    return `frame:${job.storyboard_frame_id}`;
  }

  return null;
}

function inferAssetKind(asset: NonNullable<RenderJobRow["render_assets"]>[number]) {
  const mime = asset.mime_type?.toLowerCase() ?? "";
  const url = asset.file_url?.toLowerCase() ?? "";

  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|bmp|svg)$/.test(url)) {
    return "image";
  }

  if (mime.startsWith("video/") || /\.(mp4|mov|webm|m4v|avi)$/.test(url)) {
    return "video";
  }

  return "file";
}

function getPrimaryAsset(assets: RenderJobRow["render_assets"]) {
  if (!assets?.length) {
    return null;
  }

  return assets.find((asset) => inferAssetKind(asset) === "image") ?? assets.find((asset) => inferAssetKind(asset) === "video") ?? assets[0];
}

function getOutputSummary(output: Record<string, unknown>) {
  if (typeof output.summary === "string") {
    return output.summary;
  }

  if (typeof output.result_summary === "string") {
    return output.result_summary;
  }

  if (typeof output.message === "string") {
    return output.message;
  }

  return "";
}

function getJobSummary(job: RenderJobRow, linkedScene: ScenePlannerRow | null, locale: Locale, length = 140) {
  const input = getJobInput(job);
  const output = getJobOutput(job);

  return trimPreview(
    input.prompt || input.shot_goal || getOutputSummary(output) || linkedScene?.shotGoal,
    locale === "en" ? "No prompt summary yet." : "当前还没有任务摘要。",
    length,
  );
}

function AssetPreviewCard({
  asset,
  locale,
}: {
  asset: NonNullable<RenderJobRow["render_assets"]>[number];
  locale: Locale;
}) {
  const kind = inferAssetKind(asset);
  const title = asset.file_name || asset.asset_type || asset.id;

  return (
    <div className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]">
      {kind === "image" && asset.file_url ? (
        <a href={asset.file_url} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.file_url} alt={title} className="h-48 w-full object-cover" />
        </a>
      ) : null}
      {kind === "video" && asset.file_url ? (
        <video controls preload="metadata" className="h-48 w-full bg-black object-cover">
          <source src={asset.file_url} type={asset.mime_type || undefined} />
          {locale === "en" ? "Your browser does not support embedded video preview." : "当前浏览器不支持内嵌视频预览。"}
        </video>
      ) : null}
      <div className="p-4">
        <div className="text-sm text-[var(--text-inverse)]">
          {asset.file_url ? (
            <a href={asset.file_url} target="_blank" rel="noreferrer" className="underline decoration-[rgba(255,255,255,0.2)] underline-offset-4">
              {title}
            </a>
          ) : (
            title
          )}
        </div>
        <div className="mt-1 text-xs text-[color:rgba(246,240,232,0.58)]">
          {asset.asset_type || (locale === "en" ? "Output asset" : "输出素材")}
          {asset.mime_type ? ` · ${asset.mime_type}` : ""}
          {kind === "image" ? ` · ${locale === "en" ? "image preview" : "图片预览"}` : ""}
          {kind === "video" ? ` · ${locale === "en" ? "video preview" : "视频预览"}` : ""}
        </div>
        {kind === "file" ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] px-3 py-3 text-xs text-[color:rgba(246,240,232,0.68)]">
            {locale === "en" ? "Preview is not available for this asset type yet. Open the file in a new tab." : "当前素材类型暂不支持内嵌预览，请点击文件链接在新标签页中查看。"}
          </div>
        ) : null}
      </div>
    </div>
  );
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
  const [editorMode, setEditorMode] = useState<"CREATE" | "REUSE">("CREATE");
  const [jobType, setJobType] = useState<RenderJobTypeOption>("IMAGE");
  const [provider, setProvider] = useState<RenderProviderOption>(providerConfig.IMAGE.defaultProvider);
  const [providerModel, setProviderModel] = useState(getDefaultModel("IMAGE", providerConfig.IMAGE.defaultProvider));
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCreatedJobId, setLastCreatedJobId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

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
      const linkedScene = getLinkedScene(rows, job);
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
  const selectedJobThread = useMemo(() => {
    if (!selectedJob) {
      return [];
    }

    return jobs
      .filter((job) => {
        if (selectedJob.script_scene_id) {
          return job.script_scene_id === selectedJob.script_scene_id;
        }

        if (selectedJob.storyboard_frame_id) {
          return job.storyboard_frame_id === selectedJob.storyboard_frame_id;
        }

        return false;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [jobs, selectedJob]);
  const selectedJobThreadIndex = selectedJob ? selectedJobThread.findIndex((job) => job.id === selectedJob.id) : -1;
  const previousThreadJob = selectedJobThreadIndex > 0 ? selectedJobThread[selectedJobThreadIndex - 1] : null;
  const selectedJobInput = selectedJob ? getJobInput(selectedJob) : null;
  const selectedJobOutput = selectedJob ? getJobOutput(selectedJob) : null;
  const selectedJobLinkedScene = selectedJob ? getLinkedScene(rows, selectedJob) : null;
  const selectedPrimaryAsset = selectedJob ? getPrimaryAsset(selectedJob.render_assets) : null;
  const previousPrimaryAsset = previousThreadJob ? getPrimaryAsset(previousThreadJob.render_assets) : null;

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

    if (editorMode === "CREATE") {
      setPrompt(buildPrompt(selectedScene));
      setNotes(buildNotes(selectedScene, locale));
    }
  }, [editorMode, locale, selectedScene]);

  useEffect(() => {
    if (!lastCreatedJobId) {
      return;
    }

    const createdJob = jobs.find((job) => job.id === lastCreatedJobId);
    if (!createdJob) {
      return;
    }

    setSelectedJobId(createdJob.id);
    if (createdJob.script_scene_id) {
      setSelectedId(createdJob.script_scene_id);
    }
    setJobScope("ALL");
    setJobSort("NEWEST");

    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [jobs, lastCreatedJobId]);

  function loadSceneIntoEditor(scene: ScenePlannerRow) {
    setPrompt(buildPrompt(scene));
    setNotes(buildNotes(scene, locale));
  }

  function loadJobIntoEditor(job: RenderJobRow) {
    const input = getJobInput(job);
    const nextJobType = job.job_type as RenderJobTypeOption;
    const nextProvider = job.provider as RenderProviderOption;

    if (job.script_scene_id) {
      setSelectedId(job.script_scene_id);
    }

    setJobType(nextJobType);
    setProvider(nextProvider);
    setProviderModel(job.provider_model || getDefaultModel(nextJobType, nextProvider));
    setPrompt(input.prompt || input.visual_prompt || "");
    setNotes(input.notes || "");
  }

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

    setEditorMode("REUSE");
    loadJobIntoEditor(selectedJob);
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
        setLastCreatedJobId(payload.data.id);
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
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.04fr_0.94fr]">
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

      <PanelCard
        title={locale === "en" ? "Editor Workspace" : "编辑工作区"}
        description={locale === "en" ? "Switch between drafting a fresh job from the scene and reusing a previous run." : "在基于场景新建任务、或基于上一条任务复用迭代之间切换。"}
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setEditorMode("CREATE");
                loadSceneIntoEditor(selectedScene);
                setMessage(null);
                setError(null);
              }}
              className={`rounded-[22px] border p-4 text-left transition ${
                editorMode === "CREATE" ? "theme-panel-strong border-transparent" : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              <div className={`text-sm font-semibold ${editorMode === "CREATE" ? "text-[var(--text-inverse)]" : "text-[var(--text-1)]"}`}>
                {locale === "en" ? "Create From Scene" : "基于场景新建"}
              </div>
              <div className={`mt-2 text-sm leading-6 ${editorMode === "CREATE" ? "text-[color:rgba(246,240,232,0.72)]" : "text-[var(--text-2)]"}`}>
                {locale === "en" ? "Use the currently selected storyboard row as the source of truth." : "直接以当前选中的分镜行为起点，快速起一个新任务。"}
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditorMode("REUSE");
                if (selectedJob) {
                  loadJobIntoEditor(selectedJob);
                }
                setMessage(null);
                setError(null);
              }}
              className={`rounded-[22px] border p-4 text-left transition ${
                editorMode === "REUSE" ? "theme-panel-strong border-transparent" : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              <div className={`text-sm font-semibold ${editorMode === "REUSE" ? "text-[var(--text-inverse)]" : "text-[var(--text-1)]"}`}>
                {locale === "en" ? "Reuse Last Run" : "复用上一轮任务"}
              </div>
              <div className={`mt-2 text-sm leading-6 ${editorMode === "REUSE" ? "text-[color:rgba(246,240,232,0.72)]" : "text-[var(--text-2)]"}`}>
                {locale === "en" ? "Pull prompt, notes, and routing from the selected job to keep iterating." : "从右侧选中的任务回填 prompt、notes 和路由配置，继续往下迭代。"}
              </div>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">
                {editorMode === "CREATE" ? (locale === "en" ? "Current Scene" : "当前场景") : locale === "en" ? "Reuse Source" : "复用来源"}
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--text-1)]">
                {editorMode === "CREATE"
                  ? `#${selectedScene.frameOrder} ${selectedScene.frameTitle}`
                  : selectedJob
                    ? getJobInput(selectedJob).frame_title || (locale === "en" ? "Selected job" : "已选任务")
                    : locale === "en"
                      ? "Pick a job from the right column."
                      : "请先从右侧选择一条任务。"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                {editorMode === "CREATE"
                  ? selectedScene.shotGoal
                  : selectedJob
                    ? trimPreview(getJobInput(selectedJob).prompt || getJobInput(selectedJob).shot_goal, locale === "en" ? "No reusable prompt yet." : "当前还没有可复用提示词。", 180)
                    : locale === "en"
                      ? "The editor can pull settings from the selected job."
                      : "中间工作区会从右侧所选任务中回填设置。"}
              </p>
            </div>
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{locale === "en" ? "Working Mode" : "当前工作模式"}</div>
              <p className="mt-2 text-sm font-medium text-[var(--text-1)]">
                {editorMode === "CREATE" ? (locale === "en" ? "Fresh generation pass" : "新一轮生成") : locale === "en" ? "Iterate on previous run" : "延续上一轮结果"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                {editorMode === "CREATE"
                  ? locale === "en"
                    ? "Best when you want the scene plan to drive the first render."
                    : "适合让场景规划直接驱动第一轮生成。"
                  : locale === "en"
                    ? "Best when you want to keep the same route and refine prompt details."
                    : "适合沿用上一条任务的路由配置，只微调提示词细节。"}
              </p>
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
              <div className="text-sm text-[var(--text-2)]">
                {editorMode === "CREATE"
                  ? locale === "en"
                    ? "The selected scene will be linked to this new job."
                    : "提交后会把当前场景与这条新任务关联起来。"
                  : locale === "en"
                    ? "This creates a new iteration based on the selected job, not an in-place overwrite."
                    : "这会基于所选任务再创建一条新迭代，不会覆盖旧任务。"}
              </div>
              <Button disabled={pending || !prompt.trim()} type="submit">
                {pending ? (locale === "en" ? "Creating..." : "创建中...") : editorMode === "CREATE" ? (locale === "en" ? "Create Render Job" : "创建渲染任务") : locale === "en" ? "Create Iteration" : "创建迭代任务"}
              </Button>
            </div>
          </form>
        </div>
      </PanelCard>

      <div className="space-y-6">
        <PanelCard
          title={locale === "en" ? "Task History" : "任务历史"}
          description={locale === "en" ? "Scan status, summaries, and scene threads quickly before opening the result detail view." : "先在这里快速扫清状态、摘要和场景线程，再进入下方结果详情。"}
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-1">
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
                  const linkedScene = getLinkedScene(rows, job);
                  const selected = selectedJob?.id === job.id;
                  const primaryAsset = getPrimaryAsset(job.render_assets);
                  const threadKey = getThreadKey(job);
                  const threadItems = threadKey ? jobs.filter((item) => getThreadKey(item) === threadKey) : [];
                  const threadCount = threadItems.length;
                  const versionIndex = threadItems
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .findIndex((item) => item.id === job.id);

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
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(job.job_status)}`}>{job.job_status}</span>
                          {linkedScene ? <span className="theme-chip rounded-full px-2.5 py-1 text-xs font-medium">{locale === "en" ? `Scene #${linkedScene.frameOrder}` : `场景 #${linkedScene.frameOrder}`}</span> : null}
                          {threadCount > 1 ? (
                            <span className="theme-chip-ok rounded-full px-2.5 py-1 text-xs font-medium">
                              {locale === "en" ? `v${versionIndex + 1}/${threadCount}` : `第 ${versionIndex + 1}/${threadCount} 版`}
                            </span>
                          ) : null}
                        </div>
                        <div className={`text-sm ${selected ? "text-[color:rgba(246,240,232,0.72)]" : "text-[var(--text-2)]"}`}>{formatDate(job.created_at, locale)}</div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1fr_84px] md:items-start">
                        <div>
                          <div className={`text-sm font-medium ${selected ? "text-[var(--text-inverse)]" : "text-[var(--text-1)]"}`}>
                            {(getJobInput(job).frame_title || linkedScene?.frameTitle || (locale === "en" ? "Untitled frame" : "未命名镜头"))}
                          </div>
                          <div className={`mt-1 text-sm ${selected ? "text-[color:rgba(246,240,232,0.74)]" : "text-[var(--text-2)]"}`}>
                            {job.job_type} · {job.provider}
                            {job.provider_model ? ` / ${job.provider_model}` : ""}
                          </div>
                          <div className={`mt-3 text-sm leading-6 ${selected ? "text-[color:rgba(246,240,232,0.84)]" : "text-[var(--text-1)]"}`}>
                            {getJobSummary(job, linkedScene, locale)}
                          </div>
                          <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? "text-[color:rgba(246,240,232,0.66)]" : "text-[var(--text-3)]"}`}>
                            <span>{job.render_assets?.length ? (locale === "en" ? `${job.render_assets.length} outputs` : `${job.render_assets.length} 个输出`) : locale === "en" ? "No outputs yet" : "暂无输出"}</span>
                            <span>{selected ? (locale === "en" ? "Viewing in detail" : "当前正在查看") : locale === "en" ? "Open result detail" : "可展开结果详情"}</span>
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
                          {primaryAsset?.file_url && inferAssetKind(primaryAsset) === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={primaryAsset.file_url} alt={primaryAsset.file_name || primaryAsset.asset_type || job.id} className="h-24 w-full object-cover" />
                          ) : primaryAsset?.file_url && inferAssetKind(primaryAsset) === "video" ? (
                            <video className="h-24 w-full bg-black object-cover" muted>
                              <source src={primaryAsset.file_url} type={primaryAsset.mime_type || undefined} />
                            </video>
                          ) : (
                            <div className="flex h-24 items-center justify-center px-3 text-center text-[11px] text-[var(--text-3)]">
                              {locale === "en" ? "Result preview pending" : "结果预览待生成"}
                            </div>
                          )}
                        </div>
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

        <div ref={detailPanelRef}>
        <DetailPanel title={locale === "en" ? "Result Detail" : "结果详情"} className="xl:sticky xl:top-6 xl:self-start">
          {selectedJob ? (
            (() => {
              return (
                <>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-inverse)]">{selectedJobInput?.frame_title || selectedJobLinkedScene?.frameTitle || (locale === "en" ? "Untitled frame" : "未命名镜头")}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.6)]">
                          {selectedJob.job_type} · {selectedJob.provider}
                          {selectedJob.provider_model ? ` / ${selectedJob.provider_model}` : ""}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(selectedJob.job_status)}`}>{selectedJob.job_status}</span>
                        <span className="rounded-full border border-[rgba(255,255,255,0.1)] px-2.5 py-1 text-xs font-medium">{formatDate(selectedJob.created_at, locale)}</span>
                        {selectedJobLinkedScene ? <span className="theme-chip rounded-full px-2.5 py-1 text-xs font-medium">{locale === "en" ? `Scene #${selectedJobLinkedScene.frameOrder}` : `场景 #${selectedJobLinkedScene.frameOrder}`}</span> : null}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.56)]">{locale === "en" ? "Outputs" : "输出结果"}</div>
                        <div className="mt-2 text-lg font-semibold text-[var(--text-inverse)]">{selectedJob.render_assets?.length ?? 0}</div>
                        <div className="mt-1 text-xs text-[color:rgba(246,240,232,0.62)]">{locale === "en" ? "Attached assets" : "已挂接素材"}</div>
                      </div>
                      <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.56)]">{locale === "en" ? "Thread" : "版本线程"}</div>
                        <div className="mt-2 text-lg font-semibold text-[var(--text-inverse)]">{selectedJobThread.length || 1}</div>
                        <div className="mt-1 text-xs text-[color:rgba(246,240,232,0.62)]">
                          {selectedJobThread.length > 1
                            ? locale === "en"
                              ? `Viewing v${selectedJobThreadIndex + 1}`
                              : `当前查看第 ${selectedJobThreadIndex + 1} 版`
                            : locale === "en"
                              ? "Single version yet"
                              : "当前仅 1 个版本"}
                        </div>
                      </div>
                      <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.56)]">{locale === "en" ? "References" : "参考素材"}</div>
                        <div className="mt-2 text-lg font-semibold text-[var(--text-inverse)]">
                          {(selectedJobInput?.references?.length ? selectedJobInput.references : selectedJobLinkedScene?.references ?? []).length}
                        </div>
                        <div className="mt-1 text-xs text-[color:rgba(246,240,232,0.62)]">{locale === "en" ? "Context items" : "上下文素材数"}</div>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]">
                      {selectedPrimaryAsset?.file_url && inferAssetKind(selectedPrimaryAsset) === "image" ? (
                        <a href={selectedPrimaryAsset.file_url} target="_blank" rel="noreferrer" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedPrimaryAsset.file_url} alt={selectedPrimaryAsset.file_name || selectedPrimaryAsset.asset_type || selectedJob.id} className="max-h-[360px] w-full object-cover" />
                        </a>
                      ) : selectedPrimaryAsset?.file_url && inferAssetKind(selectedPrimaryAsset) === "video" ? (
                        <video controls preload="metadata" className="max-h-[360px] w-full bg-black object-contain">
                          <source src={selectedPrimaryAsset.file_url} type={selectedPrimaryAsset.mime_type || undefined} />
                          {locale === "en" ? "Your browser does not support embedded video preview." : "当前浏览器不支持内嵌视频预览。"}
                        </video>
                      ) : (
                        <div className="flex min-h-52 items-center justify-center px-6 text-center text-sm text-[color:rgba(246,240,232,0.68)]">
                          {selectedJob.job_status === "SUCCEEDED"
                            ? locale === "en"
                              ? "This run is complete, but there is no preview asset attached yet."
                              : "这条任务已经完成，但当前还没有可直接消费的预览素材。"
                            : locale === "en"
                              ? "This area will surface the latest output as soon as the run produces an asset."
                              : "任务一旦产出素材，这里会优先展示最新结果。"}
                        </div>
                      )}
                      <div className="border-t border-[rgba(255,255,255,0.08)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.56)]">{locale === "en" ? "Consumption Summary" : "结果消费摘要"}</div>
                        <div className="mt-2 text-sm leading-6 text-[color:rgba(246,240,232,0.82)]">
                          {trimPreview(
                            getOutputSummary(selectedJobOutput ?? {}) || selectedJobInput?.prompt || selectedJobInput?.shot_goal || selectedJobLinkedScene?.shotGoal,
                            locale === "en" ? "No structured result summary yet." : "当前还没有结构化结果摘要。",
                            320,
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button type="button" variant="secondary" onClick={reuseSelectedJob}>
                        {locale === "en" ? "Continue From This Job" : "基于这条任务继续生成"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Scene Context" : "场景上下文"}</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.58)]">{locale === "en" ? "Linked Scene" : "关联场景"}</div>
                        <div className="mt-2 text-[var(--text-inverse)]">{selectedJobLinkedScene ? `#${selectedJobLinkedScene.frameOrder} ${selectedJobLinkedScene.frameTitle}` : locale === "en" ? "No linked scene found." : "当前未找到可匹配场景。"}</div>
                        <div className="mt-2 text-sm text-[color:rgba(246,240,232,0.72)]">{selectedJobLinkedScene?.shotGoal || (locale === "en" ? "No linked scene summary." : "暂无场景摘要。")}</div>
                      </div>
                      <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.58)]">{locale === "en" ? "Prompt Summary" : "提示词摘要"}</div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-[color:rgba(246,240,232,0.82)]">
                          {trimPreview(selectedJobInput?.prompt || selectedJobInput?.visual_prompt || selectedJobLinkedScene?.visualPrompt, locale === "en" ? "No prompt captured." : "当前没有记录提示词。", 240)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Notes" : "备注"}</div>
                    <div className="mt-2 whitespace-pre-wrap">{trimPreview(selectedJobInput?.notes, locale === "en" ? "No notes attached." : "当前没有附加备注。", 240)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Version Thread" : "版本链路"}</div>
                    <div className="mt-2 text-[color:rgba(246,240,232,0.72)]">
                      {selectedJobThread.length > 1
                        ? locale === "en"
                          ? `This run is version ${selectedJobThreadIndex + 1} of ${selectedJobThread.length} for the same scene.`
                          : `这条任务是同一场景下的第 ${selectedJobThreadIndex + 1} / ${selectedJobThread.length} 个版本。`
                        : locale === "en"
                          ? "This scene has only one version so far."
                          : "这个场景目前只有一个版本。"}
                    </div>
                    {selectedJobThread.length ? (
                      <div className="mt-3 grid gap-3">
                        {selectedJobThread.map((job, index) => (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => setSelectedJobId(job.id)}
                            className={`grid gap-3 rounded-[20px] border p-4 text-left transition sm:grid-cols-[92px_1fr] ${
                              job.id === selectedJob.id
                                ? "theme-panel-muted border-[rgba(255,255,255,0.16)]"
                                : "border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)]"
                            }`}
                          >
                            <div className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
                              {getPrimaryAsset(job.render_assets)?.file_url && inferAssetKind(getPrimaryAsset(job.render_assets) as NonNullable<RenderJobRow["render_assets"]>[number]) === "image" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={getPrimaryAsset(job.render_assets)?.file_url ?? ""}
                                  alt={job.id}
                                  className="h-24 w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-24 items-center justify-center px-2 text-center text-[11px] text-[color:rgba(246,240,232,0.56)]">
                                  {locale === "en" ? "No preview" : "暂无预览"}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm text-[var(--text-inverse)]">{locale === "en" ? `Version ${index + 1}` : `版本 ${index + 1}`}</div>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusTone(job.job_status)}`}>{job.job_status}</span>
                              </div>
                              <div className="mt-2 text-xs text-[color:rgba(246,240,232,0.62)]">{formatDate(job.created_at, locale)}</div>
                              <div className="mt-2 text-sm leading-6 text-[color:rgba(246,240,232,0.8)]">{getJobSummary(job, getLinkedScene(rows, job), locale, 120)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {previousThreadJob ? (
                    <div>
                      <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Previous Version Compare" : "与上一版本对比"}</div>
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.58)]">{locale === "en" ? "Current" : "当前版本"}</div>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusTone(selectedJob.job_status)}`}>{selectedJob.job_status}</span>
                          </div>
                          <div className="mt-3 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
                            {selectedPrimaryAsset?.file_url && inferAssetKind(selectedPrimaryAsset) === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={selectedPrimaryAsset.file_url} alt={selectedJob.id} className="h-48 w-full object-cover" />
                            ) : (
                              <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-[color:rgba(246,240,232,0.68)]">
                                {locale === "en" ? "No current preview asset." : "当前版本还没有可对比预览素材。"}
                              </div>
                            )}
                          </div>
                          <div className="mt-3 text-sm leading-6 text-[color:rgba(246,240,232,0.8)]">{getJobSummary(selectedJob, selectedJobLinkedScene, locale, 140)}</div>
                        </div>
                        <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs uppercase tracking-[0.14em] text-[color:rgba(246,240,232,0.58)]">{locale === "en" ? "Previous" : "上一版本"}</div>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusTone(previousThreadJob.job_status)}`}>{previousThreadJob.job_status}</span>
                          </div>
                          <div className="mt-3 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
                            {previousPrimaryAsset?.file_url && inferAssetKind(previousPrimaryAsset) === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={previousPrimaryAsset.file_url} alt={previousThreadJob.id} className="h-48 w-full object-cover" />
                            ) : (
                              <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-[color:rgba(246,240,232,0.68)]">
                                {locale === "en" ? "No previous preview asset." : "上一版本还没有可对比预览素材。"}
                              </div>
                            )}
                          </div>
                          <div className="mt-3 text-sm leading-6 text-[color:rgba(246,240,232,0.8)]">{getJobSummary(previousThreadJob, getLinkedScene(rows, previousThreadJob), locale, 140)}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "Output Gallery" : "结果素材"}</div>
                    {selectedJob.render_assets?.length ? (
                      <div className="mt-3 space-y-3">
                        {selectedJob.render_assets.map((asset) => (
                          <AssetPreviewCard key={asset.id} asset={asset} locale={locale} />
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
                    <div className="text-sm font-medium text-[var(--text-inverse)]">{locale === "en" ? "References" : "参考素材"}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedJobInput?.references?.length ? selectedJobInput.references : selectedJobLinkedScene?.references ?? []).length ? (
                        (selectedJobInput?.references?.length ? selectedJobInput.references : selectedJobLinkedScene?.references ?? []).map((reference, index) => (
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
