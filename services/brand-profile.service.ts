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
        keyword_pool: toJson(payload.keyword_pool),
        brand_stage: payload.brand_stage,
        metadata_json: payload.metadata_json ? toJson(payload.metadata_json) : undefined,
      },
    });
  }

  async update(id: string, input: unknown) {
    const payload = brandProfileCreateSchema.partial().parse(input);
    const data: Record<string, unknown> = {};
    if (payload.brand_name !== undefined) data.brand_name = payload.brand_name;
    if (payload.brand_positioning !== undefined) data.brand_positioning = payload.brand_positioning;
    if (payload.core_belief !== undefined) data.core_belief = payload.core_belief;
    if (payload.product_lines !== undefined) data.product_lines_json = toJson(payload.product_lines);
    if (payload.target_personas !== undefined) data.target_personas_json = toJson(payload.target_personas);
    if (payload.platform_priority !== undefined) data.platform_priority = toJson(payload.platform_priority);
    if (payload.forbidden_phrases !== undefined) data.forbidden_phrases = toJson(payload.forbidden_phrases);
    if (payload.compliance_notes !== undefined) data.compliance_notes = payload.compliance_notes;
    if (payload.brand_voice !== undefined) data.brand_voice = payload.brand_voice;
    if (payload.keyword_pool !== undefined) data.keyword_pool = toJson(payload.keyword_pool);
    if (payload.brand_stage !== undefined) data.brand_stage = payload.brand_stage;
    return prisma.brandProfile.update({ where: { id }, data });
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
