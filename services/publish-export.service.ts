/**
 * Publish Export Service — generates export-ready article packages.
 *
 * Produces formatted output for Toutiao and Markdown publishing.
 */

import { prisma } from "@/lib/db";

export type ToutiaoExport = {
  title: string;
  content: string;         // Clean text, formatted for Toutiao
  summary: string;
  imageBriefs: string[];
  tags: string[];
  wordCount: number;
  projectId: string;
};

export type MarkdownExport = {
  markdown: string;
  projectId: string;
  title: string;
};

export class PublishExportService {
  /** Export a project as a Toutiao-ready package. */
  async exportForToutiao(projectId: string): Promise<ToutiaoExport> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        scripts: {
          where: { script_status: "ACTIVE" },
          orderBy: { updated_at: "desc" },
          take: 1,
        },
      },
    });

    const script = project.scripts[0];
    if (!script) {
      throw new Error(`项目 ${projectId} 没有可用的主稿`);
    }

    const structured = script.structured_output as Record<string, unknown> | null;
    const metadata = project.metadata as Record<string, unknown> | null;

    // Extract title — prefer title pack if available
    const titlePack = structured?.titlePack as Record<string, unknown> | undefined;
    const titles = titlePack?.titles as string[] | undefined;
    const bestTitle = titles?.[0] ?? project.title;

    // Extract content
    const content = this.cleanContentForToutiao(
      (structured?.masterDraft as string) ?? script.original_text ?? "",
    );

    // Extract summary from publish copy
    const publishCopy = structured?.publishCopy as Record<string, unknown> | undefined;
    const summary = (publishCopy?.abstract as string) ?? this.generateSummary(content);

    // Extract image briefs
    const imageBrief = structured?.imageBrief as Record<string, unknown> | undefined;
    const imageBriefs = (imageBrief?.scenes as Array<{ description: string }> | undefined)
      ?.map((s) => s.description) ?? [];

    // Extract tags from metadata or topic
    const tags = this.extractTags(metadata, project.topic_query);

    return {
      title: bestTitle,
      content,
      summary,
      imageBriefs,
      tags,
      wordCount: this.countWords(content),
      projectId,
    };
  }

  /** Export a project as Markdown. */
  async exportAsMarkdown(projectId: string): Promise<MarkdownExport> {
    const toutiao = await this.exportForToutiao(projectId);

    const sections: string[] = [
      `# ${toutiao.title}`,
      "",
      `> ${toutiao.summary}`,
      "",
      toutiao.content,
    ];

    if (toutiao.imageBriefs.length > 0) {
      sections.push(
        "",
        "---",
        "",
        "## 配图说明",
        "",
        ...toutiao.imageBriefs.map((b, i) => `${i + 1}. ${b}`),
      );
    }

    if (toutiao.tags.length > 0) {
      sections.push(
        "",
        "---",
        "",
        `**标签**: ${toutiao.tags.map((t) => `#${t}`).join(" ")}`,
      );
    }

    return {
      markdown: sections.join("\n"),
      projectId,
      title: toutiao.title,
    };
  }

  /** Batch export multiple projects. */
  async exportBatch(projectIds: string[], format: "toutiao" | "markdown" = "toutiao") {
    const results = await Promise.allSettled(
      projectIds.map((id) =>
        format === "toutiao" ? this.exportForToutiao(id) : this.exportAsMarkdown(id),
      ),
    );

    return results.map((r, i) => ({
      projectId: projectIds[i],
      status: r.status,
      data: r.status === "fulfilled" ? r.value : undefined,
      error: r.status === "rejected" ? (r.reason as Error).message : undefined,
    }));
  }

  // ── Private helpers ──

  /** Clean content for Toutiao: remove markdown, normalize whitespace. */
  private cleanContentForToutiao(content: string): string {
    return content
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      // Remove markdown links, keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Normalize multiple blank lines to double
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /** Generate a summary from the first 150 chars. */
  private generateSummary(content: string): string {
    const firstParagraph = content.split(/\n\s*\n/)[0] ?? content;
    if (firstParagraph.length <= 150) return firstParagraph;
    return firstParagraph.substring(0, 147) + "…";
  }

  private extractTags(metadata: Record<string, unknown> | null, topic: string): string[] {
    const tags: string[] = [];

    // From metadata
    const metaTags = metadata?.tags as string[] | undefined;
    if (metaTags) tags.push(...metaTags);

    // From direction
    const direction = metadata?.direction as string | undefined;
    if (direction) tags.push(direction);

    // From topic keywords
    const keywords = topic.split(/[,，、\s]+/).filter((k) => k.length >= 2 && k.length <= 8);
    tags.push(...keywords.slice(0, 3));

    // Deduplicate
    return [...new Set(tags)];
  }

  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }
}
