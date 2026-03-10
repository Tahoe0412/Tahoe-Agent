import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { brandProfileCreateSchema, contentPillarCreateSchema } from "@/schemas/production-control";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class BrandProfileService {
  async list() {
    return prisma.brandProfile.findMany({
      include: {
        content_pillars: true,
        projects: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: [{ updated_at: "desc" }],
    });
  }

  async create(input: unknown) {
    const payload = brandProfileCreateSchema.parse(input);
    return prisma.brandProfile.create({
      data: {
        brand_name: payload.brand_name,
        brand_positioning: payload.brand_positioning,
        core_belief: payload.core_belief,
        product_lines_json: toJson(payload.product_lines),
        target_personas_json: toJson(payload.target_personas),
        platform_priority: toJson(payload.platform_priority),
        forbidden_phrases: toJson(payload.forbidden_phrases),
        compliance_notes: payload.compliance_notes,
        brand_voice: payload.brand_voice,
        brand_stage: payload.brand_stage,
        metadata_json: payload.metadata_json ? toJson(payload.metadata_json) : undefined,
      },
    });
  }

  async createPillar(input: unknown) {
    const payload = contentPillarCreateSchema.parse(input);
    return prisma.contentPillar.create({
      data: {
        brand_profile_id: payload.brand_profile_id,
        pillar_name: payload.pillar_name,
        pillar_type: payload.pillar_type,
        pillar_summary: payload.pillar_summary,
        topic_directions: toJson(payload.topic_directions),
        platform_fit_json: toJson(payload.platform_fit),
        priority_score: payload.priority_score,
        active: payload.active,
      },
    });
  }
}
