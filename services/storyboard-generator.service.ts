import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { resolveProjectIntentFromMetadata } from "@/lib/project-intent";
import { buildMarsCitizenStoryboardSeedPrompt, buildMarketingStoryboardSeedPrompt } from "@/lib/storyboard-seed-prompt";
import { buildOutputSpecificVisualInstruction, buildVisualModelGuidance } from "@/lib/visual-generation-prompt";
import { AppSettingsService } from "@/services/app-settings.service";
import { AssetDependencyAnalyzerService } from "@/services/asset-dependency-analyzer.service";
import { MarketingContextService } from "@/services/marketing-context.service";
import { SceneClassificationService } from "@/services/scene-classification.service";
import { SceneSplitService } from "@/services/scene-split.service";
import { ScriptRewriterService } from "@/services/script-rewriter.service";
import { scriptRewriteOutputSchema, type ScriptRewriteOutput } from "@/schemas/script-production";
import { scriptRewriteJsonSchema } from "@/services/script-rewriter/json-schema";
import { storyboardGenerateJsonSchema } from "@/services/storyboard-generator/json-schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const storyboardFrameOutputSchema = z.object({
  frame_order: z.number().int().min(1),
  frame_title: z.string().min(2).max(160),
  visual_prompt: z.string().min(10).max(6000),
  negative_prompt: z.string().max(3000).optional(),
  narration_text: z.string().max(2000).optional(),
  on_screen_text: z.string().max(1000).optional(),
  composition_notes: z.string().max(2000).optional(),
  camera_plan: z.string().max(500).optional(),
  motion_plan: z.string().max(500).optional(),
  continuity_group: z.string().max(120).optional(),
  duration_sec: z.number().int().min(1).max(120),
  production_class: z.enum(["A", "B", "C", "D", "E", "F", "G", "T"]).optional(),
});

const storyboardGenerateOutputSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  goal_summary: z.string().max(2000).optional(),
  style_direction: z.string().max(1000).optional(),
  frames: z.array(storyboardFrameOutputSchema).min(1).max(120),
});

type StoryboardGenerateOutput = z.infer<typeof storyboardGenerateOutputSchema>;

interface SceneInput {
  id: string;
  scene_order: number;
  original_text: string;
  rewritten_for_ai: string;
  shot_goal: string;
  duration_sec: number;
  continuity_group: string;
  visual_priority: unknown;
  avoid: unknown;
}

type StoryboardProject = {
  id: string;
  title: string;
  topic_query: string;
  raw_script_text: string | null;
  metadata: Prisma.JsonValue | null;
};

