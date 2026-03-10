import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { renderJobCreateSchema } from "@/schemas/production-control";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class RenderJobService {
  async listByProject(projectId: string) {
    return prisma.renderJob.findMany({
      where: { project_id: projectId },
      include: {
        storyboard: true,
        storyboard_frame: true,
        script_scene: true,
        render_assets: true,
      },
      orderBy: [{ created_at: "desc" }],
    });
  }

  async create(projectId: string, input: unknown) {
    const payload = renderJobCreateSchema.parse(input);

    return prisma.renderJob.create({
      data: {
        project_id: projectId,
        storyboard_id: payload.storyboard_id,
        storyboard_frame_id: payload.storyboard_frame_id,
        script_scene_id: payload.script_scene_id,
        job_type: payload.job_type,
        job_status: payload.job_status ?? "QUEUED",
        provider: payload.provider,
        provider_model: payload.provider_model,
        input_json: toJson(payload.input_json),
        queued_at: payload.job_status === "DRAFT" ? null : new Date(),
      },
      include: {
        storyboard: true,
        storyboard_frame: true,
        script_scene: true,
        render_assets: true,
      },
    });
  }
}
