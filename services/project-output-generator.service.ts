import { Prisma, type StrategyTaskStatus, type StrategyTaskType } from "@prisma/client";
import { z } from "zod";
import { getOutputKnowledgePack, reviewOutputArtifact } from "@/lib/output-artifact-guidance";
import { prisma } from "@/lib/db";
import { getContentLineMeta, isOutputType } from "@/lib/content-line";
import { buildAdCreativePrompt, buildPublishCopyPrompt, buildVideoTitlePrompt } from "@/lib/output-artifact-prompt";
import { resolveProjectIntentFromMetadata } from "@/lib/project-intent";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { AppSettingsService } from "@/services/app-settings.service";
import { MarketingContextService } from "@/services/marketing-context.service";
import { PromotionalCopyService } from "@/services/promotional-copy.service";
import {
  assertSupportedProjectOutputType,
  type ProjectOutputGenerationResult,
  type SupportedProjectOutputType,
} from "@/services/project-output-generator-registry";
import { StoryboardGeneratorService } from "@/services/storyboard-generator.service";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const videoTitlePackSchema = z.object({
  title_options: z.array(z.string().min(6).max(120)).min(3).max(6),
  recommended_title: z.string().min(6).max(120),
  angle_summary: z.string().min(6).max(300),
});

const publishCopySchema = z.object({
  primary_title: z.string().min(6).max(120),
  video_description: z.string().min(10).max(1200),
  highlights: z.array(z.string().min(4).max(200)).min(3).max(5),
  lead_in: z.string().min(6).max(280),
  publish_cta: z.string().min(4).max(160),
});

const adCreativeSchema = z.object({
  target_audience: z.string().min(4).max(240),
  lead_angle: z.string().min(6).max(240),
  core_hook: z.string().min(6).max(240),
  selling_points: z.array(z.string().min(4).max(240)).min(3).max(5),
  visual_direction: z.string().min(6).max(500),
  shot_tone: z.string().min(6).max(300),
  cta_direction: z.string().min(4).max(180),
});

type ProjectWithArtifacts = NonNullable<Awaited<ReturnType<ProjectOutputGeneratorService["loadProjectForGeneration"]>>>;

export class ProjectOutputGeneratorService {
  private readonly appSettingsService = new AppSettingsService();
  private readonly marketingContextService = new MarketingContextService();
  private readonly promotionalCopyService = new PromotionalCopyService();
  private readonly storyboardGeneratorService = new StoryboardGeneratorService();

