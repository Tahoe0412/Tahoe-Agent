import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { competitorProfileInputSchema, industryTemplateCreateSchema } from "@/schemas/production-control";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class IndustryTemplateService {
  async list() {
    return prisma.industryTemplate.findMany({
      include: {
        competitor_profiles: true,
        industry_research_snapshots: {
          orderBy: { created_at: "desc" },
          take: 3,
        },
        projects: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: [{ updated_at: "desc" }],
    });
  }

  async create(input: unknown) {
    const payload = industryTemplateCreateSchema.parse(input);
    return prisma.industryTemplate.create({
      data: {
        industry_name: payload.industry_name,
        industry_keywords: toJson(payload.industry_keywords),
        competitor_keywords: toJson(payload.competitor_keywords),
        expression_boundaries: payload.expression_boundaries,
        forbidden_terms: toJson(payload.forbidden_terms),
        platform_content_priorities: toJson(payload.platform_content_priorities),
        common_pain_points: toJson(payload.common_pain_points),
        common_questions: toJson(payload.common_questions),
        recommended_content_pillars: toJson(payload.recommended_content_pillars),
        recommended_topic_directions: toJson(payload.recommended_topic_directions),
        template_notes: payload.template_notes,
        metadata_json: payload.metadata_json ? toJson(payload.metadata_json) : undefined,
      },
    });
  }

  async createCompetitor(industryTemplateId: string, input: unknown) {
    const payload = competitorProfileInputSchema.parse(input);
    return prisma.competitorProfile.create({
      data: {
        industry_template_id: industryTemplateId,
        competitor_name: payload.competitor_name,
        competitor_tier: payload.competitor_tier,
        keywords_json: toJson(payload.keywords),
        primary_platforms: toJson(payload.primary_platforms),
        messaging_angles_json: toJson(payload.messaging_angles),
        notes_text: payload.notes_text,
      },
    });
  }
}
