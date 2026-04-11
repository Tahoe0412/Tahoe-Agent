export type RenderJobFeedbackVerdict = "KEEP" | "RETRY" | "REWRITE_BRIEF";
export type RenderJobFeedbackIssue =
  | "PROMPT_TOO_ABSTRACT"
  | "SUBJECT_DRIFT"
  | "STYLE_DRIFT"
  | "COMPOSITION_WEAK"
  | "DETAIL_TOO_THIN"
  | "TEXT_ARTIFACTS"
  | "REFERENCE_NOT_USED";

export type RenderJobFeedback = {
  verdict: RenderJobFeedbackVerdict;
  issue_tags: RenderJobFeedbackIssue[];
  note?: string;
  updated_at?: string;
};

export type RenderJobFeedbackCarrier = {
  id: string;
  script_scene_id?: string | null;
  storyboard_frame_id?: string | null;
  output_json?: unknown;
  created_at?: string | Date;
};

export type RowFeedbackSummary = {
  totalFeedbacks: number;
  rewriteCount: number;
  retryCount: number;
  keepCount: number;
  topIssues: RenderJobFeedbackIssue[];
  latestVerdict: RenderJobFeedbackVerdict | null;
  latestNote: string;
  summary: string;
};

const feedbackIssueLabels: Record<RenderJobFeedbackIssue, { zh: string; en: string }> = {
  PROMPT_TOO_ABSTRACT: { zh: "提示词太虚", en: "Prompt too abstract" },
  SUBJECT_DRIFT: { zh: "主体漂移", en: "Subject drift" },
  STYLE_DRIFT: { zh: "风格漂移", en: "Style drift" },
  COMPOSITION_WEAK: { zh: "构图弱", en: "Weak composition" },
  DETAIL_TOO_THIN: { zh: "细节太薄", en: "Thin detail" },
  TEXT_ARTIFACTS: { zh: "文字伪影", en: "Text artifacts" },
  REFERENCE_NOT_USED: { zh: "参考图没吃进去", en: "Reference not used" },
};

export const feedbackIssueOptions: RenderJobFeedbackIssue[] = [
  "PROMPT_TOO_ABSTRACT",
  "SUBJECT_DRIFT",
  "STYLE_DRIFT",
  "COMPOSITION_WEAK",
  "DETAIL_TOO_THIN",
  "TEXT_ARTIFACTS",
  "REFERENCE_NOT_USED",
];

export function getJobFeedback(job: RenderJobFeedbackCarrier): RenderJobFeedback | null {
  const output = job.output_json;
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return null;
  }

  const feedback = (output as Record<string, unknown>).feedback;
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) {
    return null;
  }

  const source = feedback as Record<string, unknown>;
  const verdict = source.verdict;
  const issueTags = Array.isArray(source.issue_tags)
    ? source.issue_tags.filter(
        (item): item is RenderJobFeedbackIssue =>
          item === "PROMPT_TOO_ABSTRACT" ||
          item === "SUBJECT_DRIFT" ||
          item === "STYLE_DRIFT" ||
          item === "COMPOSITION_WEAK" ||
          item === "DETAIL_TOO_THIN" ||
          item === "TEXT_ARTIFACTS" ||
          item === "REFERENCE_NOT_USED",
      )
    : [];

  if (verdict !== "KEEP" && verdict !== "RETRY" && verdict !== "REWRITE_BRIEF") {
    return null;
  }

  return {
    verdict,
    issue_tags: issueTags,
    note: typeof source.note === "string" ? source.note : "",
    updated_at: typeof source.updated_at === "string" ? source.updated_at : undefined,
  };
}

export function getFeedbackVerdictLabel(verdict: RenderJobFeedbackVerdict, locale: "zh" | "en") {
  if (verdict === "KEEP") {
    return locale === "en" ? "Keep this result" : "保留这一版";
  }

  if (verdict === "RETRY") {
    return locale === "en" ? "Retry image generation" : "继续重试出图";
  }

  return locale === "en" ? "Rewrite the brief first" : "先改 brief";
}

export function getFeedbackIssueLabel(issue: RenderJobFeedbackIssue, locale: "zh" | "en") {
  return locale === "en" ? feedbackIssueLabels[issue].en : feedbackIssueLabels[issue].zh;
}

export function summarizeRowFeedback(params: {
  jobs: RenderJobFeedbackCarrier[];
  scriptSceneId: string;
  frameId?: string | null;
}): RowFeedbackSummary | null {
  const matched = params.jobs
    .filter((job) => job.script_scene_id === params.scriptSceneId || (params.frameId && job.storyboard_frame_id === params.frameId))
    .map((job) => ({
      job,
      feedback: getJobFeedback(job),
    }))
    .filter((item): item is { job: RenderJobFeedbackCarrier; feedback: RenderJobFeedback } => Boolean(item.feedback))
    .sort((a, b) => new Date(b.job.created_at ?? 0).getTime() - new Date(a.job.created_at ?? 0).getTime());

  if (!matched.length) {
    return null;
  }

  const rewriteCount = matched.filter((item) => item.feedback.verdict === "REWRITE_BRIEF").length;
  const retryCount = matched.filter((item) => item.feedback.verdict === "RETRY").length;
  const keepCount = matched.filter((item) => item.feedback.verdict === "KEEP").length;
  const issueCounts = new Map<RenderJobFeedbackIssue, number>();

  for (const item of matched) {
    for (const issue of item.feedback.issue_tags) {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    }
  }

  const topIssues = [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue]) => issue);

  const latest = matched[0]?.feedback ?? null;
  let summary = "最近已有图片结果反馈，可直接根据失败模式补强当前 brief。";

  if (rewriteCount >= 2 && topIssues.length) {
    summary = `最近多轮都指向 brief 本身要改，主要问题是${topIssues.slice(0, 2).map((issue) => getFeedbackIssueLabel(issue, "zh")).join("、")}。`;
  } else if (retryCount >= 2 && topIssues.length) {
    summary = `最近多轮都在继续重试，最常见的问题是${topIssues.slice(0, 2).map((issue) => getFeedbackIssueLabel(issue, "zh")).join("、")}。`;
  } else if (keepCount > 0) {
    summary = "这条说明已经产出过可保留结果，适合在相近方向上继续微调。";
  }

  return {
    totalFeedbacks: matched.length,
    rewriteCount,
    retryCount,
    keepCount,
    topIssues,
    latestVerdict: latest?.verdict ?? null,
    latestNote: latest?.note?.trim() ?? "",
    summary,
  };
}
