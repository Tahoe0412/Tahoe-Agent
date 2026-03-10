import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sceneUpdateRequestSchema } from "@/schemas/script-production";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class ScriptService {
  async createUserScript(params: { projectId: string; title?: string; originalText: string }) {
    const count = await prisma.script.count({
      where: { project_id: params.projectId },
    });

    return prisma.script.create({
      data: {
        project_id: params.projectId,
        source_type: "USER_INPUT",
        script_status: "ACTIVE",
        version_number: count + 1,
        title: params.title,
        original_text: params.originalText,
        rewritten_text: null,
        model_name: "user-input",
        structured_output: toJson({
          original_text: params.originalText,
        }),
      },
    });
  }

  async listScenes(projectId: string) {
    return prisma.scriptScene.findMany({
      where: { project_id: projectId },
      include: {
        scene_classifications: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
        required_assets: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
      orderBy: [{ script_id: "asc" }, { scene_order: "asc" }],
    });
  }

  async updateScene(projectId: string, sceneId: string, input: unknown) {
    const payload = sceneUpdateRequestSchema.parse(input);
    const scene = await prisma.scriptScene.findFirst({
      where: {
        id: sceneId,
        project_id: projectId,
      },
    });

    if (!scene) {
      throw new Error("Scene not found.");
    }

    return prisma.scriptScene.update({
      where: { id: scene.id },
      data: {
        rewritten_for_ai: payload.rewritten_for_ai ?? scene.rewritten_for_ai,
        shot_goal: payload.shot_goal ?? scene.shot_goal,
        continuity_group: payload.continuity_group ?? scene.continuity_group,
        duration_sec: payload.duration_sec ?? scene.duration_sec,
        visual_priority: payload.visual_priority ? toJson(payload.visual_priority) : toJson(scene.visual_priority),
        avoid: payload.avoid ? toJson(payload.avoid) : toJson(scene.avoid),
      },
      include: {
        scene_classifications: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
        required_assets: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });
  }
}
