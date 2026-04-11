export type ImageBriefReviewInput = {
  frameTitle: string;
  shotGoal: string;
  rewritten: string;
  visualPrompt: string | null;
  cameraPlan: string | null;
  compositionNotes: string | null;
  referenceCount: number;
  assetReady?: boolean;
  missing?: string[];
  riskFlags?: string[];
};

export type ImageBriefReview = {
  score: number;
  readiness: "READY" | "NEEDS_REVISION";
  summary: string;
  strengths: string[];
  issues: string[];
  nextSteps: string[];
};

const ABSTRACT_PHRASES = [
  "高级感",
  "氛围感",
  "科技感",
  "质感",
  "视觉冲击",
  "好看",
  "精致",
  "电影感",
  "氛围",
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizedText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function hasUsefulLength(value: string, min: number) {
  return value.trim().length >= min;
}

function isPromptTooAbstract(prompt: string) {
  if (!prompt) return false;
  const abstractHitCount = ABSTRACT_PHRASES.filter((item) => prompt.includes(item)).length;
  const punctuationCount = (prompt.match(/[，,、；;。]/g) ?? []).length;
  return abstractHitCount >= 2 && prompt.length < 90 && punctuationCount < 3;
}

export function reviewImageBrief(input: ImageBriefReviewInput): ImageBriefReview {
  const shotGoal = normalizedText(input.shotGoal);
  const rewritten = normalizedText(input.rewritten);
  const visualPrompt = normalizedText(input.visualPrompt);
  const cameraPlan = normalizedText(input.cameraPlan);
  const compositionNotes = normalizedText(input.compositionNotes);
  const missing = input.missing ?? [];
  const riskFlags = input.riskFlags ?? [];
  const strengths: string[] = [];
  const issues: string[] = [];
  const nextSteps: string[] = [];

  let score = 88;

  if (hasUsefulLength(shotGoal, 14)) {
    strengths.push("画面目标已经写清楚这张图想传达什么。");
  } else {
    score -= 18;
    issues.push("画面目标偏短，读不出这张图的核心任务。");
    nextSteps.push("先把画面目标补成一句完整判断：主体、动作、结果至少写清两项。");
  }

  if (hasUsefulLength(rewritten, 40)) {
    strengths.push("配图说明已经提供了可执行的文字底稿。");
  } else {
    score -= 14;
    issues.push("配图说明信息量不够，后续容易只剩抽象风格词。");
    nextSteps.push("把配图说明补到 2-4 句，写出主体、环境、关键细节和想避开的画面。");
  }

  if (hasUsefulLength(visualPrompt, 80)) {
    strengths.push("视觉提示词长度足够，适合直接进入第一轮出图。");
  } else if (hasUsefulLength(visualPrompt, 30)) {
    score -= 10;
    issues.push("视觉提示词已存在，但细节密度还不够稳定。");
    nextSteps.push("把提示词补上构图、镜头距离、材质、光线或主体细节。");
  } else {
    score -= 24;
    issues.push("当前还没有足够具体的视觉提示词。");
    nextSteps.push("先补一版完整 prompt，再进图片生产。");
  }

  if (visualPrompt && isPromptTooAbstract(visualPrompt)) {
    score -= 12;
    issues.push("提示词偏抽象，风格词多，具体可画内容少。");
    nextSteps.push("减少“高级感/氛围感”这类词，改成可见的环境、服装、道具、光线描述。");
  }

  if (input.referenceCount >= 2) {
    strengths.push("参考素材数量够用，能帮第一轮出图更稳。");
  } else if (input.referenceCount === 1) {
    score -= 6;
    issues.push("只有 1 份参考素材，风格或主体仍可能漂。");
    nextSteps.push("再补 1 张关键参考，最好分别覆盖主体和场景。");
  } else {
    score -= 15;
    issues.push("当前没有参考素材，第一轮出图会更依赖模型猜测。");
    nextSteps.push("至少补 1 张主体或场景参考，再开始出图。");
  }

  if (input.assetReady) {
    strengths.push("当前素材判断显示已基本齐备。");
  } else {
    score -= 8;
    if (missing.length > 0) {
      issues.push(`关键素材还有缺口：${missing.slice(0, 2).join("；")}`);
    } else {
      issues.push("当前素材状态还没达到可直接开工。");
    }
    nextSteps.push("先补齐缺失素材或参考，再开图片任务。");
  }

  if (cameraPlan || compositionNotes) {
    strengths.push("已经给了构图或镜头计划，执行时更容易统一。");
  } else {
    score -= 8;
    issues.push("缺少构图或镜头计划，成图容易只有主题没有画面组织。");
    nextSteps.push("至少补一项：景别、机位、主体位置、前后景关系。");
  }

  if (riskFlags.length > 0) {
    score -= Math.min(16, riskFlags.length * 5);
    issues.push(`当前有明显风险：${riskFlags.slice(0, 2).join("；")}`);
    nextSteps.push("先处理风险提示，再决定是否直接出图。");
  }

  if (missing.length > 1) {
    score -= Math.min(10, (missing.length - 1) * 3);
  }

  score = clampScore(score);

  const readiness =
    score >= 76 &&
    hasUsefulLength(visualPrompt, 30) &&
    hasUsefulLength(shotGoal, 14) &&
    (input.referenceCount > 0 || input.assetReady) &&
    riskFlags.length === 0
      ? "READY"
      : "NEEDS_REVISION";

  const summary =
    readiness === "READY"
      ? "这条配图说明已经能进第一轮出图，重点盯参考图和细节漂移。"
      : "这条配图说明还不够稳，先补提示词、参考或构图再开工。";

  return {
    score,
    readiness,
    summary,
    strengths: strengths.slice(0, 4),
    issues: issues.slice(0, 4),
    nextSteps: nextSteps.slice(0, 4),
  };
}
