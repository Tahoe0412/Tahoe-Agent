import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { frameReferenceCreateSchema, storyboardCreateSchema } from "@/schemas/production-control";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class StoryboardService {
  async listByProject(projectId: string) {
    return prisma.storyboard.findMany({
      where: { project_id: projectId },
      include: {
        source_brief: true,
        script: true,
        frames: {
          include: {
            references: true,
          },
          orderBy: { frame_order: "asc" },
        },
      },
      orderBy: [{ version_number: "desc" }, { created_at: "desc" }],
    });
  }

  async create(projectId: string, input: unknown) {
    const payload = storyboardCreateSchema.parse(input);
    const count = await prisma.storyboard.count({
      where: { project_id: projectId },
    });

    return prisma.storyboard.create({
      data: {
        project_id: projectId,
        source_brief_id: payload.source_brief_id,
        script_id: payload.script_id,
        storyboard_status: count === 0 ? "ACTIVE" : "DRAFT",
        version_number: count + 1,
        title: payload.title,
        goal_summary: payload.goal_summary,
        style_direction: payload.style_direction,
        aspect_ratio: payload.aspect_ratio,
        frame_count: payload.frames.length,
        structured_output: toJson(
          payload.structured_output ?? {
            title: payload.title,
            aspect_ratio: payload.aspect_ratio,
            frame_count: payload.frames.length,
          },
        ),
        frames: {
          create: payload.frames.map((frame) => ({
            project_id: projectId,
            script_scene_id: frame.script_scene_id,
            frame_order: frame.frame_order,
            frame_status: frame.frame_status,
            continuity_group: frame.continuity_group,
            frame_title: frame.frame_title,
            composition_notes: frame.composition_notes,
            camera_plan: frame.camera_plan,
            motion_plan: frame.motion_plan,
            narration_text: frame.narration_text,
            on_screen_text: frame.on_screen_text,
            visual_prompt: frame.visual_prompt,
            negative_prompt: frame.negative_prompt,
            reference_strategy: frame.reference_strategy ? toJson(frame.reference_strategy) : undefined,
            duration_sec: frame.duration_sec,
            production_class: frame.production_class,
          })),
        },
      },
      include: {
        frames: {
          include: { references: true },
          orderBy: { frame_order: "asc" },
        },
      },
    });
  }

  async addFrameReference(projectId: string, input: unknown) {
    const payload = frameReferenceCreateSchema.parse(input);

    return prisma.frameReference.create({
      data: {
        project_id: projectId,
        storyboard_frame_id: payload.storyboard_frame_id,
        reference_type: payload.reference_type,
        source_label: payload.source_label,
        file_name: payload.file_name,
        file_url: payload.file_url,
        metadata_json: payload.metadata_json ? toJson(payload.metadata_json) : undefined,
      },
    });
  }
}
