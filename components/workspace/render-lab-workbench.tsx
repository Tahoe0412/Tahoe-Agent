"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
import { PanelCard } from "@/components/ui/panel-card";
import { ScoreBar } from "@/components/ui/score-bar";
import { apiRequest } from "@/lib/client-api";
import { reviewImageBrief } from "@/lib/image-brief-review";
import type { Locale } from "@/lib/locale";
import {
  feedbackIssueOptions,
  getFeedbackIssueLabel,
  getFeedbackVerdictLabel,
  getJobFeedback,
  type RenderJobFeedback,
  type RenderJobFeedbackIssue,
  type RenderJobFeedbackVerdict,
} from "@/lib/render-job-feedback";
import { renderJobTypeSchema, renderProviderSchema } from "@/schemas/production-control";

type ScenePlannerRow = {
  id: string;
  frameId: string | null;
  frameOrder: number;
  frameTitle: string;
  rewritten: string;
  shotGoal: string;
  visualPrompt: string | null;
  cameraPlan: string | null;
  motionPlan: string | null;
  compositionNotes: string | null;
  referenceCount: number;
  assetReady: boolean;
  missing: string[];
  riskFlags: string[];
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

function getReviewTone(readiness: "READY" | "NEEDS_REVISION") {
  return readiness === "READY" ? "theme-chip-ok" : "theme-chip-warn";
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
    <div className="overflow-hidden rounded-md border border-[var(--border)] bg-transparent">
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
        <div className="text-sm text-[var(--text-1)]">
          {asset.file_url ? (
            <a href={asset.file_url} target="_blank" rel="noreferrer" className="underline decoration-[var(--border)] underline-offset-4">
              {title}
            </a>
          ) : (
            title
          )}
        </div>
        <div className="mt-1 text-xs text-[var(--text-3)]">
          {asset.asset_type || (locale === "en" ? "Output asset" : "输出素材")}
          {asset.mime_type ? ` · ${asset.mime_type}` : ""}
          {kind === "image" ? ` · ${locale === "en" ? "image preview" : "图片预览"}` : ""}
          {kind === "video" ? ` · ${locale === "en" ? "video preview" : "视频预览"}` : ""}
        </div>
        {kind === "file" ? (
          <div className="mt-3 rounded-md border border-dashed border-[var(--border)] px-3 py-3 text-xs text-[var(--text-3)]">
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
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackVerdict, setFeedbackVerdict] = useState<RenderJobFeedbackVerdict>("RETRY");
  const [feedbackIssues, setFeedbackIssues] = useState<RenderJobFeedbackIssue[]>([]);
  const [feedbackNote, setFeedbackNote] = useState("");

  const selectedScene = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;
  const selectedReview = useMemo(
    () =>
      selectedScene
        ? reviewImageBrief({
            frameTitle: selectedScene.frameTitle,
            shotGoal: selectedScene.shotGoal,
            rewritten: selectedScene.rewritten,
            visualPrompt: selectedScene.visualPrompt,
            cameraPlan: selectedScene.cameraPlan,
            compositionNotes: selectedScene.compositionNotes,
            referenceCount: selectedScene.referenceCount,
            assetReady: selectedScene.assetReady,
            missing: selectedScene.missing,
            riskFlags: selectedScene.riskFlags,
          })
        : null,
    [selectedScene],
  );
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
  const selectedJobFeedback = selectedJob ? getJobFeedback(selectedJob) : null;
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
    if (!selectedJobFeedback) {
      setFeedbackVerdict("RETRY");
      setFeedbackIssues([]);
      setFeedbackNote("");
      return;
    }

    setFeedbackVerdict(selectedJobFeedback.verdict);
    setFeedbackIssues(selectedJobFeedback.issue_tags);
    setFeedbackNote(selectedJobFeedback.note ?? "");
  }, [selectedJobId, selectedJobFeedback?.updated_at, selectedJobFeedback?.verdict]);

  useEffect(() => {
    if (!selectedScene) {
      return;
    }

    if (editorMode === "CREATE") {
      setPrompt(buildPrompt(selectedScene));
      setNotes(buildNotes(selectedScene, locale));
    }
  }, [editorMode, locale, selectedScene]);

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

  function toggleFeedbackIssue(issue: RenderJobFeedbackIssue) {
    setFeedbackIssues((current) =>
      current.includes(issue) ? current.filter((item) => item !== issue) : current.length >= 5 ? current : [...current, issue],
    );
  }

  async function saveFeedback() {
    if (!selectedJob) {
      return;
    }

    setFeedbackPending(true);
    setMessage(null);
    setError(null);

    try {
      await apiRequest(`/api/projects/${projectId}/render-jobs/${selectedJob.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verdict: feedbackVerdict,
          issue_tags: feedbackIssues,
          note: feedbackNote.trim(),
        }),
      });
      setMessage(locale === "en" ? "Result feedback saved." : "结果反馈已保存。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : locale === "en" ? "Failed to save result feedback." : "保存结果反馈失败。");
    } finally {
      setFeedbackPending(false);
    }
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
          ...(selectedScene.id.startsWith("frame:") ? {} : { script_scene_id: selectedScene.id }),
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
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.04fr_0.94fr]">
      <PanelCard
        title={locale === "en" ? "Find the Right Image Brief" : "先定位对的配图条目"}
        description={locale === "en" ? "Search and filter image-brief rows before turning them into image jobs." : "先筛出真正要开工的配图说明，再把它转成图片任务。"}
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <label className="space-y-2 text-sm text-[var(--text-2)]">
              <span>{locale === "en" ? "Search image rows" : "搜索配图条目"}</span>
              <input
                value={sceneSearch}
                onChange={(event) => setSceneSearch(event.target.value)}
                placeholder={locale === "en" ? "Frame title, shot goal, prompt..." : "按标题、目标、提示词搜索"}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-[var(--text-2)]">
              <span>{locale === "en" ? "Filter" : "筛选条件"}</span>
              <select
                value={sceneFilter}
                onChange={(event) => setSceneFilter(event.target.value as "ALL" | "REFERENCED" | "PROMPT_READY")}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
              >
                <option value="ALL">{locale === "en" ? "All rows" : "全部条目"}</option>
                <option value="REFERENCED">{locale === "en" ? "With references" : "只看有参考"}</option>
                <option value="PROMPT_READY">{locale === "en" ? "Prompt ready" : "只看提示词已就绪"}</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-2)]">
            <span className="theme-chip rounded-sm px-2.5 py-1 font-medium">{locale === "en" ? `${filteredRows.length} visible` : `当前显示 ${filteredRows.length} 条`}</span>
            <span className="theme-chip-ok rounded-sm px-2.5 py-1 font-medium">{locale === "en" ? `${rows.filter((row) => row.references.length > 0).length} with refs` : `${rows.filter((row) => row.references.length > 0).length} 个有参考`}</span>
            <span className="theme-chip rounded-sm px-2.5 py-1 font-medium">{locale === "en" ? `${rows.filter((row) => row.visualPrompt?.trim()).length} prompt-ready` : `${rows.filter((row) => row.visualPrompt?.trim()).length} 个提示词已就绪`}</span>
          </div>

          <div className="space-y-3">
            {filteredRows.length ? (
              filteredRows.map((row) => {
                const selected = row.id === selectedScene.id;
                const review = reviewImageBrief({
                  frameTitle: row.frameTitle,
                  shotGoal: row.shotGoal,
                  rewritten: row.rewritten,
                  visualPrompt: row.visualPrompt,
                  cameraPlan: row.cameraPlan,
                  compositionNotes: row.compositionNotes,
                  referenceCount: row.referenceCount,
                  assetReady: row.assetReady,
                  missing: row.missing,
                  riskFlags: row.riskFlags,
                });

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(row.id);
                      setMessage(null);
                      setError(null);
                    }}
                    className={`w-full rounded-md border p-5 text-left transition ${
                      selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className={`text-lg font-semibold ${selected ? "text-[var(--text-1)]" : "text-[var(--text-1)]"}`}>
                        #{row.frameOrder} {row.frameTitle}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${row.references.length > 0 ? "theme-chip-ok" : "theme-chip"}`}>{row.references.length} refs</span>
                        <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${row.visualPrompt?.trim() ? "theme-chip-ok" : "theme-chip"}`}>
                          {row.visualPrompt?.trim() ? (locale === "en" ? "prompt ready" : "提示词就绪") : locale === "en" ? "prompt pending" : "待补提示词"}
                        </span>
                        <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${getReviewTone(review.readiness)}`}>
                          {review.readiness === "READY" ? (locale === "en" ? `ready ${review.score}` : `可开工 ${review.score}`) : locale === "en" ? `revise ${review.score}` : `待补强 ${review.score}`}
                        </span>
                      </div>
                    </div>
                    <p className={`mt-3 text-sm leading-6 ${selected ? "text-[var(--text-2)]" : "text-[var(--text-2)]"}`}>{row.shotGoal}</p>
                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="theme-panel-muted rounded-md p-3">
                        <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-3)]">{locale === "en" ? "Prompt Seed" : "提示词种子"}</div>
                        <div className="mt-2 line-clamp-3 text-[var(--text-1)]">{row.visualPrompt || (locale === "en" ? "No visual prompt yet." : "当前还没有视觉提示词。")}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-solid)] p-5 text-sm leading-6 text-[var(--text-2)]">
                {locale === "en" ? "No image rows match the current search. Try a different keyword or filter." : "当前搜索条件下没有匹配配图条目，换个关键词或筛选条件试试。"}
              </div>
            )}
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title={locale === "en" ? "Image Job Editor" : "图片任务编辑区"}
        description={locale === "en" ? "Switch between drafting a fresh image job from the selected row and reusing a previous run." : "在基于当前条目新建图片任务、或基于上一条任务复用迭代之间切换。"}
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
              className={`rounded-md border p-4 text-left transition ${
                editorMode === "CREATE" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              <div className={`text-sm font-semibold ${editorMode === "CREATE" ? "text-[var(--text-1)]" : "text-[var(--text-1)]"}`}>
                {locale === "en" ? "Create From Row" : "基于条目新建"}
              </div>
              <div className={`mt-2 text-sm leading-6 ${editorMode === "CREATE" ? "text-[var(--text-2)]" : "text-[var(--text-2)]"}`}>
                {locale === "en" ? "Use the currently selected image-brief row as the source of truth." : "直接以当前选中的配图条目为起点，快速起一个新任务。"}
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
              className={`rounded-md border p-4 text-left transition ${
                editorMode === "REUSE" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              <div className={`text-sm font-semibold ${editorMode === "REUSE" ? "text-[var(--text-1)]" : "text-[var(--text-1)]"}`}>
                {locale === "en" ? "Reuse Last Run" : "复用上一轮任务"}
              </div>
              <div className={`mt-2 text-sm leading-6 ${editorMode === "REUSE" ? "text-[var(--text-2)]" : "text-[var(--text-2)]"}`}>
                {locale === "en" ? "Pull prompt, notes, and routing from the selected job to keep iterating." : "从右侧选中的任务回填 prompt、notes 和路由配置，继续往下迭代。"}
              </div>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="theme-panel-muted rounded-md p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-3)]">
                {editorMode === "CREATE" ? (locale === "en" ? "Current Row" : "当前条目") : locale === "en" ? "Reuse Source" : "复用来源"}
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
            <div className="theme-panel-muted rounded-md p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-3)]">{locale === "en" ? "Working Mode" : "当前工作模式"}</div>
              <p className="mt-2 text-sm font-medium text-[var(--text-1)]">
                {editorMode === "CREATE" ? (locale === "en" ? "Fresh generation pass" : "新一轮生成") : locale === "en" ? "Iterate on previous run" : "延续上一轮结果"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                {editorMode === "CREATE"
                  ? locale === "en"
                    ? "Best when you want the image brief to drive the first image pass."
                    : "适合让配图说明直接驱动第一轮出图。"
                  : locale === "en"
                    ? "Best when you want to keep the same route and refine prompt details."
                    : "适合沿用上一条任务的路由配置，只微调提示词细节。"}
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {selectedReview ? (
              <div className="rounded-md border border-[var(--border)] bg-transparent p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Image Brief Review" : "图片 brief 复核"}</div>
                  <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${getReviewTone(selectedReview.readiness)}`}>
                    {selectedReview.readiness === "READY" ? (locale === "en" ? "Ready to run" : "可直接开工") : locale === "en" ? "Revise first" : "建议先补强"}
                  </span>
                </div>
                <div className="mt-3">
                  <ScoreBar label={locale === "en" ? "readiness" : "开工分"} value={selectedReview.score} />
                </div>
                <div className="mt-3 text-sm leading-6 text-[var(--text-2)]">{selectedReview.summary}</div>
                {selectedReview.issues.length ? (
                  <div className="mt-3 rounded-md border border-[rgba(255,196,128,0.2)] bg-[rgba(255,196,128,0.08)] px-3 py-3 text-sm leading-6 text-[color:rgba(110,70,24,0.95)]">
                    {selectedReview.issues[0]}
                    {selectedReview.nextSteps[0] ? ` ${selectedReview.nextSteps[0]}` : ""}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-[var(--text-2)]">
                <span>{locale === "en" ? "Job Type" : "任务类型"}</span>
                <select
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
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
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
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
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                  value={providerModel}
                  onChange={(event) => setProviderModel(event.target.value)}
                  placeholder={getDefaultModel(jobType, provider)}
                />
              </label>
            </div>

            <div className="theme-panel-muted rounded-md p-4 text-sm text-[var(--text-2)]">
              {locale === "en"
                ? `Suggested combo: ${jobType} -> ${provider} / ${getDefaultModel(jobType, provider)}`
                : `推荐组合：${jobType} -> ${provider} / ${getDefaultModel(jobType, provider)}`}
            </div>

            <label className="block space-y-2 text-sm text-[var(--text-2)]">
              <span>{locale === "en" ? "Prompt" : "提示词"}</span>
              <textarea
                className="min-h-44 w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-4 text-sm leading-6 text-[var(--text-1)] outline-none"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </label>

            <label className="block space-y-2 text-sm text-[var(--text-2)]">
              <span>{locale === "en" ? "Notes" : "备注信息"}</span>
              <textarea
                className="min-h-32 w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-4 text-sm leading-6 text-[var(--text-1)] outline-none"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            {message ? <div className="theme-chip-ok rounded-md px-3 py-2 text-sm">{message}</div> : null}
            {error ? <div className="theme-chip-danger rounded-md px-3 py-2 text-sm">{error}</div> : null}

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-[var(--text-2)]">
                {editorMode === "CREATE"
                  ? locale === "en"
                    ? "The selected scene will be linked to this new job."
                    : "提交后会把当前配图条目与这条新任务关联起来。"
                  : locale === "en"
                    ? "This creates a new iteration based on the selected job, not an in-place overwrite."
                    : "这会基于所选任务再创建一条新迭代，不会覆盖旧任务。"}
              </div>
              <Button disabled={pending || !prompt.trim()} type="submit">
                {pending ? (locale === "en" ? "Creating..." : "创建中...") : editorMode === "CREATE" ? (locale === "en" ? "Create Image Job" : "创建图片任务") : locale === "en" ? "Create Iteration" : "创建迭代任务"}
              </Button>
            </div>
          </form>
        </div>
      </PanelCard>

      <div className="space-y-6">
        <PanelCard
          title={locale === "en" ? "Job History" : "图片任务历史"}
          description={locale === "en" ? "Keep the right rail focused on previous image runs so the center stays dedicated to editing." : "把历史图片任务固定在右侧，让中间区域始终专注在编辑与复用。"}
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-1">
              <label className="space-y-2 text-sm text-[var(--text-2)]">
                <span>{locale === "en" ? "Search jobs" : "搜索任务"}</span>
                <input
                  value={jobSearch}
                  onChange={(event) => setJobSearch(event.target.value)}
                  placeholder={locale === "en" ? "Prompt, frame, provider..." : "按提示词、镜头、provider 搜索"}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-2 text-sm text-[var(--text-2)]">
                    <span>{locale === "en" ? "Status" : "状态"}</span>
                    <select
                      value={jobStatusFilter}
                      onChange={(event) => setJobStatusFilter(event.target.value as "ALL" | RenderJobRow["job_status"])}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
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
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
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
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                    >
                      <option value="NEWEST">{locale === "en" ? "Newest first" : "最新优先"}</option>
                      <option value="OLDEST">{locale === "en" ? "Oldest first" : "最早优先"}</option>
                    </select>
                  </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-[var(--text-2)]">
              <span className="theme-chip rounded-sm px-2.5 py-1 font-medium">
                {locale === "en" ? `${filteredJobs.length} in view` : `当前视图 ${filteredJobs.length} 条`}
              </span>
              <span className="theme-chip-warn rounded-sm px-2.5 py-1 font-medium">
                {locale === "en" ? `${jobs.filter((job) => job.job_status === "RUNNING" || job.job_status === "QUEUED").length} active` : `${jobs.filter((job) => job.job_status === "RUNNING" || job.job_status === "QUEUED").length} 条进行中`}
              </span>
              <span className="theme-chip-ok rounded-sm px-2.5 py-1 font-medium">
                {locale === "en" ? `${jobs.filter((job) => job.job_status === "SUCCEEDED").length} done` : `${jobs.filter((job) => job.job_status === "SUCCEEDED").length} 条成功`}
              </span>
            </div>

            <div className="space-y-3">
              {filteredJobs.length ? (
                filteredJobs.map((job) => {
                  const input = getJobInput(job);
                  const linkedScene = getLinkedScene(rows, job);
                  const selected = selectedJob?.id === job.id;
                  const threadCount = job.script_scene_id
                    ? jobs.filter((item) => item.script_scene_id === job.script_scene_id).length
                    : job.storyboard_frame_id
                      ? jobs.filter((item) => item.storyboard_frame_id === job.storyboard_frame_id).length
                      : 0;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`grid w-full gap-3 rounded-md border p-4 text-left transition ${
                        selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface-solid)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${getStatusTone(job.job_status)}`}>{job.job_status}</span>
                        <div className={`text-sm ${selected ? "text-[var(--text-2)]" : "text-[var(--text-2)]"}`}>{formatDate(job.created_at, locale)}</div>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${selected ? "text-[var(--text-1)]" : "text-[var(--text-1)]"}`}>
                          {(input.frame_title || linkedScene?.frameTitle || (locale === "en" ? "Untitled frame" : "未命名镜头"))}
                        </div>
                        <div className={`mt-1 text-sm ${selected ? "text-[var(--text-2)]" : "text-[var(--text-2)]"}`}>
                          {job.job_type} · {job.provider}
                          {job.provider_model ? ` / ${job.provider_model}` : ""}
                        </div>
                        {getJobFeedback(job) ? (
                          <div className={`mt-1 text-xs ${selected ? "text-[var(--text-3)]" : "text-[var(--text-3)]"}`}>
                            {locale === "en" ? "Feedback saved" : "已记录结果反馈"}
                          </div>
                        ) : null}
                        {linkedScene ? (
                          <div className={`mt-1 text-xs ${selected ? "text-[var(--text-3)]" : "text-[var(--text-3)]"}`}>
                            {locale === "en" ? "Scene" : "场景"} #{linkedScene.frameOrder}
                          </div>
                        ) : null}
                        {threadCount > 1 ? (
                          <div className={`mt-1 text-xs ${selected ? "text-[var(--text-3)]" : "text-[var(--text-3)]"}`}>
                            {locale === "en" ? `${threadCount} iterations in thread` : `同线程共 ${threadCount} 版`}
                          </div>
                        ) : null}
                      </div>
                      <div className={`text-sm leading-6 ${selected ? "text-[var(--text-1)]" : "text-[var(--text-1)]"}`}>
                        {trimPreview(input.prompt || input.shot_goal || linkedScene?.shotGoal, locale === "en" ? "No prompt summary yet." : "当前还没有任务摘要。")}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-solid)] p-5 text-sm leading-6 text-[var(--text-2)]">
                  {jobs.length
                    ? locale === "en"
                      ? "No jobs match the current filters. Try widening the scope or clearing the search."
                      : "当前筛选条件下没有匹配任务，试试放宽范围或清空搜索。"
                    : locale === "en"
                      ? "No jobs yet. Create the first image task from the selected row."
                      : "还没有图片任务。先从当前条目创建第一个图片任务。"}
                </div>
              )}
            </div>
          </div>
        </PanelCard>

        <DetailPanel title={locale === "en" ? "Job Details" : "图片任务详情"} className="xl:sticky xl:top-6 xl:self-start">
          {selectedJob ? (
            (() => {
              const input = getJobInput(selectedJob);
              const output = getJobOutput(selectedJob);
              const linkedScene = getLinkedScene(rows, selectedJob);

              return (
                <>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{input.frame_title || linkedScene?.frameTitle || (locale === "en" ? "Untitled frame" : "未命名镜头")}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">
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
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Linked Scene" : "关联场景"}</div>
                    <div className="mt-2">{linkedScene ? `#${linkedScene.frameOrder} ${linkedScene.frameTitle}` : locale === "en" ? "No linked scene found." : "当前未找到可匹配场景。"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Prompt Summary" : "提示词摘要"}</div>
                    <div className="mt-2">{trimPreview(input.prompt || input.visual_prompt || linkedScene?.visualPrompt, locale === "en" ? "No prompt captured." : "当前没有记录提示词。", 240)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Notes" : "备注"}</div>
                    <div className="mt-2 whitespace-pre-wrap">{trimPreview(input.notes, locale === "en" ? "No notes attached." : "当前没有附加备注。", 240)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Job Status" : "任务状态"}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${getStatusTone(selectedJob.job_status)}`}>{selectedJob.job_status}</span>
                      <span className="rounded-sm border border-[var(--border)] px-2.5 py-1 text-xs font-medium">
                        {formatDate(selectedJob.created_at, locale)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Version Thread" : "版本链路"}</div>
                    <div className="mt-2 text-[var(--text-2)]">
                      {selectedJobThread.length > 1
                        ? locale === "en"
                          ? `This run is version ${selectedJobThreadIndex + 1} of ${selectedJobThread.length} for the same scene.`
                          : `这条任务是同一场景下的第 ${selectedJobThreadIndex + 1} / ${selectedJobThread.length} 个版本。`
                        : locale === "en"
                          ? "This scene has only one version so far."
                          : "这个场景目前只有一个版本。"}
                    </div>
                    {selectedJobThread.length ? (
                      <div className="mt-3 space-y-2">
                        {selectedJobThread.map((job, index) => (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => setSelectedJobId(job.id)}
                            className={`w-full rounded-md border px-3 py-3 text-left transition ${
                              job.id === selectedJob.id
                                ? "theme-panel-muted border-[var(--border)]"
                                : "border-[var(--border)] hover:bg-transparent"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm text-[var(--text-1)]">{locale === "en" ? `Version ${index + 1}` : `版本 ${index + 1}`}</div>
                              <span className={`rounded-sm px-2 py-0.5 text-[11px] font-medium ${getStatusTone(job.job_status)}`}>{job.job_status}</span>
                            </div>
                            <div className="mt-2 text-xs text-[var(--text-3)]">{formatDate(job.created_at, locale)}</div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Outputs" : "任务输出"}</div>
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
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Result Feedback" : "结果反馈"}</div>
                    <div className="mt-3 space-y-4 rounded-md border border-[var(--border)] bg-transparent p-4">
                      <label className="space-y-2 text-sm text-[var(--text-2)]">
                        <span>{locale === "en" ? "Verdict" : "结论"}</span>
                        <select
                          value={feedbackVerdict}
                          onChange={(event) => setFeedbackVerdict(event.target.value as RenderJobFeedbackVerdict)}
                          className="w-full rounded-md border border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--text-1)] outline-none"
                        >
                          <option value="KEEP">{getFeedbackVerdictLabel("KEEP", locale)}</option>
                          <option value="RETRY">{getFeedbackVerdictLabel("RETRY", locale)}</option>
                          <option value="REWRITE_BRIEF">{getFeedbackVerdictLabel("REWRITE_BRIEF", locale)}</option>
                        </select>
                      </label>
                      <div className="space-y-2">
                        <div className="text-sm text-[var(--text-2)]">{locale === "en" ? "Issue tags" : "主要问题标签"}</div>
                        <div className="flex flex-wrap gap-2">
                          {feedbackIssueOptions.map((issue) => {
                            const selected = feedbackIssues.includes(issue);
                            return (
                              <button
                                key={issue}
                                type="button"
                                onClick={() => toggleFeedbackIssue(issue)}
                                className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
                                  selected
                                    ? "theme-chip-warn border-transparent"
                                    : "border-[var(--border)] bg-transparent text-[var(--text-2)]"
                                }`}
                              >
                                {getFeedbackIssueLabel(issue, locale)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <label className="space-y-2 text-sm text-[var(--text-2)]">
                        <span>{locale === "en" ? "Short note" : "补充说明"}</span>
                        <textarea
                          value={feedbackNote}
                          onChange={(event) => setFeedbackNote(event.target.value)}
                          className="min-h-28 w-full rounded-md border border-[var(--border)] bg-transparent px-4 py-3 text-sm leading-6 text-[var(--text-1)] outline-none"
                          placeholder={locale === "en" ? "What failed or worked in this run?" : "这一轮到底差在哪里，或者哪一点是能保留的？"}
                        />
                      </label>
                      {selectedJobFeedback ? (
                        <div className="text-xs text-[var(--text-3)]">
                          {locale === "en" ? "Latest saved verdict:" : "最近一次保存："} {getFeedbackVerdictLabel(selectedJobFeedback.verdict, locale)}
                        </div>
                      ) : null}
                      <Button type="button" variant="secondary" onClick={() => void saveFeedback()} disabled={feedbackPending}>
                        {feedbackPending ? (locale === "en" ? "Saving..." : "保存中...") : locale === "en" ? "Save Feedback" : "保存结果反馈"}
                      </Button>
                    </div>
                  </div>
                  {previousThreadJob ? (
                    <div>
                      <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Previous Version Compare" : "与上一版本对比"}</div>
                      <div className="mt-3 grid gap-3">
                        <div className="rounded-md border border-[var(--border)] p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">{locale === "en" ? "Current" : "当前版本"}</div>
                          <div className="mt-3 space-y-3">
                            {selectedJob.render_assets?.length ? (
                              selectedJob.render_assets.slice(0, 1).map((asset) => <AssetPreviewCard key={asset.id} asset={asset} locale={locale} />)
                            ) : (
                              <div className="text-sm text-[var(--text-2)]">{locale === "en" ? "No preview asset on current version." : "当前版本还没有可对比预览素材。"}</div>
                            )}
                          </div>
                        </div>
                        <div className="rounded-md border border-[var(--border)] p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">{locale === "en" ? "Previous" : "上一版本"}</div>
                          <div className="mt-3 space-y-3">
                            {previousThreadJob.render_assets?.length ? (
                              previousThreadJob.render_assets.slice(0, 1).map((asset) => <AssetPreviewCard key={asset.id} asset={asset} locale={locale} />)
                            ) : (
                              <div className="text-sm text-[var(--text-2)]">{locale === "en" ? "No preview asset on the previous version." : "上一版本还没有可对比预览素材。"}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Output Summary" : "输出摘要"}</div>
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
                    <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "References" : "参考素材"}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(input.references?.length ? input.references : linkedScene?.references ?? []).length ? (
                        (input.references?.length ? input.references : linkedScene?.references ?? []).map((reference, index) => (
                          <span key={`${reference.label ?? "reference"}-${index}`} className="rounded-sm border border-[var(--border)] px-2.5 py-1 text-xs font-medium">
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
                      <div className="text-sm font-medium text-[var(--text-1)]">{locale === "en" ? "Error" : "错误信息"}</div>
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
  );
}
