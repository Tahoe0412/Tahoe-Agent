import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { creativeBriefCreateSchema } from "@/schemas/production-control";
import { MarketingContextService } from "@/services/marketing-context.service";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class CreativeBriefService {
  private readonly marketingContextService = new MarketingContextService();

  async listByProject(projectId: string) {
    return prisma.creativeBrief.findMany({
      where: { project_id: projectId },
      include: {
        constraints: true,
      },
      orderBy: [{ version_number: "desc" }, { created_at: "desc" }],
    });
  }

  async create(projectId: string, input: unknown) {
    const payload = creativeBriefCreateSchema.parse(input);
    const context = await this.marketingContextService.getProjectContext(projectId);
    const currentCount = await prisma.creativeBrief.count({
      where: { project_id: projectId },
    });
    const inheritedConstraints: Array<{
      constraint_type: "BRAND" | "PLATFORM" | "AUDIENCE" | "STYLE" | "LEGAL" | "DELIVERY";
      constraint_code: string;
      constraint_label: string;
      constraint_value?: string;
      is_hard_constraint: boolean;
      metadata_json?: Record<string, unknown>;
    }> = [
      ...(context?.brand?.voice
        ? [
            {
              constraint_type: "BRAND" as const,
              constraint_code: "BRAND_VOICE",
              constraint_label: `品牌语气：${context.brand.voice}`,
              constraint_value: context.brand.voice,
              is_hard_constraint: false,
            },
          ]
        : []),
      ...((context?.brand?.forbiddenPhrases ?? []).map((item, index) => ({
        constraint_type: "LEGAL" as const,
        constraint_code: `BRAND_FORBIDDEN_${index + 1}`,
        constraint_label: `品牌禁用表达：${item}`,
        constraint_value: item,
        is_hard_constraint: true,
      }))),
      ...((context?.industry?.forbiddenTerms ?? []).map((item, index) => ({
        constraint_type: "LEGAL" as const,
        constraint_code: `INDUSTRY_FORBIDDEN_${index + 1}`,
        constraint_label: `行业风险词：${item}`,
        constraint_value: item,
        is_hard_constraint: true,
      }))),
      ...(context?.industry?.boundaries
        ? [
            {
              constraint_type: "STYLE" as const,
              constraint_code: "INDUSTRY_BOUNDARY",
              constraint_label: `行业表达边界：${context.industry.boundaries}`,
              constraint_value: context.industry.boundaries,
              is_hard_constraint: false,
            },
          ]
        : []),
    ];
    const mergedConstraints = [...payload.constraints, ...inheritedConstraints].filter(
      (item, index, array) => array.findIndex((candidate) => candidate.constraint_code === item.constraint_code) === index,
    );

    return prisma.creativeBrief.create({
      data: {
        project_id: projectId,
        brief_status: currentCount === 0 ? "ACTIVE" : "DRAFT",
        version_number: currentCount + 1,
        title: payload.title,
        campaign_name: payload.campaign_name,
        objective: payload.objective,
        primary_tone: payload.primary_tone,
        audience_awareness: payload.audience_awareness,
        target_platforms: toJson(payload.target_platforms),
        key_message: payload.key_message,
        call_to_action: payload.call_to_action,
        target_audience: payload.target_audience,
        duration_target_sec: payload.duration_target_sec,
        language_code: payload.language_code ?? "zh-CN",
        brief_json: toJson(
          payload.brief_json ?? {
            title: payload.title,
            objective: payload.objective,
            primary_tone: payload.primary_tone,
            key_message: payload.key_message,
            target_platforms: payload.target_platforms,
            inherited_brand_name: context?.brand?.name ?? null,
            inherited_industry_name: context?.industry?.name ?? null,
          },
        ),
        constraints: {
          create: mergedConstraints.map((constraint) => ({
            constraint_type: constraint.constraint_type,
            constraint_code: constraint.constraint_code,
            constraint_label: constraint.constraint_label,
            constraint_value: constraint.constraint_value,
            is_hard_constraint: constraint.is_hard_constraint,
            metadata_json: constraint.metadata_json ? toJson(constraint.metadata_json) : undefined,
            project_id: projectId,
          })),
        },
      },
      include: {
        constraints: true,
      },
    });
  }
}