type ScenePreparationSummary = {
  classifiedCount: number;
  assetAnalyzedCount: number;
  skippedClassificationCount: number;
  skippedAssetAnalysisCount: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function buildMockFrames(scenes: SceneInput[]): StoryboardGenerateOutput {
  return {
    title: "自动生成分镜",
    goal_summary: "基于脚本场景自动生成的分镜板",
    style_direction: "现代风格、简洁画面、高对比色彩",
    frames: scenes.map((scene) => ({
      frame_order: scene.scene_order,
      frame_title: `帧 ${scene.scene_order}: ${scene.shot_goal}`,
      visual_prompt: `${scene.rewritten_for_ai}。画面风格：现代、简洁、高品质。主题：${scene.shot_goal}。`,
      negative_prompt: "模糊, 低画质, 水印, 文字过多, 杂乱背景",
      narration_text: scene.original_text,
      composition_notes: `此帧对应脚本场景 ${scene.scene_order}，目标：${scene.shot_goal}`,
      camera_plan: scene.scene_order === 1 ? "中近景推入" : "平稳中景",
      motion_plan: "缓慢推拉",
      continuity_group: scene.continuity_group,
      duration_sec: scene.duration_sec,
      production_class: "C" as const,
    })),
  };
}

function buildMockSeedScenes(project: StoryboardProject): ScriptRewriteOutput {
  const intent = resolveProjectIntentFromMetadata(
    (project.metadata as Record<string, unknown> | null) ?? undefined,
  );

  if (intent.contentLine === "MARKETING") {
    return {
      scenes: [
        {
          scene_order: 1,
          original_text: `先用一个强对比问题切入：为什么${project.topic_query}总让用户停下来？`,
          rewritten_for_ai: `快节奏商业短视频开场，主体在高对比场景里直面镜头提问，字幕突出${project.topic_query}的核心痛点与结果反差。`,
          shot_goal: "建立高注意力广告 Hook",
          duration_sec: 6,
          continuity_group: "hook_arc",
          visual_priority: ["human_face", "headline_text", "problem_scene"],
          avoid: ["tiny_text", "visual_noise"],
        },
        {
          scene_order: 2,
          original_text: "把目标用户最常见的困扰具体化，说明他们为什么会犹豫。",
          rewritten_for_ai: `切到真实使用场景，展示目标用户在${project.topic_query}相关任务里遇到阻碍、效率低或结果不稳定的时刻。`,
          shot_goal: "呈现用户痛点与需求场景",
          duration_sec: 7,
          continuity_group: "pain_arc",
          visual_priority: ["user_context", "product_ui", "emotion_cue"],
          avoid: ["empty_background", "generic_stock"],
        },
        {
          scene_order: 3,
          original_text: "引出方案，告诉用户这次的产品或服务怎么解决问题。",
          rewritten_for_ai: `产品或服务作为主角进入画面，通过操作演示、前后对比或流程拆解展示核心解决方案。`,
          shot_goal: "解释解决方案与产品机制",
          duration_sec: 8,
          continuity_group: "solution_arc",
          visual_priority: ["product_ui", "demo_action", "result_frame"],
          avoid: ["feature_dump", "weak_focus"],
        },
        {
          scene_order: 4,
          original_text: "补一个证明镜头，用结果、数据或案例增强可信度。",
          rewritten_for_ai: `画面切到结果证明，包含数据卡、案例反馈、评论摘录或成果前后对照，强调可信背书。`,
          shot_goal: "提供转化所需的信任证明",
          duration_sec: 7,
          continuity_group: "proof_arc",
          visual_priority: ["proof_overlay", "data_card", "social_proof"],
          avoid: ["hard_to_read_ui", "crowded_layout"],
        },
        {
          scene_order: 5,
          original_text: "最后明确告诉用户下一步该做什么。",
          rewritten_for_ai: `收束镜头，主体或品牌画面稳定出镜，字幕和旁白同时给出明确 CTA，引导进一步咨询、点击或下单。`,
          shot_goal: "完成广告收束与 CTA",
          duration_sec: 6,
          continuity_group: "cta_arc",
          visual_priority: ["cta_text", "brand_lockup", "result_frame"],
          avoid: ["weak_cta", "extra_props"],
        },
      ],
    };
  }

  return {
    scenes: [
      {
        scene_order: 1,
        original_text: `先抛出一个和${project.topic_query}有关的反直觉问题，把观众拉进来。`,
        rewritten_for_ai: `科技感强的短视频开场，先给出关于${project.topic_query}的高冲击画面或反差问题，字幕和镜头一起建立前 3 秒 Hook。`,
        shot_goal: "建立科技快讯 Hook",
        duration_sec: 6,
        continuity_group: "intro_arc",
        visual_priority: ["headline_text", "future_visual", "result_frame"],
        avoid: ["tiny_text", "visual_noise"],
      },
      {
        scene_order: 2,
        original_text: "快速说明这次技术突破或新闻事件到底发生了什么。",
        rewritten_for_ai: `切入技术主体，展示设备、实验、产品或核心事件本身，用高信息密度画面解释这次突破的关键变化。`,
        shot_goal: "交代关键事实与技术突破",
        duration_sec: 8,
        continuity_group: "breakthrough_arc",
        visual_priority: ["tech_object", "diagram_overlay", "close_detail"],
        avoid: ["generic_stock", "empty_background"],
      },
      {
        scene_order: 3,
        original_text: "补一个证据或对比镜头，让观众理解为什么这件事值得关注。",
        rewritten_for_ai: `用数据可视化、参数对比、实验结果或行业案例强化解释，让观众直观看到${project.topic_query}的实际意义。`,
        shot_goal: "提供证据与对比支撑",
        duration_sec: 8,
        continuity_group: "proof_arc",
        visual_priority: ["data_card", "comparison_view", "info_overlay"],
        avoid: ["hard_to_read_ui", "crowded_layout"],
      },
      {
        scene_order: 4,
        original_text: "延展到这项技术可能带来的现实影响或未来应用。",
        rewritten_for_ai: `把镜头从当前事件拉到未来场景，展示这项技术对机器人、太空探索、产业应用或社会生活的潜在影响。`,
        shot_goal: "延展技术影响与未来想象",
        duration_sec: 8,
        continuity_group: "future_arc",
        visual_priority: ["future_scene", "human_scale", "concept_visual"],
        avoid: ["overcrowded_scene", "weak_subject"],
      },
      {
        scene_order: 5,
        original_text: "最后收束观点，留下一个值得继续关注的问题。",
        rewritten_for_ai: `结尾镜头回到主持视角或核心概念画面，用一句判断或问题收尾，让观众愿意继续关注后续发展。`,
        shot_goal: "完成收束并留下讨论点",
        duration_sec: 6,
        continuity_group: "cta_arc",
        visual_priority: ["human_face", "closing_text", "future_visual"],
        avoid: ["weak_ending", "tiny_text"],
      },
    ],
  };
}

function formatScenesForPrompt(scenes: SceneInput[]): string {
  return scenes
    .map((scene) => {
      const priority = Array.isArray(scene.visual_priority)
        ? (scene.visual_priority as string[]).join(", ")
        : String(scene.visual_priority ?? "");
      const avoid = Array.isArray(scene.avoid)
        ? (scene.avoid as string[]).join(", ")
        : String(scene.avoid ?? "");

      return [
        `--- Scene ${scene.scene_order} ---`,
        `Original: ${scene.original_text}`,
        `Rewritten: ${scene.rewritten_for_ai}`,
        `Goal: ${scene.shot_goal}`,
        `Duration: ${scene.duration_sec}s`,
        `Continuity Group: ${scene.continuity_group}`,
        `Visual Priority: ${priority}`,
        `Avoid: ${avoid}`,
      ].join("\n");
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class StoryboardGeneratorService {
  private readonly appSettingsService = new AppSettingsService();
  private readonly assetDependencyAnalyzerService = new AssetDependencyAnalyzerService();
  private readonly marketingContextService = new MarketingContextService();
  private readonly sceneClassificationService = new SceneClassificationService();
  private readonly sceneSplitService = new SceneSplitService();
  private readonly scriptRewriterService = new ScriptRewriterService();

  /**
   * Generate a storyboard from the latest AI-rewritten script of a project.
   * If `scriptId` is provided, use that specific script; otherwise pick the latest.
   */
  async generate(params: { projectId: string; scriptId?: string }) {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: {
        id: true,
        title: true,
        topic_query: true,
        raw_script_text: true,
        metadata: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    const script = await this.resolveStoryboardScript(project, params.scriptId);
    const scenePreparation = await this.ensureScenePreparation(script.id, project.id);
    const intent = resolveProjectIntentFromMetadata(
      (project.metadata as Record<string, unknown> | null) ?? undefined,
    );

    if (script.script_scenes.length === 0) {
      throw new Error("Script has no scenes. Cannot generate storyboard.");
    }

    const scenes: SceneInput[] = script.script_scenes.map((scene) => ({
      id: scene.id,
      scene_order: scene.scene_order,
      original_text: scene.original_text,
      rewritten_for_ai: scene.rewritten_for_ai,
      shot_goal: scene.shot_goal,
      duration_sec: scene.duration_sec,
      continuity_group: scene.continuity_group,
      visual_priority: scene.visual_priority,
      avoid: scene.avoid,
    }));

    // Determine LLM availability
    const settings = await this.appSettingsService.getEffectiveSettings();
    const llmEnabled = canUseModelRoute("SCRIPT_REWRITE", settings);

    let output: StoryboardGenerateOutput;

    if (!llmEnabled) {
      console.warn("[storyboard-generator] LLM unavailable, using mock fallback");
      output = buildMockFrames(scenes);
    } else {
      output = await generateStructuredJson<StoryboardGenerateOutput>({
        routeKey: "SCRIPT_REWRITE",
        schemaName: "storyboard_generate_output",
        schema: storyboardGenerateJsonSchema,
        zodSchema: storyboardGenerateOutputSchema,
        preprocess: (raw: unknown) => {
          // LLMs sometimes return a bare array instead of { frames: [...] }
          if (Array.isArray(raw)) {
            return { frames: raw };
          }
          // Or wrap in { storyboard_frames: [...] } or similar
          if (raw && typeof raw === "object" && !("frames" in raw)) {
            const obj = raw as Record<string, unknown>;
            const arrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
            if (arrayKey) {
              return { ...obj, frames: obj[arrayKey] };
            }
          }
          return raw;
        },
        systemPrompt: [
          "You are a professional short-video storyboard designer.",
          "You convert script scenes into detailed storyboard frames for AI image/video generation.",
          "Each frame must have a rich, specific visual_prompt that describes the exact composition,",
          "subject, lighting, color palette, and mood — ready for text-to-image or text-to-video models.",
          "The prompts will be used with Nano Banana 2 / Nano Banana Pro, Seedance 2.0, and Veo 3.1, so every frame must be visually concrete and production-ready.",
          "Keep narration_text as concise voiceover text aligned with the scene.",
          "Use production_class to indicate complexity: A (simple text), C (stock-level), E (custom shoot), T (VFX).",
          "Output valid JSON only. The output MUST be an object with a 'frames' array, not a bare array.",
        ].join(" "),
        userPrompt: [
          `Project: ${project.title}`,
          `Content line: ${intent.contentLine}`,
          `Target output: ${intent.outputType}`,
          `Total scenes: ${scenes.length}`,
          "",
          "Convert each script scene below into exactly ONE storyboard frame.",
          "Maintain the same frame_order as scene_order.",
          "Preserve continuity_group for visual consistency across frames.",
          "Every visual_prompt must clearly specify: hero subject, action, setting, framing, lens or camera feel, lighting, mood, and one information focus.",
          "Write prompts so they can serve both as strong image keyframes and as 4-8 second video shot prompts.",
          "Avoid vague montage wording, contradictory actions, and unreadable on-screen text.",
          buildOutputSpecificVisualInstruction(intent.outputType, intent.contentLine),
          "",
          buildVisualModelGuidance("en"),
          "",
          formatScenesForPrompt(scenes),
        ].join("\n"),
      });
    }

    const validated = storyboardGenerateOutputSchema.parse(output);

    // Determine next version number
    const existingCount = await prisma.storyboard.count({
      where: { project_id: params.projectId },
    });

    // Create storyboard + frames via Prisma
    const storyboard = await prisma.storyboard.create({
      data: {
        project_id: params.projectId,
        script_id: script.id,
        storyboard_status: existingCount === 0 ? "ACTIVE" : "DRAFT",
        version_number: existingCount + 1,
        title: validated.title ?? `${project.title} — 分镜 v${existingCount + 1}`,
        goal_summary: validated.goal_summary,
        style_direction: validated.style_direction,
        aspect_ratio: "9:16",
        frame_count: validated.frames.length,
        structured_output: toJson(validated),
        raw_payload: toJson({
          llm_enabled: llmEnabled,
          scene_count: scenes.length,
          scene_preparation: scenePreparation,
          visual_target_models: ["nano-banana-2", "nano-banana-pro", "seedance-2.0", "veo-3.1"],
        }),
        frames: {
          create: validated.frames.map((frame) => {
            // Match to the corresponding ScriptScene by frame_order == scene_order
            const matchedScene = scenes.find((s) => s.scene_order === frame.frame_order);
            return {
              project_id: params.projectId,
              script_scene_id: matchedScene?.id ?? null,
              frame_order: frame.frame_order,
              frame_status: "DRAFT",
              continuity_group: frame.continuity_group,
              frame_title: frame.frame_title,
              composition_notes: frame.composition_notes,
              camera_plan: frame.camera_plan,
              motion_plan: frame.motion_plan,
              narration_text: frame.narration_text,
              on_screen_text: frame.on_screen_text,
              visual_prompt: frame.visual_prompt,
              negative_prompt: frame.negative_prompt,
              duration_sec: frame.duration_sec,
              production_class: frame.production_class,
            };
          }),
        },
      },
      include: {
        frames: {
          include: { references: true },
          orderBy: { frame_order: "asc" },
        },
      },
    });

    return storyboard;
  }

  private async ensureScenePreparation(scriptId: string, projectId: string): Promise<ScenePreparationSummary> {
    const sceneStates = await prisma.scriptScene.findMany({
      where: { script_id: scriptId, project_id: projectId },
      orderBy: { scene_order: "asc" },
      select: {
        id: true,
        scene_classifications: {
          select: { id: true },
          orderBy: { created_at: "desc" },
          take: 1,
        },
        required_assets: {
          select: { id: true },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    const summary: ScenePreparationSummary = {
      classifiedCount: 0,
      assetAnalyzedCount: 0,
      skippedClassificationCount: 0,
      skippedAssetAnalysisCount: 0,
    };

    for (const scene of sceneStates) {
      let hasClassification = scene.scene_classifications.length > 0;

      if (!hasClassification) {
        await this.sceneClassificationService.classifyAndSave({
          projectId,
          sceneId: scene.id,
        });
        hasClassification = true;
        summary.classifiedCount += 1;
      } else {
        summary.skippedClassificationCount += 1;
      }

      if (!hasClassification) {
        continue;
      }

      if (scene.required_assets.length === 0) {
        await this.assetDependencyAnalyzerService.analyzeAndSave({
          projectId,
          sceneId: scene.id,
        });
        summary.assetAnalyzedCount += 1;
      } else {
        summary.skippedAssetAnalysisCount += 1;
      }
    }

    return summary;
  }

  private async resolveStoryboardScript(project: StoryboardProject, requestedScriptId?: string) {
    if (requestedScriptId) {
      const requestedScript = await prisma.script.findFirst({
        where: {
          id: requestedScriptId,
          project_id: project.id,
        },
        include: { script_scenes: { orderBy: { scene_order: "asc" } } },
      });

      if (!requestedScript) {
        throw new Error("Requested script not found for this project.");
      }

      if (requestedScript.script_scenes.length > 0) {
        return requestedScript;
      }

      if (requestedScript.original_text.trim()) {
        await this.sceneSplitService.splitAndSave({ scriptId: requestedScript.id });
        return prisma.script.findUniqueOrThrow({
          where: { id: requestedScript.id },
          include: { script_scenes: { orderBy: { scene_order: "asc" } } },
        });
      }
    }

    const rewrittenScript = await prisma.script.findFirst({
      where: { project_id: project.id, source_type: "AI_REWRITE" },
      orderBy: { created_at: "desc" },
      include: { script_scenes: { orderBy: { scene_order: "asc" } } },
    });

    if (rewrittenScript?.script_scenes.length) {
      return rewrittenScript;
    }

    const latestScenefulScript = await prisma.script.findFirst({
      where: {
        project_id: project.id,
        script_scenes: {
          some: {},
        },
      },
      orderBy: { created_at: "desc" },
      include: { script_scenes: { orderBy: { scene_order: "asc" } } },
    });

    if (latestScenefulScript) {
      return latestScenefulScript;
    }

    if (project.raw_script_text?.trim()) {
      return this.scriptRewriterService.rewriteAndSave({
        projectId: project.id,
        title: project.title,
        scriptText: project.raw_script_text,
      });
    }

    return this.createSeedScriptFromIntent(project);
  }

  private async createSeedScriptFromIntent(project: StoryboardProject) {
    const intent = resolveProjectIntentFromMetadata(
      (project.metadata as Record<string, unknown> | null) ?? undefined,
    );
    const settings = await this.appSettingsService.getEffectiveSettings();
    const llmEnabled = canUseModelRoute("SCRIPT_REWRITE", settings);

    let output: ScriptRewriteOutput;
    let modelName = "mock-storyboard-seed";

    if (!llmEnabled) {
      output = buildMockSeedScenes(project);
    } else {
      const prompt =
        intent.contentLine === "MARKETING"
          ? buildMarketingStoryboardSeedPrompt({
              title: project.title,
              topicQuery: project.topic_query,
              contextPrompt: this.marketingContextService.formatPromptContext(
                await this.marketingContextService.getProjectContext(project.id),
              ),
            })
          : buildMarsCitizenStoryboardSeedPrompt({
              title: project.title,
              topicQuery: project.topic_query,
              projectIntroduction:
                (((project.metadata as Record<string, unknown> | null)?.project_introduction as string | undefined) ?? "").trim() || null,
              coreIdea:
                (((project.metadata as Record<string, unknown> | null)?.core_idea as string | undefined) ?? "").trim() || null,
            });

      try {
        output = await generateStructuredJson<ScriptRewriteOutput>({
          routeKey: "SCRIPT_REWRITE",
          schemaName: "storyboard_seed_scene_output",
          schema: scriptRewriteJsonSchema,
          zodSchema: scriptRewriteOutputSchema,
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          preprocess: (raw: unknown) => {
            if (Array.isArray(raw)) {
              return { scenes: raw };
            }
            return raw;
          },
        });
        modelName = settings.llmRouting.SCRIPT_REWRITE.model;
      } catch (error) {
        console.warn("[storyboard-generator] Topic seed generation failed, using mock fallback:", error);
        output = buildMockSeedScenes(project);
      }
    }

    const validated = scriptRewriteOutputSchema.parse(output);
    const versionNumber = (await prisma.script.count({ where: { project_id: project.id } })) + 1;

    return prisma.script.create({
      data: {
        project_id: project.id,
        source_type: "AI_REWRITE",
        script_status: "ACTIVE",
        version_number: versionNumber,
        title: `${project.title} — 分镜种子稿`,
        original_text: validated.scenes.map((scene) => scene.original_text).join("\n\n"),
        rewritten_text: validated.scenes.map((scene) => scene.rewritten_for_ai).join("\n"),
        model_name: modelName,
        structured_output: toJson({
          content_line: intent.contentLine,
          output_type: intent.outputType,
          scene_split_status: "done",
          scene_count: validated.scenes.length,
          origin: "storyboard_topic_seed",
          scenes: validated.scenes,
        }),
        raw_payload: toJson({
          origin: "storyboard_topic_seed",
          topic_query: project.topic_query,
          content_line: intent.contentLine,
          output_type: intent.outputType,
          llm_enabled: llmEnabled,
        }),
        script_scenes: {
          create: validated.scenes.map((scene) => ({
            project_id: project.id,
            scene_order: scene.scene_order,
            original_text: scene.original_text,
            rewritten_for_ai: scene.rewritten_for_ai,
            shot_goal: scene.shot_goal,
            duration_sec: scene.duration_sec,
            continuity_group: scene.continuity_group,
            visual_priority: toJson(scene.visual_priority),
            avoid: toJson(scene.avoid),
          })),
        },
      },
      include: {
        script_scenes: {
          orderBy: { scene_order: "asc" },
        },
      },
    });
  }
}
