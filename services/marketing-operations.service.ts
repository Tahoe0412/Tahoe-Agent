import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import {
  campaignSprintCreateSchema,
  complianceCheckCreateSchema,
  optimizationReviewCreateSchema,
  platformAdaptationCreateSchema,
  platformAdaptationOutputSchema,
  strategyTaskCreateSchema,
  type PlatformAdaptationOutput,
} from "@/schemas/production-control";
import { platformAdaptationJsonSchema } from "@/services/platform-adaptation/json-schema";
import { AppSettingsService } from "@/services/app-settings.service";
import { MarketingContextService } from "@/services/marketing-context.service";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class MarketingOperationsService {
  private readonly appSettingsService = new AppSettingsService();
  private readonly marketingContextService = new MarketingContextService();

  async createCampaignSprint(projectId: string, input: unknown) {
    const payload = campaignSprintCreateSchema.parse(input);
    return prisma.campaignSprint.create({
      data: {
        project_id: projectId,
        brand_profile_id: payload.brand_profile_id,
        sprint_name: payload.sprint_name,
        sprint_goal: payload.sprint_goal,
        sprint_status: payload.sprint_status,
        start_date: payload.start_date ? new Date(payload.start_date) : undefined,
        end_date: payload.end_date ? new Date(payload.end_date) : undefined,
        objective_json: payload.objective_json ? toJson(payload.objective_json) : undefined,
        content_strategy_json: payload.content_strategy_json ? toJson(payload.content_strategy_json) : undefined,
      },
    });
  }

  async createStrategyTask(projectId: string, input: unknown) {
    const payload = strategyTaskCreateSchema.parse(input);
    return prisma.strategyTask.create({
      data: {
        project_id: projectId,
        brand_profile_id: payload.brand_profile_id,
        campaign_sprint_id: payload.campaign_sprint_id,
        content_pillar_id: payload.content_pillar_id,
        task_type: payload.task_type,
        task_status: payload.task_status,
        task_title: payload.task_title,
        task_summary: payload.task_summary,
        priority_score: payload.priority_score,
        owner_label: payload.owner_label,
        due_at: payload.due_at ? new Date(payload.due_at) : undefined,
        task_json: payload.task_json ? toJson(payload.task_json) : undefined,
      },
    });
  }

  async createPlatformAdaptation(projectId: string, input: unknown) {
    const payload = platformAdaptationCreateSchema.parse(input);
    const settings = await this.appSettingsService.getEffectiveSettings();
    const context = await this.marketingContextService.getProjectContext(projectId);
    const contextPrompt = this.marketingContextService.formatPromptContext(context);
    const llmEnabled = canUseModelRoute("PLATFORM_ADAPTATION", settings);
    const shouldGenerate = payload.auto_generate || !payload.body_text;

    let generated: PlatformAdaptationOutput | null = null;

    if (shouldGenerate && llmEnabled) {
      const styleInstruction =
        context?.styleTemplate === "WARM_HEALING"
          ? "写作风格要温暖疗愈、有人味、减少压迫感。"
          : context?.styleTemplate === "LIGHT_LUXURY"
            ? "写作风格要轻奢高级、克制精致、避免廉价促销感。"
            : context?.styleTemplate === "HIGH_CONVERSION"
              ? "写作风格要高转化、强调痛点和行动，减少抒情。"
              : context?.styleTemplate === "FOUNDER_VOICE"
                ? "写作风格要像创始人亲自表达，保留判断和主张。"
                : context?.styleTemplate === "STORE_TRUST"
                  ? "写作风格要强调真实场景、门店服务、信任感和口碑感。"
                  : "写作风格要理性专业、结构清晰、表达可信。";
      const generatedRaw = await generateStructuredJson({
        routeKey: "PLATFORM_ADAPTATION",
        schemaName: "platform_adaptation_output",
        schema: platformAdaptationJsonSchema,
        zodSchema: platformAdaptationOutputSchema,
        systemPrompt:
          "You adapt a core marketing message into a platform-ready post. Respect brand voice, legal boundaries, and industry risks. Output valid JSON only.",
        userPrompt: [
          "Rewrite the source message for the requested platform surface.",
          "Requirements:",
          "- Preserve the commercial intent and key message.",
          "- Match the requested platform surface format.",
          "- Avoid forbidden phrases, sensitive claims, or risky effectiveness promises.",
          "- Keep the result operational and publish-ready.",
          `- ${styleInstruction}`,
          "",
          `Platform Surface: ${payload.platform_surface}`,
          `Context:\n${contextPrompt}`,
          "",
          `Source Message:\n${payload.source_message}`,
        ].join("\n"),
      });
      generated = {
        ...generatedRaw,
        adaptation_notes: generatedRaw.adaptation_notes ?? [],
      };
    }

    const bodyText = payload.body_text ?? generated?.body_text;
    if (!bodyText) {
      throw new Error("平台改写正文为空，且未生成成功。");
    }

    return prisma.platformAdaptation.create({
      data: {
        project_id: projectId,
        brand_profile_id: payload.brand_profile_id,
        campaign_sprint_id: payload.campaign_sprint_id,
        content_pillar_id: payload.content_pillar_id,
        script_id: payload.script_id,
        script_scene_id: payload.script_scene_id,
        source_message: payload.source_message,
        platform_surface: payload.platform_surface,
        adaptation_status: payload.adaptation_status,
        title_text: payload.title_text ?? generated?.title_text,
        body_text: bodyText,
        hook_text: payload.hook_text ?? generated?.hook_text,
        cover_copy: payload.cover_copy ?? generated?.cover_copy,
        interaction_prompt: payload.interaction_prompt ?? generated?.interaction_prompt,
        structured_output: toJson({
          ...payload.structured_output,
          brand_context: context?.brand?.name ?? null,
          industry_context: context?.industry?.name ?? null,
          adaptation_notes: generated?.adaptation_notes ?? [],
        }),
      },
    });
  }

  async createComplianceCheck(projectId: string, input: unknown) {
    const payload = complianceCheckCreateSchema.parse(input);
    return prisma.complianceCheck.create({
      data: {
        project_id: projectId,
        brand_profile_id: payload.brand_profile_id,
        campaign_sprint_id: payload.campaign_sprint_id,
        platform_adaptation_id: payload.platform_adaptation_id,
        target_type: payload.target_type,
        target_id: payload.target_id,
        check_status: payload.check_status,
        flagged_issues_json: toJson(payload.flagged_issues),
        sensitive_hits_json: toJson(payload.sensitive_hits),
        risk_summary: payload.risk_summary,
        needs_human_review: payload.needs_human_review,
      },
    });
  }

  async createOptimizationReview(projectId: string, input: unknown) {
    const payload = optimizationReviewCreateSchema.parse(input);
    return prisma.optimizationReview.create({
      data: {
        project_id: projectId,
        brand_profile_id: payload.brand_profile_id,
        campaign_sprint_id: payload.campaign_sprint_id,
        content_pillar_id: payload.content_pillar_id,
        review_title: payload.review_title,
        content_theme: payload.content_theme,
        content_type: payload.content_type,
        platform_surface: payload.platform_surface,
        headline_text: payload.headline_text,
        opening_style: payload.opening_style,
        core_selling_points: toJson(payload.core_selling_points),
        metric_json: toJson(payload.metric_json),
        optimization_summary: payload.optimization_summary,
        next_recommendations: toJson(payload.next_recommendations),
      },
    });
  }
}