  async generate(projectId: string, requestedOutputType?: string): Promise<ProjectOutputGenerationResult> {
    const project = await this.loadProjectForGeneration(projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    const intent = resolveProjectIntentFromMetadata(
      (project.metadata as Record<string, unknown> | null) ?? undefined,
    );
    const outputType = assertSupportedProjectOutputType(
      requestedOutputType
        ? (() => {
            if (!isOutputType(requestedOutputType)) {
              throw new Error(`Unsupported output type: ${requestedOutputType}.`);
            }
            return requestedOutputType;
          })()
        : intent.outputType,
    );

    switch (outputType) {
      case "PLATFORM_COPY":
        return this.generatePlatformCopy(projectId);
      case "AD_STORYBOARD":
        return this.generateAdStoryboard(projectId);
      case "VIDEO_TITLE":
        return this.generateVideoTitle(project);
      case "PUBLISH_COPY":
        return this.generatePublishCopy(project);
      case "AD_CREATIVE":
        return this.generateAdCreative(project);
    }
  }

  private async generatePlatformCopy(projectId: string): Promise<ProjectOutputGenerationResult> {
    const result = await this.promotionalCopyService.generateForProject(projectId);
    const title = typeof result.output?.headline_options?.[0] === "string"
      ? result.output.headline_options[0]
      : "平台文案";

    return {
      outputType: "PLATFORM_COPY",
      artifactKind: "strategy_task",
      artifactId: result.strategy_task_id,
      title,
      summary: result.output?.hero_copy ?? null,
    };
  }

  private async generateAdStoryboard(projectId: string): Promise<ProjectOutputGenerationResult> {
    const storyboard = await this.storyboardGeneratorService.generate({ projectId });
    return {
      outputType: "AD_STORYBOARD",
      artifactKind: "storyboard",
      artifactId: storyboard.id,
      title: storyboard.title,
      summary: storyboard.goal_summary ?? null,
    };
  }

  private async generateVideoTitle(project: ProjectWithArtifacts): Promise<ProjectOutputGenerationResult> {
    const intent = resolveProjectIntentFromMetadata((project.metadata as Record<string, unknown> | null) ?? undefined);
    const lineLabel = getContentLineMeta(intent.contentLine, "zh").label;
    const scriptText = this.resolveProjectSourceText(project);
    const settings = await this.appSettingsService.getEffectiveSettings();
    const guidance = getOutputKnowledgePack("VIDEO_TITLE");

    let output = {
      title_options: [
        `${project.topic_query} 最新进展，远比你想的更关键`,
        `为什么 ${project.topic_query} 正在改变下一代技术节奏`,
        `${project.topic_query} 到底意味着什么？3 分钟讲清楚`,
      ],
      recommended_title: `${project.topic_query} 到底意味着什么？3 分钟讲清楚`,
      angle_summary: "优先突出反差、意义和技术冲击感。",
    };

    if (canUseModelRoute("SCRIPT_REWRITE", settings)) {
      const prompt = buildVideoTitlePrompt({
        title: project.title,
        topicQuery: project.topic_query,
        contentLineLabel: lineLabel,
        scriptText,
        knowledgeNotes: guidance.knowledgeNotes,
        reviewChecklist: guidance.reviewChecklist,
      });

      output = await generateStructuredJson({
        routeKey: "SCRIPT_REWRITE",
        schemaName: "video_title_pack",
        schema: {
          type: "object",
          required: ["title_options", "recommended_title", "angle_summary"],
          properties: {
            title_options: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
            recommended_title: { type: "string" },
            angle_summary: { type: "string" },
          },
        } as const,
        zodSchema: videoTitlePackSchema,
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
      });
    }

    const review = reviewOutputArtifact("VIDEO_TITLE", output as Record<string, unknown>);

    const task = await prisma.strategyTask.create({
      data: {
        project_id: project.id,
        brand_profile_id: project.brand_profile_id,
        task_type: "SCRIPT" as StrategyTaskType,
        task_status: "DONE" as StrategyTaskStatus,
        task_title: `视频标题包 · ${output.recommended_title}`,
        task_summary: output.recommended_title,
        priority_score: 84,
        task_json: toJson({
          kind: "VIDEO_TITLE_PACK",
          output_type: "VIDEO_TITLE",
          generation_harness: "artifact_guidance_v1",
          generated_at: new Date().toISOString(),
          knowledge_notes: guidance.knowledgeNotes,
          review_checklist: guidance.reviewChecklist,
          artifact_review: review,
          ...output,
        }),
      },
    });

    return {
      outputType: "VIDEO_TITLE",
      artifactKind: "strategy_task",
      artifactId: task.id,
      title: output.recommended_title,
      summary: output.angle_summary,
    };
  }

  private async generatePublishCopy(project: ProjectWithArtifacts): Promise<ProjectOutputGenerationResult> {
    const scriptText = this.resolveProjectSourceText(project);
    const settings = await this.appSettingsService.getEffectiveSettings();
    const guidance = getOutputKnowledgePack("PUBLISH_COPY");
    const existingVideoTitles = project.strategy_tasks
      .filter((task) => ((task.task_json as Record<string, unknown> | null)?.output_type as string | undefined) === "VIDEO_TITLE")
      .flatMap((task) => {
        const json = (task.task_json as Record<string, unknown> | null) ?? {};
        const options = json.title_options;
        return Array.isArray(options) ? options.filter((item): item is string => typeof item === "string") : [];
      })
      .slice(0, 5);

    let output = {
      primary_title: existingVideoTitles[0] ?? `${project.topic_query}：这次最值得关注的 3 个点`,
      video_description: `${project.topic_query} 这次真正值得看的，不只是表面新闻，而是背后的技术意义与后续影响。`,
      highlights: [
        "先看最关键的技术变化",
        "再看它为什么值得继续关注",
        "最后给出发布时可直接使用的表达重点",
      ],
      lead_in: `如果你只想快速看懂 ${project.topic_query}，先看这一条。`,
      publish_cta: "收藏这条，后续更新来了第一时间回来看。",
    };

    if (canUseModelRoute("SCRIPT_REWRITE", settings)) {
      const prompt = buildPublishCopyPrompt({
        title: project.title,
        topicQuery: project.topic_query,
        scriptText,
        videoTitles: existingVideoTitles,
        knowledgeNotes: guidance.knowledgeNotes,
        reviewChecklist: guidance.reviewChecklist,
      });

      output = await generateStructuredJson({
        routeKey: "SCRIPT_REWRITE",
        schemaName: "publish_copy_output",
        schema: {
          type: "object",
          required: ["primary_title", "video_description", "highlights", "lead_in", "publish_cta"],
          properties: {
            primary_title: { type: "string" },
            video_description: { type: "string" },
            highlights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
            lead_in: { type: "string" },
            publish_cta: { type: "string" },
          },
        } as const,
        zodSchema: publishCopySchema,
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
      });
    }

    const review = reviewOutputArtifact("PUBLISH_COPY", output as Record<string, unknown>);

    const task = await prisma.strategyTask.create({
      data: {
        project_id: project.id,
        brand_profile_id: project.brand_profile_id,
        task_type: "SCRIPT" as StrategyTaskType,
        task_status: "DONE" as StrategyTaskStatus,
        task_title: `发布文案 · ${output.primary_title}`,
        task_summary: output.lead_in,
        priority_score: 82,
        task_json: toJson({
          kind: "PUBLISH_COPY",
          output_type: "PUBLISH_COPY",
          generation_harness: "artifact_guidance_v1",
          generated_at: new Date().toISOString(),
          knowledge_notes: guidance.knowledgeNotes,
          review_checklist: guidance.reviewChecklist,
          artifact_review: review,
          ...output,
        }),
      },
    });

    return {
      outputType: "PUBLISH_COPY",
      artifactKind: "strategy_task",
      artifactId: task.id,
      title: output.primary_title,
      summary: output.lead_in,
    };
  }

  private async generateAdCreative(project: ProjectWithArtifacts): Promise<ProjectOutputGenerationResult> {
    const settings = await this.appSettingsService.getEffectiveSettings();
    const context = await this.marketingContextService.getProjectContext(project.id);
    const contextPrompt = this.marketingContextService.formatPromptContext(context);
    const guidance = getOutputKnowledgePack("AD_CREATIVE");

    let output = {
      target_audience: "对当前议题有明确兴趣、但还缺乏行动理由的核心受众",
      lead_angle: `把 ${project.topic_query} 讲成“为什么现在就值得行动”的传播角度`,
      core_hook: `如果用户还没意识到 ${project.topic_query} 的价值，就先用结果反差抓住他。`,
      selling_points: [
        "先讲用户当前问题",
        "再讲方案为什么更值得选",
        "最后给出明确转化动作",
      ],
      visual_direction: "高对比、强主体、可直接拆成关键帧与动态广告镜头。",
      shot_tone: "节奏快，镜头聚焦人物、产品动作和结果反差。",
      cta_direction: "让用户知道下一步该点击、咨询或下单什么。",
    };

    if (canUseModelRoute("PROMOTIONAL_COPY", settings)) {
      const prompt = buildAdCreativePrompt({
        title: project.title,
        topicQuery: project.topic_query,
        contextPrompt,
        knowledgeNotes: guidance.knowledgeNotes,
        reviewChecklist: guidance.reviewChecklist,
      });

      output = await generateStructuredJson({
        routeKey: "PROMOTIONAL_COPY",
        schemaName: "ad_creative_output",
        schema: {
          type: "object",
          required: ["target_audience", "lead_angle", "core_hook", "selling_points", "visual_direction", "shot_tone", "cta_direction"],
          properties: {
            target_audience: { type: "string" },
            lead_angle: { type: "string" },
            core_hook: { type: "string" },
            selling_points: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
            visual_direction: { type: "string" },
            shot_tone: { type: "string" },
            cta_direction: { type: "string" },
          },
        } as const,
        zodSchema: adCreativeSchema,
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
      });
    }

    const review = reviewOutputArtifact("AD_CREATIVE", output as Record<string, unknown>);

    const task = await prisma.strategyTask.create({
      data: {
        project_id: project.id,
        brand_profile_id: project.brand_profile_id,
        task_type: "TOPIC_PLAN" as StrategyTaskType,
        task_status: "DONE" as StrategyTaskStatus,
        task_title: `广告创意 · ${project.title}`,
        task_summary: output.core_hook,
        priority_score: 86,
        task_json: toJson({
          kind: "AD_CREATIVE",
          output_type: "AD_CREATIVE",
          generation_harness: "artifact_guidance_v1",
          generated_at: new Date().toISOString(),
          knowledge_notes: guidance.knowledgeNotes,
          review_checklist: guidance.reviewChecklist,
          artifact_review: review,
          ...output,
        }),
      },
    });

    return {
      outputType: "AD_CREATIVE",
      artifactKind: "strategy_task",
      artifactId: task.id,
      title: task.task_title,
      summary: output.core_hook,
    };
  }

  private async loadProjectForGeneration(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scripts: {
          orderBy: { created_at: "desc" },
          take: 3,
        },
        strategy_tasks: {
          orderBy: { created_at: "desc" },
          take: 12,
        },
        storyboards: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });
  }

  private resolveProjectSourceText(project: ProjectWithArtifacts) {
    const latestScript = project.scripts[0];
    if (latestScript?.rewritten_text?.trim()) {
      return latestScript.rewritten_text;
    }

    if (latestScript?.original_text?.trim()) {
      return latestScript.original_text;
    }

    if (project.raw_script_text?.trim()) {
      return project.raw_script_text;
    }

    return project.topic_query;
  }
}
