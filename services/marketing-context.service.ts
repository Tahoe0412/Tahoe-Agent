import { prisma } from "@/lib/db";
import { getCopyLength, getUsageScenario, type CopyLength, type UsageScenario } from "@/lib/copy-goal";
import { analyzeStyleReferenceSample, formatStyleReferenceInsight, type StyleReferenceInsight } from "@/lib/style-reference";
import { getStyleTemplate, type StyleTemplate } from "@/lib/style-template";
import { getWritingMode, type WritingMode } from "@/lib/writing-mode";

export type MarketingGenerationContext = {
  projectTitle: string;
  topicQuery: string;
  projectIntroduction: string | null;
  coreIdea: string | null;
  sourceScript: string | null;
  styleReferenceSample: string | null;
  styleReferenceInsight: StyleReferenceInsight | null;
  writingMode: WritingMode;
  styleTemplate: StyleTemplate;
  copyLength: CopyLength;
  usageScenario: UsageScenario;
  brand:
    | {
        name: string;
        stage: string;
        positioning: string;
        coreBelief: string | null;
        voice: string | null;
        forbiddenPhrases: string[];
        platformPriority: string[];
        pillarNames: string[];
      }
    | null;
  industry:
    | {
        name: string;
        keywords: string[];
        competitorKeywords: string[];
        boundaries: string | null;
        forbiddenTerms: string[];
        painPoints: string[];
        commonQuestions: string[];
        topicDirections: string[];
      }
    | null;
  brief:
    | {
        title: string;
        objective: string;
        tone: string;
        keyMessage: string;
        targetAudience: string | null;
        callToAction: string | null;
        constraints: string[];
      }
    | null;
};

