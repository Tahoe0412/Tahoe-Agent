import { z } from "zod";
import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";

const bulkProjectUpdateSchema = z.object({
  project_ids: z.array(z.string().cuid()).min(1).max(50),
  status: z.enum(["DRAFT", "RUNNING", "COMPLETED", "FAILED", "ARCHIVED"]).optional(),
  brand_profile_id: z.string().cuid().nullable().optional(),
  industry_template_id: z.string().cuid().nullable().optional(),
  project_tags: z.array(z.string().min(1).max(32)).max(12).optional(),
  merge_tags: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  try {
    const body = bulkProjectUpdateSchema.parse(await parseJsonBody(request));
    const projects = await prisma.project.findMany({
      where: {
        id: {
          in: body.project_ids,
        },
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    await prisma.$transaction(
      projects.map((project) => {
        const currentMetadata = (project.metadata as Record<string, unknown> | null) ?? {};
        const currentTags = ((currentMetadata.project_tags as string[] | undefined) ?? []).filter(Boolean);
        const nextTags = body.project_tags
          ? body.merge_tags
            ? [...new Set([...currentTags, ...body.project_tags])].slice(0, 12)
            : body.project_tags
          : currentTags;

        return prisma.project.update({
          where: { id: project.id },
          data: {
            status: body.status,
            brand_profile_id: body.brand_profile_id,
            industry_template_id: body.industry_template_id,
            metadata: {
              ...currentMetadata,
              project_tags: nextTags,
            },
          },
        });
      }),
    );

    return ok({
      updated_count: projects.length,
    });
  } catch (error) {
    return toErrorResponse(error, "批量更新项目失败。");
  }
}
