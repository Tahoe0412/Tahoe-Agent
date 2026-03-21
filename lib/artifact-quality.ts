const GENERIC_TITLE_PATTERNS = ["最新", "揭秘", "来了", "震撼", "未来已来", "不看后悔", "太炸裂", "带你了解"];
const HOOK_SIGNALS = ["?", "？", "为什么", "如何", "竟然", "首次", "终于", "只用", "正在", "已经", "vs", "对比", "真相"];
const ABSTRACT_VISUAL_WORDS = ["高级感", "科技感", "未来感", "氛围感", "震撼", "酷炫", "梦幻", "史诗", "高级", "神秘"];
const SCENE_ACTION_WORDS = ["走", "跑", "看", "抬", "拿", "按", "转", "切", "出现", "推进", "拉近", "俯拍", "环绕", "挥手", "打开", "点击"];
const SCENE_ENVIRONMENT_WORDS = ["实验室", "车间", "街道", "办公室", "展厅", "飞船", "火星", "工厂", "城市", "屏幕", "桌面", "仓库", "商店", "舞台", "会议室"];
const PROOF_WORDS = ["数据", "实测", "案例", "对比", "用户", "成本", "效率", "分钟", "天", "%", "倍", "条", "项", "证据", "报告"];

export type QualityAlert = {
  tone: "warn" | "ok";
  label: string;
  detail: string;
};

function containsAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function compact(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function assessVideoTitlePack(input: {
  recommendedTitle: string;
  titleOptions: string[];
}): QualityAlert[] {
  const title = compact(input.recommendedTitle);
  const uniqueOptions = Array.from(new Set(input.titleOptions.map((item) => compact(item)).filter(Boolean)));
  const alerts: QualityAlert[] = [];

  if (!title) {
    alerts.push({ tone: "warn", label: "标题缺失", detail: "还没有一条可直接用的推荐标题。" });
    return alerts;
  }

  if (title.length < 10 || !containsAny(title, HOOK_SIGNALS)) {
    alerts.push({ tone: "warn", label: "钩子偏弱", detail: "推荐标题还不够像一个能拦住用户继续滑走的钩子。" });
  }

  if (containsAny(title, GENERIC_TITLE_PATTERNS)) {
    alerts.push({ tone: "warn", label: "表达偏泛", detail: "标题仍然带有常见泛化措辞，差异化还不够。" });
  }

  if (uniqueOptions.length < 3) {
    alerts.push({ tone: "warn", label: "备选不够", detail: "备选标题太少，不利于快速比较不同传播角度。" });
  }

  if (alerts.length === 0) {
    alerts.push({ tone: "ok", label: "标题包可用", detail: "当前标题已经有明确钩子，也有足够对比空间。" });
  }

  return alerts;
}

export function assessPublishCopy(input: {
  leadIn: string;
  description: string;
  highlights: string[];
  cta: string;
}): QualityAlert[] {
  const leadIn = compact(input.leadIn);
  const description = compact(input.description);
  const highlights = input.highlights.map((item) => compact(item)).filter(Boolean);
  const cta = compact(input.cta);
  const alerts: QualityAlert[] = [];

  if (description.length < 90) {
    alerts.push({ tone: "warn", label: "正文偏薄", detail: "发布正文的信息密度还不够，容易看起来像一句泛介绍。" });
  }

  if (highlights.length < 2 || !containsAny(highlights.join(" "), PROOF_WORDS)) {
    alerts.push({ tone: "warn", label: "证据感不足", detail: "亮点里还缺少数据、对比、案例或其他可感知的证据点。" });
  }

  if (!leadIn || leadIn.length < 16) {
    alerts.push({ tone: "warn", label: "导语不够抓人", detail: "导语还不够像开场第一句，建议更直接抛出问题、冲突或新鲜事实。" });
  }

  if (!cta || cta.length < 8) {
    alerts.push({ tone: "warn", label: "CTA 偏弱", detail: "还没有一个清楚的后续动作引导。" });
  }

  if (alerts.length === 0) {
    alerts.push({ tone: "ok", label: "发布文案可发", detail: "当前文案已经具备开场、信息密度和动作引导。" });
  }

  return alerts;
}

export function assessScenePrompt(input: {
  rewritten: string;
  shotGoal: string;
  visualPriority: string[];
  avoid: string[];
  continuityGroup: string;
}): QualityAlert[] {
  const rewritten = compact(input.rewritten);
  const shotGoal = compact(input.shotGoal);
  const alerts: QualityAlert[] = [];
  const merged = `${rewritten} ${shotGoal}`;

  if (rewritten.length < 50) {
    alerts.push({ tone: "warn", label: "镜头文本偏短", detail: "这条镜头还没有写到足够可执行，后续模型容易自己脑补。" });
  }

  if (!containsAny(merged, SCENE_ACTION_WORDS)) {
    alerts.push({ tone: "warn", label: "动作不清", detail: "镜头里缺少明确动作词，容易只剩概念而不是可拍画面。" });
  }

  if (!containsAny(merged, SCENE_ENVIRONMENT_WORDS)) {
    alerts.push({ tone: "warn", label: "环境锚点不足", detail: "镜头里还缺少明确场景环境，生成时会更漂。" });
  }

  if (containsAny(merged, ABSTRACT_VISUAL_WORDS) && input.visualPriority.length < 2) {
    alerts.push({ tone: "warn", label: "视觉描述偏虚", detail: "目前用了较抽象的视觉词，但还没有足够具体的主体和视觉重点。" });
  }

  if (input.avoid.length === 0 || !compact(input.continuityGroup)) {
    alerts.push({ tone: "warn", label: "控制条件不足", detail: "avoid 标签或连续性分组还不够完整，不利于稳定出图 / 出视频。" });
  }

  if (alerts.length === 0) {
    alerts.push({ tone: "ok", label: "镜头提示词可用", detail: "这条镜头已经有动作、环境和控制条件，适合继续往下游生成。" });
  }

  return alerts;
}

export function assessMarketingMasterCopy(input: {
  longFormCopy: string;
  proofPoints: string[];
  callToAction: string;
  qualityIssues: string[];
}): QualityAlert[] {
  const longFormCopy = compact(input.longFormCopy);
  const proofPoints = input.proofPoints.map((item) => compact(item)).filter(Boolean);
  const cta = compact(input.callToAction);
  const alerts: QualityAlert[] = [];

  if (input.qualityIssues.length > 0) {
    alerts.push({ tone: "warn", label: "诊断仍有问题", detail: input.qualityIssues.slice(0, 2).join("；") });
  }

  if (longFormCopy.length < 160) {
    alerts.push({ tone: "warn", label: "主稿偏薄", detail: "主稿还太短，承载不了完整商业叙事和平台拆分。" });
  }

  if (proofPoints.length < 2 || !containsAny(proofPoints.join(" "), PROOF_WORDS)) {
    alerts.push({ tone: "warn", label: "卖点证据不足", detail: "主稿还缺少可被相信的证明点，容易只剩口号。" });
  }

  if (!cta || cta.length < 8) {
    alerts.push({ tone: "warn", label: "动作引导不清", detail: "还没有一个明确引导用户下一步动作的 CTA。" });
  }

  if (alerts.length === 0) {
    alerts.push({ tone: "ok", label: "主稿基础扎实", detail: "当前主稿已经有叙事、卖点和动作引导，可以继续派生。" });
  }

  return alerts;
}

export function assessAdCreative(input: {
  hook: string;
  sellingPoints: string[];
  visualDirection: string;
  shotTone: string;
}): QualityAlert[] {
  const hook = compact(input.hook);
  const sellingPoints = input.sellingPoints.map((item) => compact(item)).filter(Boolean);
  const visualDirection = compact(input.visualDirection);
  const shotTone = compact(input.shotTone);
  const alerts: QualityAlert[] = [];

  if (!hook || hook.length < 12 || !containsAny(hook, HOOK_SIGNALS)) {
    alerts.push({ tone: "warn", label: "广告钩子偏弱", detail: "核心钩子还不够像一句能立刻抓住人的广告开场。" });
  }

  if (sellingPoints.length < 2 || !containsAny(sellingPoints.join(" "), PROOF_WORDS)) {
    alerts.push({ tone: "warn", label: "卖点不够可视化", detail: "卖点还缺少可被看到、被对比、被验证的表达。" });
  }

  if (!visualDirection || (containsAny(visualDirection, ABSTRACT_VISUAL_WORDS) && visualDirection.length < 24)) {
    alerts.push({ tone: "warn", label: "视觉方向太抽象", detail: "视觉方向更像气质词，还不够像能直接拆成镜头的画面说明。" });
  }

  if (!shotTone || (containsAny(shotTone, ABSTRACT_VISUAL_WORDS) && shotTone.length < 14)) {
    alerts.push({ tone: "warn", label: "镜头气质偏虚", detail: "镜头气质还缺少节奏、机位或运动方式等更具体的指令。" });
  }

  if (alerts.length === 0) {
    alerts.push({ tone: "ok", label: "创意方向可拍", detail: "当前创意包已经足够支撑广告脚本和广告分镜继续展开。" });
  }

  return alerts;
}
