import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { AppSettingsService } from "@/services/app-settings.service";
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

  /**
   * Generate a storyboard from the latest AI-rewritten script of a project.
   * If `scriptId` is provided, use that specific script; otherwise pick the latest.
   */
  async generate(params: { projectId: string; scriptId?: string }) {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { id: true, title: true },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    // Find the script + scenes
    const script = params.scriptId
      ? await prisma.script.findUnique({
          where: { id: params.scriptId },
          include: { script_scenes: { orderBy: { scene_order: "asc" } } },
        })
      : await prisma.script.findFirst({
          where: { project_id: params.projectId, source_type: "AI_REWRITE" },
          orderBy: { created_at: "desc" },
          include: { script_scenes: { orderBy: { scene_order: "asc" } } },
        });

    if (!script) {
      throw new Error("No script found for this project. Run script rewrite first.");
    }

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
      output = buildMockFrames(scenes);
    } else {
      output = await generateStructuredJson<StoryboardGenerateOutput>({
        routeKey: "SCRIPT_REWRITE",
        schemaName: "storyboard_generate_output",
        schema: storyboardGenerateJsonSchema,
        zodSchema: storyboardGenerateOutputSchema,
        systemPrompt: [
          "You are a professional short-video storyboard designer.",
          "You convert script scenes into detailed storyboard frames for AI image/video generation.",
          "Each frame must have a rich, specific visual_prompt that describes the exact composition,",
          "subject, lighting, color palette, and mood — ready for text-to-image or text-to-video models.",
          "Keep narration_text as concise voiceover text aligned with the scene.",
          "Use production_class to indicate complexity: A (simple text), C (stock-level), E (custom shoot), T (VFX).",
          "Output valid JSON only.",
        ].join(" "),
        userPrompt: [
          `Project: ${project.title}`,
          `Total scenes: ${scenes.length}`,
          "",
          "Convert each script scene below into exactly ONE storyboard frame.",
          "Maintain the same frame_order as scene_order.",
          "Preserve continuity_group for visual consistency across frames.",
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
        raw_payload: toJson({ llm_enabled: llmEnabled, scene_count: scenes.length }),
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
}