export class MarketingContextService {
  async getProjectContext(projectId: string): Promise<MarketingGenerationContext | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand_profile: {
          include: {
            content_pillars: {
              where: { active: true },
              orderBy: [{ priority_score: "desc" }, { updated_at: "desc" }],
              take: 8,
            },
          },
        },
        industry_template: true,
        creative_briefs: {
          include: { constraints: true },
          orderBy: [{ version_number: "desc" }],
          take: 1,
        },
      },
    });

    if (!project) return null;

    const brief = project.creative_briefs[0] ?? null;

    const styleReferenceSample = (((project.metadata as Record<string, unknown> | null)?.style_reference_sample as string | undefined) ?? "").trim() || null;

    return {
      projectTitle: project.title,
      topicQuery: project.topic_query,
      projectIntroduction: (((project.metadata as Record<string, unknown> | null)?.project_introduction as string | undefined) ?? "").trim() || null,
      coreIdea: (((project.metadata as Record<string, unknown> | null)?.core_idea as string | undefined) ?? "").trim() || null,
      sourceScript: project.raw_script_text,
      styleReferenceSample,
      styleReferenceInsight: analyzeStyleReferenceSample(styleReferenceSample),
      writingMode: getWritingMode((project.metadata as Record<string, unknown> | null)?.writing_mode),
      styleTemplate: getStyleTemplate((project.metadata as Record<string, unknown> | null)?.style_template),
      copyLength: getCopyLength((project.metadata as Record<string, unknown> | null)?.copy_length),
      usageScenario: getUsageScenario((project.metadata as Record<string, unknown> | null)?.usage_scenario),
      brand: project.brand_profile
        ? {
            name: project.brand_profile.brand_name,
            stage: project.brand_profile.brand_stage,
            positioning: project.brand_profile.brand_positioning,
            coreBelief: project.brand_profile.core_belief,
            voice: project.brand_profile.brand_voice,
            forbiddenPhrases: ((project.brand_profile.forbidden_phrases as string[] | null) ?? []).slice(0, 20),
            platformPriority: ((project.brand_profile.platform_priority as string[] | null) ?? []).slice(0, 8),
            pillarNames: project.brand_profile.content_pillars.map((item) => item.pillar_name),
          }
        : null,
      industry: project.industry_template
        ? {
            name: project.industry_template.industry_name,
            keywords: ((project.industry_template.industry_keywords as string[] | null) ?? []).slice(0, 20),
            competitorKeywords: ((project.industry_template.competitor_keywords as string[] | null) ?? []).slice(0, 20),
            boundaries: project.industry_template.expression_boundaries,
            forbiddenTerms: ((project.industry_template.forbidden_terms as string[] | null) ?? []).slice(0, 20),
            painPoints: ((project.industry_template.common_pain_points as string[] | null) ?? []).slice(0, 20),
            commonQuestions: ((project.industry_template.common_questions as string[] | null) ?? []).slice(0, 20),
            topicDirections: ((project.industry_template.recommended_topic_directions as string[] | null) ?? []).slice(0, 20),
          }
        : null,
      brief: brief
        ? {
            title: brief.title,
            objective: brief.objective,
            tone: brief.primary_tone,
            keyMessage: brief.key_message,
            targetAudience: brief.target_audience,
            callToAction: brief.call_to_action,
            constraints: brief.constraints.map((item) => item.constraint_label),
          }
        : null,
    };
  }

  formatPromptContext(context: MarketingGenerationContext | null) {
    if (!context) return "No brand or industry context is attached to this project yet.";

    return [
      `Project: ${context.projectTitle}`,
      `Topic: ${context.topicQuery}`,
      `Project Introduction: ${context.projectIntroduction ?? "N/A"}`,
      `Core Idea: ${context.coreIdea ?? "N/A"}`,
      `Original Input: ${context.sourceScript ?? "N/A"}`,
      `Style Reference Sample: ${context.styleReferenceSample ?? "N/A"}`,
      `Style Reference Insight:\n${formatStyleReferenceInsight(context.styleReferenceInsight)}`,
      context.styleReferenceInsight
        ? [
            "Style Reference Segments:",
            `- 标题风格学习：${context.styleReferenceInsight.titleStyleLines.join(" ")}`,
            `- 开头风格学习：${context.styleReferenceInsight.openingStyleLines.join(" ")}`,
            `- 正文节奏学习：${context.styleReferenceInsight.bodyRhythmLines.join(" ")}`,
          ].join("\n")
        : "Style Reference Segments: N/A",
      `Writing Mode: ${context.writingMode}`,
      `Style Template: ${context.styleTemplate}`,
      `Copy Length: ${context.copyLength}`,
      `Usage Scenario: ${context.usageScenario}`,
      "",
      "Brand Context:",
      context.brand
        ? [
            `- Name: ${context.brand.name}`,
            `- Stage: ${context.brand.stage}`,
            `- Positioning: ${context.brand.positioning}`,
            `- Core Belief: ${context.brand.coreBelief ?? "N/A"}`,
            `- Brand Voice: ${context.brand.voice ?? "N/A"}`,
            `- Platform Priority: ${context.brand.platformPriority.join(", ") || "N/A"}`,
            `- Content Pillars: ${context.brand.pillarNames.join(", ") || "N/A"}`,
            `- Forbidden Phrases: ${context.brand.forbiddenPhrases.join(", ") || "None"}`,
          ].join("\n")
        : "- No brand profile attached.",
      "",
      "Industry Context:",
      context.industry
        ? [
            `- Industry: ${context.industry.name}`,
            `- Keywords: ${context.industry.keywords.join(", ") || "N/A"}`,
            `- Competitor Keywords: ${context.industry.competitorKeywords.join(", ") || "N/A"}`,
            `- Boundaries: ${context.industry.boundaries ?? "N/A"}`,
            `- Pain Points: ${context.industry.painPoints.join(", ") || "N/A"}`,
            `- Common Questions: ${context.industry.commonQuestions.join(", ") || "N/A"}`,
            `- Recommended Directions: ${context.industry.topicDirections.join(", ") || "N/A"}`,
            `- Forbidden Terms: ${context.industry.forbiddenTerms.join(", ") || "None"}`,
          ].join("\n")
        : "- No industry template attached.",
      "",
      "Current Brief Context:",
      context.brief
        ? [
            `- Title: ${context.brief.title}`,
            `- Objective: ${context.brief.objective}`,
            `- Tone: ${context.brief.tone}`,
            `- Key Message: ${context.brief.keyMessage}`,
            `- Target Audience: ${context.brief.targetAudience ?? "N/A"}`,
            `- CTA: ${context.brief.callToAction ?? "N/A"}`,
            `- Constraints: ${context.brief.constraints.join(", ") || "None"}`,
          ].join("\n")
        : "- No brief created yet.",
    ].join("\n");
  }
}
