/**
 * Lightweight image brief generator for owned-media articles.
 * Instead of the full storyboard pipeline (scene split → classification → frames),
 * this generates 3-5 image descriptions directly from the article content.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateStructuredJson } from "@/lib/openai-json";
import { z } from "zod";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const imageBriefSchema = z.object({
  briefs: z.array(
    z.object({
      order: z.number().int().min(1),
      placement: z.string().max(200),
      description: z.string().min(10).max(2000),
      style_note: z.string().max(500).optional(),
    }),
  ).min(1).max(8),
});

type ImageBriefOutput = z.infer<typeof imageBriefSchema>;

const IMAGE_BRIEF_JSON_SCHEMA = {
  type: "object",
  properties: {
    briefs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          order: { type: "number" },
          placement: { type: "string" },
          description: { type: "string" },
          style_note: { type: "string" },
        },
        required: ["order", "placement", "description"],
      },
    },
  },
  required: ["briefs"],
};

export class ArticleImageBriefService {
  /**
   * Generate image briefs for an article project.
   * Returns the created storyboard record (for compatibility with existing step tracking).
   */
  async generate(params: { projectId: string; scriptId: string }) {
    const script = await prisma.script.findUnique({
      where: { id: params.scriptId },
      select: {
        id: true,
        title: true,
        original_text: true,
        structured_output: true,
      },
    });

    if (!script) {
      throw new Error("Script not found.");
    }

    const structured = script.structured_output as Record<string, unknown> | null;
    const opening = (structured?.opening as string) ?? "";
    const body = (structured?.body as string) ?? "";
    const closing = (structured?.closing as string) ?? "";
    const articleText = [opening, body, closing].filter(Boolean).join("\n\n") || script.original_text;

    if (!articleText || articleText.length < 50) {
      throw new Error("Article content too short for image brief generation.");
    }

    let output: ImageBriefOutput;

    try {
      output = await generateStructuredJson<ImageBriefOutput>({
        routeKey: "PLATFORM_ADAPTATION",
        schemaName: "article_image_brief",
        schema: IMAGE_BRIEF_JSON_SCHEMA,
        zodSchema: imageBriefSchema,
        systemPrompt: [
          "你是一位资深图文编辑，擅长为自媒体长文配图。",
          "根据文章内容，生成 3-5 张配图的描述说明。",
          "每张配图说明包括：",
          "- placement: 图片建议插入位置（如「开头引题后」「第二个论点之后」「结尾前」）",
          "- description: 详细的图片内容描述，适合交给 AI 绘图工具生成",
          "- style_note: 风格提示（可选，如「信息图表」「场景插画」「数据可视化」）",
          "",
          "配图应服务于文章阅读体验：打断长段文字、可视化关键数据、强化核心观点。",
          "不要生成纯装饰性配图，每张图都应有明确的信息传达目的。",
          "输出 JSON。",
        ].join("\n"),
        userPrompt: [
          `文章标题: ${script.title}`,
          "",
          "文章正文:",
          articleText.slice(0, 4000),
          "",
          "请为这篇文章生成 3-5 张配图说明。",
        ].join("\n"),
        preprocess: (raw: unknown) => {
          if (Array.isArray(raw)) {
            return { briefs: raw };
          }
          return raw;
        },
      });
    } catch (error) {
      console.warn("[article-image-brief] LLM generation failed, using fallback:", error);
      output = buildFallbackBriefs(script.title ?? "文章");
    }

    const validated = imageBriefSchema.parse(output);

    // Save as storyboard for compatibility with existing data model
    const existingCount = await prisma.storyboard.count({
      where: { project_id: params.projectId },
    });

    const storyboard = await prisma.storyboard.create({
      data: {
        project_id: params.projectId,
        script_id: params.scriptId,
        storyboard_status: existingCount === 0 ? "ACTIVE" : "DRAFT",
        version_number: existingCount + 1,
        title: `${script.title ?? "文章"} — 配图说明`,
        goal_summary: `为文章生成 ${validated.briefs.length} 张配图描述`,
        style_direction: "图文自媒体配图",
        aspect_ratio: "16:9",
        frame_count: validated.briefs.length,
        structured_output: toJson(validated),
        raw_payload: toJson({
          origin: "article_image_brief",
          brief_count: validated.briefs.length,
        }),
        frames: {
          create: validated.briefs.map((brief) => ({
            project_id: params.projectId,
            frame_order: brief.order,
            frame_status: "DRAFT",
            frame_title: brief.placement,
            visual_prompt: brief.description,
            composition_notes: brief.style_note ?? null,
            duration_sec: 5,
            production_class: "C",
          })),
        },
      },
      include: {
        frames: {
          orderBy: { frame_order: "asc" },
        },
      },
    });

    return storyboard;
  }
}

function buildFallbackBriefs(title: string): ImageBriefOutput {
  return {
    briefs: [
      {
        order: 1,
        placement: "开头引题后",
        description: `与「${title}」主题相关的场景概览图，展示核心事件或技术主体，风格简洁现代。`,
        style_note: "科技感场景插画",
      },
      {
        order: 2,
        placement: "第一个论点之后",
        description: "信息图表：用数据可视化方式呈现文章中提到的关键对比或趋势数据。",
        style_note: "数据可视化信息图",
      },
      {
        order: 3,
        placement: "结尾前",
        description: "总结性配图：展示文章结论要传达的核心观点，可以是概念图或思维导图风格。",
        style_note: "概念总结图",
      },
    ],
  };
}
