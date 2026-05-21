/**
 * Quality Gate — Rule-based article quality checker.
 *
 * Evaluates articles against their editorial direction's criteria without
 * requiring an LLM call. Used for fast pre-publish screening.
 */

import { getEditorialDirectionPresets } from "@/lib/editorial-direction-presets";

export type QualityCheckItem = {
  name: string;
  passed: boolean;
  score: number; // 0-100
  message: string;
};

export type QualityCheckResult = {
  passed: boolean;
  score: number; // 0-100
  checks: QualityCheckItem[];
  suggestions: string[];
};

type DirectionConfig = {
  forbiddenPatterns: string[];
  targetWordCount: { min: number; max: number };
  qualityChecklist: string[];
};

function getDirectionConfig(direction: string): DirectionConfig | null {
  const presets = getEditorialDirectionPresets("zh");
  const preset = presets.find(
    (p) => p.label === direction || p.id === direction || p.topic === direction,
  );
  if (!preset) return null;
  return {
    forbiddenPatterns: preset.forbiddenPatterns,
    targetWordCount: preset.targetWordCount,
    qualityChecklist: preset.qualityChecklist,
  };
}

/** Count Chinese + ASCII words. */
function countWords(text: string): number {
  // Chinese characters count as 1 word each
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  // English words
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function checkWordCount(text: string, config: DirectionConfig): QualityCheckItem {
  const count = countWords(text);
  const { min, max } = config.targetWordCount;

  if (count >= min && count <= max) {
    return { name: "字数范围", passed: true, score: 100, message: `${count} 字，在目标范围 ${min}-${max} 内` };
  }
  if (count < min) {
    const ratio = Math.max(0, count / min);
    return {
      name: "字数范围",
      passed: false,
      score: Math.round(ratio * 70),
      message: `${count} 字，低于目标最低 ${min} 字，缺少 ${min - count} 字`,
    };
  }
  // Over max
  const overRatio = Math.min(1, (count - max) / max);
  return {
    name: "字数范围",
    passed: count <= max * 1.2, // 20% tolerance
    score: Math.round(Math.max(50, 100 - overRatio * 100)),
    message: `${count} 字，超出目标最高 ${max} 字`,
  };
}

export function checkForbiddenPatterns(text: string, config: DirectionConfig): QualityCheckItem {
  const found: string[] = [];
  for (const pattern of config.forbiddenPatterns) {
    if (text.includes(pattern)) {
      found.push(pattern);
    }
  }

  if (found.length === 0) {
    return { name: "禁用词检查", passed: true, score: 100, message: "未发现禁用表达" };
  }

  return {
    name: "禁用词检查",
    passed: false,
    score: Math.max(0, 100 - found.length * 20),
    message: `发现 ${found.length} 个禁用表达：${found.join("、")}`,
  };
}

export function checkInformationDensity(text: string): QualityCheckItem {
  // Heuristic: count unique proper nouns, numbers, and specific terms
  const numbers = (text.match(/\d+[\d,.%]*%?/g) || []).length;
  const properNouns = (text.match(/[A-Z][a-zA-Z]{2,}/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length;

  if (totalChars === 0) {
    return { name: "信息密度", passed: false, score: 0, message: "文章为空" };
  }

  // Density score: data points per 100 chars
  const density = ((numbers + properNouns) / totalChars) * 100;

  if (density >= 1.5) {
    return { name: "信息密度", passed: true, score: 100, message: `信息密度高：${numbers} 个数据点，${properNouns} 个专有名词` };
  }
  if (density >= 0.8) {
    return { name: "信息密度", passed: true, score: 75, message: `信息密度中等：${numbers} 个数据点，${properNouns} 个专有名词` };
  }
  return {
    name: "信息密度",
    passed: false,
    score: Math.round(density / 0.8 * 50),
    message: `信息密度偏低：仅 ${numbers} 个数据点和 ${properNouns} 个专有名词，建议增加具体数据和来源`,
  };
}

export function checkTitleQuality(title: string): QualityCheckItem {
  const titleLength = countWords(title);

  const issues: string[] = [];

  if (titleLength < 8) {
    issues.push("标题过短，建议 10-30 字");
  }
  if (titleLength > 35) {
    issues.push("标题过长，建议控制在 30 字以内");
  }

  // Check for clickbait patterns
  const clickbait = ["震惊", "必看", "速看", "赶紧", "太牛了", "绝了", "99%的人不知道"];
  for (const pattern of clickbait) {
    if (title.includes(pattern)) {
      issues.push(`标题含有标题党用词「${pattern}」`);
    }
  }

  // Good title patterns: has numbers, has colon/question mark (indicates structure)
  const hasStructure = /[：:？?｜|]/.test(title);
  const hasNumber = /\d/.test(title);

  let score = 70;
  if (hasStructure) score += 15;
  if (hasNumber) score += 15;
  score -= issues.length * 15;
  score = Math.max(0, Math.min(100, score));

  if (issues.length === 0) {
    return { name: "标题质量", passed: true, score, message: "标题长度适中，结构清晰" };
  }
  return {
    name: "标题质量",
    passed: score >= 60,
    score,
    message: issues.join("；"),
  };
}

export function checkOpeningHook(text: string): QualityCheckItem {
  const firstParagraph = splitParagraphs(text)[0] ?? "";
  const firstSentence = firstParagraph.split(/[。！？!?；;]/)[0] ?? "";

  const genericOpenings = [
    "近日", "最近", "随着", "众所周知", "在当今", "如今", "当下",
    "大家好", "今天我们来", "不知道大家有没有注意到",
  ];

  for (const opening of genericOpenings) {
    if (firstSentence.trimStart().startsWith(opening)) {
      return {
        name: "开头吸引力",
        passed: false,
        score: 40,
        message: `开头使用了泛泛的「${opening}」开场，建议直接给出核心事实或场景`,
      };
    }
  }

  // Check if first paragraph is too short (likely weak hook)
  if (countWords(firstParagraph) < 20) {
    return {
      name: "开头吸引力",
      passed: true,
      score: 60,
      message: "开头段落较短，确保第一段就传递核心信息",
    };
  }

  return { name: "开头吸引力", passed: true, score: 85, message: "开头避免了泛泛开场" };
}

export function checkParagraphStructure(text: string): QualityCheckItem {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length <= 1) {
    return {
      name: "段落结构",
      passed: false,
      score: 20,
      message: "文章没有分段，读者很难扫描和阅读",
    };
  }

  if (paragraphs.length < 4) {
    return {
      name: "段落结构",
      passed: true,
      score: 60,
      message: `仅 ${paragraphs.length} 段，建议增加段落层次`,
    };
  }

  // Check for wall-of-text paragraphs (any paragraph > 300 chars without a break)
  const longParagraphs = paragraphs.filter((p) => countWords(p) > 250);
  if (longParagraphs.length > 0) {
    return {
      name: "段落结构",
      passed: true,
      score: 70,
      message: `${longParagraphs.length} 个段落超过 250 字，建议拆分为更短的段落`,
    };
  }

  return {
    name: "段落结构",
    passed: true,
    score: 90,
    message: `${paragraphs.length} 个段落，结构清晰`,
  };
}

/**
 * Run all quality checks on an article.
 */
export function runQualityCheck(title: string, content: string, direction: string): QualityCheckResult {
  const config = getDirectionConfig(direction);

  const checks: QualityCheckItem[] = [];

  // Direction-specific checks (if config found)
  if (config) {
    checks.push(checkWordCount(content, config));
    checks.push(checkForbiddenPatterns(content, config));
  }

  // Universal checks
  checks.push(checkInformationDensity(content));
  checks.push(checkTitleQuality(title));
  checks.push(checkOpeningHook(content));
  checks.push(checkParagraphStructure(content));

  // Calculate overall score (weighted average)
  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const avgScore = Math.round(totalScore / checks.length);
  const allPassed = checks.every((c) => c.passed);

  // Generate suggestions from failed checks
  const suggestions = checks
    .filter((c) => !c.passed || c.score < 70)
    .map((c) => `[${c.name}] ${c.message}`);

  return {
    passed: allPassed && avgScore >= 60,
    score: avgScore,
    checks,
    suggestions,
  };
}
