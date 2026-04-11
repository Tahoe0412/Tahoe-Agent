import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { renderJobCreateSchema, renderJobFeedbackSchema } from "@/schemas/production-control";

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

  async updateFeedback(projectId: string, jobId: string, input: unknown) {
    const payload = renderJobFeedbackSchema.parse(input);
    const current = await prisma.renderJob.findFirst({
      where: {
        id: jobId,
        project_id: projectId,
      },
      select: {
        id: true,
        output_json: true,
        storyboard: true,
        storyboard_frame: true,
        script_scene: true,
        render_assets: true,
      },
    });

    if (!current) {
      throw new Error("Render job 不存在。");
    }

    const existingOutput =
      current.output_json && typeof current.output_json === "object" && !Array.isArray(current.output_json)
        ? (current.output_json as Record<string, unknown>)
        : {};

    return prisma.renderJob.update({
      where: { id: current.id },
      data: {
        output_json: toJson({
          ...existingOutput,
          feedback: {
            verdict: payload.verdict,
            issue_tags: payload.issue_tags,
            note: payload.note?.trim() || "",
            updated_at: new Date().toISOString(),
          },
        }),
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
