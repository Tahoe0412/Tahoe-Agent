import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { AppSettingsService } from "@/services/app-settings.service";
import { MarketingContextService } from "@/services/marketing-context.service";
import { scriptRewriteOutputSchema, type ScriptRewriteOutput } from "@/schemas/script-production";
import { scriptRewriteJsonSchema } from "@/services/script-rewriter/json-schema";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function splitScript(scriptText: string) {
  return scriptText
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildMockRewrite(scriptText: string): ScriptRewriteOutput {
  const segments = splitScript(scriptText);

  return {
    scenes: segments.map((segment, index) => ({
      scene_order: index + 1,
      original_text: segment,
      rewritten_for_ai: `Scene ${index + 1}: ${segment}。镜头表达保持明确主体、动作和结果，适合 AI 视频生成。`,
      shot_goal: index === 0 ? "建立强 Hook" : index === segments.length - 1 ? "完成收束与行动号召" : "推进叙事与证明观点",
      duration_sec: Math.min(12, Math.max(4, Math.round(segment.length / 14))),
      continuity_group: index < 2 ? "intro_arc" : index < segments.length - 1 ? "proof_arc" : "cta_arc",
      visual_priority: index === 0 ? ["human_face", "headline_text", "result_frame"] : ["product_ui", "proof_overlay"],
      avoid: ["visual_noise", "tiny_text"],
    })),
  };
}

async function withRetry<T>(task: () => Promise<T>) {
  try {
    return await task();
  } catch {
    return task();
  }
}

export class ScriptRewriterService {
  private readonly appSettingsService = new AppSettingsService();
  private readonly marketingContextService = new MarketingContextService();

  async rewriteAndSave(params: { projectId: string; title?: string; scriptText: string }) {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    const nextVersion = (await prisma.script.count({ where: { project_id: params.projectId } })) + 1;
    const researchTask = await prisma.researchTask.create({
      data: {
        project_id: params.projectId,
        task_type: "SCRIPT_REWRITE",
        task_status: "RUNNING",
        input_payload: toJson({
          title: params.title,
          script_text: params.scriptText,
        }),
        started_at: new Date(),
      },
    });

    let output: ScriptRewriteOutput;
    const settings = await this.appSettingsService.getEffectiveSettings();
    const context = await this.marketingContextService.getProjectContext(params.projectId);
    const contextPrompt = this.marketingContextService.formatPromptContext(context);
    let modelName = settings.llmModel;
    let rawPayload: unknown = null;

    try {
      const llmEnabled = canUseModelRoute("SCRIPT_REWRITE", settings);

      if (!llmEnabled) {
        output = buildMockRewrite(params.scriptText);
        modelName = "mock-script-rewriter";
        rawPayload = output;
      } else {
        const route = settings.llmRouting.SCRIPT_REWRITE;
        modelName = route.model;
        output = await withRetry(() =>
          generateStructuredJson({
            routeKey: "SCRIPT_REWRITE",
            schemaName: "script_rewrite_output",
            schema: scriptRewriteJsonSchema,
            zodSchema: scriptRewriteOutputSchema,
            systemPrompt:
              "You rewrite natural language scripts into production-ready AI video scene units. Respect brand voice, legal boundaries, and industry context. Output valid JSON only.",
            userPrompt: [
              "Rewrite the script into scene units for AI video production.",
              "Requirements:",
              "- Preserve the meaning of the original text.",
              "- Keep the message aligned with the attached brand positioning and brand voice.",
              "- Avoid all forbidden phrases or risky claims from the brand and industry context.",
              "- Use the current brief objective, tone, and CTA when available.",
              "- Each scene must be visually actionable.",
              "- continuity_group should be stable short ids like intro_arc, demo_arc, payoff_arc.",
              "- visual_priority and avoid should be concise tags, not sentences.",
              "",
              `Context:\n${contextPrompt}`,
              "",
              `Script:\n${params.scriptText}`,
            ].join("\n"),
          }),
        );
        rawPayload = output;
      }

      const validated = scriptRewriteOutputSchema.parse(output);

      const script = await prisma.script.create({
        data: {
          project_id: params.projectId,
          research_task_id: researchTask.id,
          source_type: "AI_REWRITE",
          script_status: "ACTIVE",
          version_number: nextVersion,
          title: params.title,
          original_text: params.scriptText,
          rewritten_text: validated.scenes.map((scene) => scene.rewritten_for_ai).join("\n"),
          model_name: modelName,
          structured_output: toJson(validated),
          raw_payload: toJson(rawPayload),
          script_scenes: {
            create: validated.scenes.map((scene) => ({
              project_id: params.projectId,
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
          script_scenes: true,
        },
      });

      await prisma.researchTask.update({
        where: { id: researchTask.id },
        data: {
          task_status: "SUCCEEDED",
          raw_payload: toJson(validated),
          finished_at: new Date(),
        },
      });

      return script;
    } catch (error) {
      await prisma.researchTask.update({
        where: { id: researchTask.id },
        data: {
          task_status: "FAILED",
          error_message: error instanceof Error ? error.message : "Script rewrite failed.",
          finished_at: new Date(),
        },
      });
      throw error;
    }
  }
}
