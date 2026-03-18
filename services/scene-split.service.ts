import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { AppSettingsService } from "@/services/app-settings.service";
import { scriptRewriteOutputSchema, type ScriptRewriteOutput } from "@/schemas/script-production";
import { scriptRewriteJsonSchema } from "@/services/script-rewriter/json-schema";
import { buildSceneSplitPrompt } from "@/lib/scene-split-prompt";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function splitByParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function buildMockScenes(fullText: string): ScriptRewriteOutput {
  const paragraphs = splitByParagraphs(fullText);
  if (paragraphs.length === 0) {
    paragraphs.push(fullText.trim() || "（空脚本）");
  }

  return {
    scenes: paragraphs.map((text, i) => ({
      scene_order: i + 1,
      original_text: text,
      rewritten_for_ai: `Scene ${i + 1}: ${text.slice(0, 300)}`,
      shot_goal:
        i === 0
          ? "建立强 Hook"
          : i === paragraphs.length - 1
            ? "完成收束与行动号召"
            : "推进叙事与展示信息",
      duration_sec: Math.min(15, Math.max(4, Math.round(text.length / 12))),
      continuity_group:
        i === 0 ? "intro_arc" : i === paragraphs.length - 1 ? "cta_arc" : `body_arc_${i}`,
      visual_priority:
        i === 0
          ? ["headline_text", "human_face"]
          : ["news_footage", "info_overlay"],
      avoid: ["visual_noise", "tiny_text"],
    })),
  };
}

async function mergeStructuredOutput(
  scriptId: string,
  patch: Record<string, unknown>,
) {
  const script = await prisma.script.findUniqueOrThrow({ where: { id: scriptId } });
  const existing = (script.structured_output as Record<string, unknown>) ?? {};
  await prisma.script.update({
    where: { id: scriptId },
    data: {
      structured_output: toJson({ ...existing, ...patch }),
    },
  });
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SceneSplitService {
  private readonly appSettingsService = new AppSettingsService();

  /**
   * Split a Script's full text into ScriptScene records via LLM.
   * Updates Script.structured_output with scene_split_status.
   */
  async splitAndSave(params: {
    scriptId: string;
    force?: boolean;
  }): Promise<{ sceneCount: number }> {
    const { scriptId, force = false } = params;

    // 1. Load script
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      include: { script_scenes: { select: { id: true } } },
    });

    if (!script) {
      throw new Error("Script not found.");
    }

    const existingCount = script.script_scenes.length;
    const currentStatus = (script.structured_output as Record<string, unknown>)
      ?.scene_split_status;

    // 2. Idempotency checks
    if (currentStatus === "splitting") {
      throw new IdempotencyError("split_in_progress");
    }

    if (existingCount > 0 && !force) {
      throw new IdempotencyError("already_split", existingCount);
    }

    // 3. Mark as splitting
    await mergeStructuredOutput(scriptId, {
      scene_split_status: "splitting",
    });

    try {
      // 4. Force → delete old scenes
      if (force && existingCount > 0) {
        await prisma.scriptScene.deleteMany({ where: { script_id: scriptId } });
      }

      // 5. Build prompt
      const rawPayload = (script.raw_payload as Record<string, unknown>) ?? {};
      const newsItems = (rawPayload.news_items as unknown[]) ?? [];
      const { systemPrompt, userPrompt } = buildSceneSplitPrompt({
        fullText: script.original_text,
        title: script.title ?? "无标题",
        newsCount: newsItems.length > 0 ? newsItems.length : undefined,
      });

      // 6. Call LLM or mock
      let output: ScriptRewriteOutput;
      const settings = await this.appSettingsService.getEffectiveSettings();
      const llmEnabled = canUseModelRoute("SCRIPT_REWRITE", settings);

      if (!llmEnabled) {
        output = buildMockScenes(script.original_text);
      } else {
        try {
          output = await generateStructuredJson<ScriptRewriteOutput>({
            routeKey: "SCRIPT_REWRITE",
            schemaName: "scene_split_output",
            schema: scriptRewriteJsonSchema,
            zodSchema: scriptRewriteOutputSchema,
            systemPrompt,
            userPrompt,
            preprocess: (raw: unknown) => {
              // If LLM returns array directly, wrap it
              if (Array.isArray(raw)) {
                return { scenes: raw };
              }
              return raw;
            },
          });
        } catch (llmError) {
          console.warn("[scene-split] LLM failed, using mock fallback:", llmError);
          output = buildMockScenes(script.original_text);
        }
      }

      // 7. Validate
      const validated = scriptRewriteOutputSchema.parse(output);

      // 8. Persist scenes in transaction
      await prisma.$transaction(async (tx) => {
        await tx.scriptScene.createMany({
          data: validated.scenes.map((scene) => ({
            project_id: script.project_id,
            script_id: scriptId,
            scene_order: scene.scene_order,
            original_text: scene.original_text,
            rewritten_for_ai: scene.rewritten_for_ai,
            shot_goal: scene.shot_goal,
            duration_sec: scene.duration_sec,
            continuity_group: scene.continuity_group,
            visual_priority: toJson(scene.visual_priority),
            avoid: toJson(scene.avoid),
          })),
        });
      });

      // 9. Mark as done
      await mergeStructuredOutput(scriptId, {
        scene_split_status: "done",
        scene_count: validated.scenes.length,
        scene_split_at: new Date().toISOString(),
      });

      return { sceneCount: validated.scenes.length };
    } catch (error) {
      // Mark as failed (unless it's an idempotency error thrown before splitting started)
      if (!(error instanceof IdempotencyError)) {
        await mergeStructuredOutput(scriptId, {
          scene_split_status: "failed",
          scene_split_error: error instanceof Error ? error.message : "Unknown error",
        }).catch(() => {});
      }
      throw error;
    }
  }
}

// ---------------------------------------------------------------------------
// Custom error for idempotency rejections
// ---------------------------------------------------------------------------

export class IdempotencyError extends Error {
  constructor(
    public readonly code: "already_split" | "split_in_progress",
    public readonly existingCount?: number,
  ) {
    super(
      code === "already_split"
        ? `Script already has ${existingCount} scenes. Use force=true to re-split.`
        : "Scene split is already in progress.",
    );
    this.name = "IdempotencyError";
  }
}
