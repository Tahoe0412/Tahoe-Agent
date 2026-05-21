/**
 * Article Sample Service — manages the writing sample library.
 *
 * Stores excellent articles (internal or external) as reusable references
 * for style learning. Provides style summaries for prompt injection.
 */

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const MAX_SAMPLES_PER_DIRECTION = 20;

export type CreateSampleInput = {
  accountDirection: string;
  title: string;
  content: string;
  sourceProjectId?: string;
  sourceUrl?: string;
  tags?: string[];
  isExternal?: boolean;
  qualityScore?: number;
};

export type StyleInsight = {
  avgWordCount: number;
  avgParagraphCount: number;
  commonOpeningPatterns: string[];
  titlePatterns: string[];
  toneKeywords: string[];
  sampleCount: number;
};

export class ArticleSampleService {
  /** Add a new article sample. */
  async addSample(input: CreateSampleInput) {
    // Check limit
    const count = await prisma.articleSample.count({
      where: { account_direction: input.accountDirection },
    });

    if (count >= MAX_SAMPLES_PER_DIRECTION) {
      // Remove the lowest-quality one to make room
      const lowest = await prisma.articleSample.findFirst({
        where: { account_direction: input.accountDirection },
        orderBy: [{ quality_score: "asc" }, { created_at: "asc" }],
      });
      if (lowest) {
        await prisma.articleSample.delete({ where: { id: lowest.id } });
      }
    }

    return prisma.articleSample.create({
      data: {
        account_direction: input.accountDirection,
        title: input.title,
        content: input.content,
        source_project_id: input.sourceProjectId,
        source_url: input.sourceUrl,
        tags: input.tags ?? [],
        is_external: input.isExternal ?? false,
        quality_score: input.qualityScore,
        style_insight: this.analyzeStyle(input.title, input.content) as Prisma.InputJsonValue,
      },
    });
  }

  /** Get samples for a direction, ordered by quality. */
  async getSamples(direction: string, limit = 10) {
    return prisma.articleSample.findMany({
      where: { account_direction: direction },
      orderBy: [{ quality_score: "desc" }, { created_at: "desc" }],
      take: limit,
    });
  }

  /** Get a combined style summary across all samples for a direction. */
  async getStyleSummary(direction: string): Promise<StyleInsight | null> {
    const samples = await prisma.articleSample.findMany({
      where: { account_direction: direction },
      select: {
        title: true,
        content: true,
        style_insight: true,
      },
    });

    if (samples.length === 0) return null;

    const wordCounts: number[] = [];
    const paragraphCounts: number[] = [];
    const openings: string[] = [];
    const titles: string[] = [];

    for (const sample of samples) {
      const words = this.countWords(sample.content);
      const paragraphs = sample.content.split(/\n\s*\n/).filter(Boolean).length;
      wordCounts.push(words);
      paragraphCounts.push(paragraphs);

      // Extract first sentence as opening pattern
      const firstSentence = sample.content.split(/[。！？]/)[0]?.trim();
      if (firstSentence && firstSentence.length < 80) {
        openings.push(firstSentence);
      }

      titles.push(sample.title);
    }

    return {
      avgWordCount: Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length),
      avgParagraphCount: Math.round(paragraphCounts.reduce((a, b) => a + b, 0) / paragraphCounts.length),
      commonOpeningPatterns: openings.slice(0, 5),
      titlePatterns: titles.slice(0, 5),
      toneKeywords: this.extractToneKeywords(samples.map((s) => s.content).join("\n")),
      sampleCount: samples.length,
    };
  }

  /** Delete a sample. */
  async removeSample(id: string) {
    return prisma.articleSample.delete({ where: { id } });
  }

  /** Get a single sample by ID. */
  async getSample(id: string) {
    return prisma.articleSample.findUnique({ where: { id } });
  }

  /** Build a prompt-injectable style reference from the sample library. */
  async buildStyleReference(direction: string): Promise<string | null> {
    const summary = await this.getStyleSummary(direction);
    if (!summary || summary.sampleCount < 2) return null;

    const topSamples = await this.getSamples(direction, 3);
    const excerpts = topSamples
      .map((s) => {
        const excerpt = s.content.substring(0, 300).trim();
        return `【${s.title}】\n${excerpt}…`;
      })
      .join("\n\n");

    return [
      `## 写作风格参考（基于 ${summary.sampleCount} 篇优质样本）`,
      "",
      `- 平均字数：${summary.avgWordCount} 字`,
      `- 平均段落数：${summary.avgParagraphCount} 段`,
      `- 常见标题模式：${summary.titlePatterns.join("；")}`,
      `- 语气关键词：${summary.toneKeywords.join("、")}`,
      "",
      "### 优秀样本摘录",
      "",
      excerpts,
    ].join("\n");
  }

  // ── Private helpers ──

  private analyzeStyle(title: string, content: string): Record<string, unknown> {
    return {
      wordCount: this.countWords(content),
      paragraphCount: content.split(/\n\s*\n/).filter(Boolean).length,
      titleLength: title.length,
      hasNumbers: /\d/.test(title),
      hasColon: /[：:]/.test(title),
      firstSentence: content.split(/[。！？]/)[0]?.trim().substring(0, 60),
    };
  }

  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }

  private extractToneKeywords(text: string): string[] {
    // Simple heuristic: find frequently-used adjectives and adverbs
    const patterns = [
      "快速", "清楚", "冷静", "直接", "克制", "严密", "深度",
      "简洁", "高效", "精准", "犀利", "温和", "优雅", "审美",
    ];
    return patterns.filter((p) => {
      const count = text.split(p).length - 1;
      return count >= 2;
    });
  }
}
