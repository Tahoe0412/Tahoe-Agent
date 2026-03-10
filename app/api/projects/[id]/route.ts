import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { projectUpdateSchema } from "@/schemas/project";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        research_tasks: true,
        platform_creators: true,
        platform_contents: true,
        trend_topics: {
          include: {
            trend_evidences: true,
          },
        },
        creative_briefs: {
          include: {
            constraints: true,
          },
        },
        approval_gates: true,
        storyboards: {
          include: {
            frames: {
              include: {
                references: true,
                render_jobs: true,
                render_assets: true,
              },
            },
          },
        },
        render_jobs: {
          include: {
            render_assets: true,
          },
        },
        render_assets: true,
        frame_references: true,
        review_notes: true,
        trend_evidences: true,
        scripts: {
          include: {
            script_scenes: {
              include: {
                scene_classifications: true,
                required_assets: true,
              },
            },
          },
        },
        script_versions: true,
        shots: true,
        shot_asset_dependencies: true,
        scene_classifications: true,
        required_assets: true,
        uploaded_assets: true,
        research_reports: true,
      },
    });

    if (!project) {
      return fail("项目不存在。", 404);
    }

    return ok(project);
  } catch (error) {
    return fail("读取项目失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = projectUpdateSchema.parse(await request.json());
    const current = await prisma.project.findUnique({
      where: { id },
      select: {
        metadata: true,
      },
    });

    if (!current) {
      return fail("项目不存在。", 404);
    }

    const nextMetadata = {
      ...((current.metadata as Record<string, unknown> | null) ?? {}),
      ...(body.project_tags ? { project_tags: body.project_tags } : {}),
      ...(typeof body.is_pinned === "boolean" ? { is_pinned: body.is_pinned } : {}),
      ...(body.last_opened_at ? { last_opened_at: body.last_opened_at } : {}),
      ...(typeof body.project_introduction === "string" ? { project_introduction: body.project_introduction } : {}),
      ...(typeof body.core_idea === "string" ? { core_idea: body.core_idea } : {}),
      ...(typeof body.style_reference_sample === "string" ? { style_reference_sample: body.style_reference_sample } : {}),
      ...(typeof body.writing_mode === "string" ? { writing_mode: body.writing_mode } : {}),
      ...(typeof body.style_template === "string" ? { style_template: body.style_template } : {}),
      ...(typeof body.copy_length === "string" ? { copy_length: body.copy_length } : {}),
      ...(typeof body.usage_scenario === "string" ? { usage_scenario: body.usage_scenario } : {}),
    };

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: body.title,
        topic_query: body.topic_query,
        raw_script_text: body.raw_script_text,
        status: body.status,
        brand_profile_id: body.brand_profile_id,
        industry_template_id: body.industry_template_id,
        metadata: nextMetadata,
      },
    });

    return ok(project);
  } catch (error) {
    return fail("更新项目失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
