import { prisma } from "@/lib/db";
import { getCopyLength, getUsageScenario, type CopyLength, type UsageScenario } from "@/lib/copy-goal";
import { analyzeStyleReferenceSample, analyzeStyleWithLLM, formatStyleReferenceInsight, normalizeStyleReferenceInsight, type StyleReferenceInsight } from "@/lib/style-reference";
import { getStyleTemplate, type StyleTemplate } from "@/lib/style-template";
import { AppSettingsService } from "@/services/app-settings.service";
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
  private readonly appSettingsService = new AppSettingsService();

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
      styleReferenceInsight: await this.buildStyleInsight(styleReferenceSample),
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

  private async buildStyleInsight(text: string | null | undefined): Promise<StyleReferenceInsight | null> {
    if (!(text ?? "").trim()) {
      return null;
    }
    try {
      const settings = await this.appSettingsService.getEffectiveSettings();
      return normalizeStyleReferenceInsight(await analyzeStyleWithLLM(text, settings));
    } catch {
      return normalizeStyleReferenceInsight(analyzeStyleReferenceSample(text));
    }
  }

  formatPromptContext(context: MarketingGenerationContext | null) {
    if (!context) return "\u5f53\u524d\u9879\u76ee\u8fd8\u672a\u5173\u8054\u54c1\u724c\u6216\u884c\u4e1a\u4e0a\u4e0b\u6587\u3002";

    const lines: string[] = [];

    lines.push(`\u9879\u76ee\u540d\u79f0\uff1a${context.projectTitle}`);
    lines.push(`\u4f20\u64ad\u4e3b\u9898\uff1a${context.topicQuery}`);
    if (context.projectIntroduction) lines.push(`\u4f18\u5148\u521b\u4f5c\u8f93\u5165\uff1a${context.projectIntroduction}`);
    if (context.coreIdea) lines.push(`\u4f18\u5148\u8868\u8fbe\u7126\u70b9\uff1a${context.coreIdea}`);
    if (context.sourceScript) lines.push(`\u539f\u59cb\u8f93\u5165\uff1a${context.sourceScript}`);
    if (context.styleReferenceSample) lines.push(`\u98ce\u683c\u53c2\u7167\u6837\u7a3f\uff1a${context.styleReferenceSample}`);
    if (context.styleReferenceInsight) {
      lines.push(`\u98ce\u683c\u5206\u6790\uff1a\n${formatStyleReferenceInsight(context.styleReferenceInsight)}`);
    }
    lines.push(`\u5199\u4f5c\u6a21\u5f0f\uff1a${context.writingMode}`);
    lines.push(`\u8f93\u51fa\u98ce\u683c\uff1a${context.styleTemplate}`);
    lines.push(`\u6587\u6848\u957f\u5ea6\uff1a${context.copyLength}`);
    lines.push(`\u4f7f\u7528\u573a\u666f\uff1a${context.usageScenario}`);

    if (context.brand) {
      lines.push("");
      lines.push("\u54c1\u724c\u4e0a\u4e0b\u6587\uff1a");
      lines.push(`- \u54c1\u724c\u540d\uff1a${context.brand.name}`);
      lines.push(`- \u54c1\u724c\u9636\u6bb5\uff1a${context.brand.stage}`);
      lines.push(`- \u54c1\u724c\u5b9a\u4f4d\uff1a${context.brand.positioning}`);
      if (context.brand.coreBelief) lines.push(`- \u6838\u5fc3\u4fe1\u5ff5\uff1a${context.brand.coreBelief}`);
      if (context.brand.voice) lines.push(`- \u54c1\u724c\u58f0\u97f3\uff1a${context.brand.voice}`);
      if (context.brand.platformPriority.length > 0) lines.push(`- \u5e73\u53f0\u4f18\u5148\u7ea7\uff1a${context.brand.platformPriority.join("\u3001")}`);
      if (context.brand.pillarNames.length > 0) lines.push(`- \u5185\u5bb9\u652f\u67f1\uff1a${context.brand.pillarNames.join("\u3001")}`);
      if (context.brand.forbiddenPhrases.length > 0) lines.push(`- \u7981\u7528\u8868\u8fbe\uff1a${context.brand.forbiddenPhrases.join("\u3001")}`);
    }

    if (context.industry) {
      lines.push("");
      lines.push("\u884c\u4e1a\u4e0a\u4e0b\u6587\uff1a");
      lines.push(`- \u884c\u4e1a\uff1a${context.industry.name}`);
      if (context.industry.keywords.length > 0) lines.push(`- \u884c\u4e1a\u5173\u952e\u8bcd\uff1a${context.industry.keywords.join("\u3001")}`);
      if (context.industry.competitorKeywords.length > 0) lines.push(`- \u7ade\u54c1\u5173\u952e\u8bcd\uff1a${context.industry.competitorKeywords.join("\u3001")}`);
      if (context.industry.boundaries) lines.push(`- \u8868\u8fbe\u8fb9\u754c\uff1a${context.industry.boundaries}`);
      if (context.industry.painPoints.length > 0) lines.push(`- \u5e38\u89c1\u75db\u70b9\uff1a${context.industry.painPoints.join("\u3001")}`);
      if (context.industry.commonQuestions.length > 0) lines.push(`- \u5e38\u89c1\u95ee\u9898\uff1a${context.industry.commonQuestions.join("\u3001")}`);
      if (context.industry.topicDirections.length > 0) lines.push(`- \u63a8\u8350\u65b9\u5411\uff1a${context.industry.topicDirections.join("\u3001")}`);
      if (context.industry.forbiddenTerms.length > 0) lines.push(`- \u7981\u7528\u8bcd\uff1a${context.industry.forbiddenTerms.join("\u3001")}`);
    }

    if (context.brief) {
      lines.push("");
      lines.push("\u5f53\u524d\u4efb\u52a1\u5355\uff1a");
      lines.push(`- \u6807\u9898\uff1a${context.brief.title}`);
      lines.push(`- \u76ee\u6807\uff1a${context.brief.objective}`);
      lines.push(`- \u8bed\u6c14\uff1a${context.brief.tone}`);
      lines.push(`- \u6838\u5fc3\u8868\u8fbe\uff1a${context.brief.keyMessage}`);
      if (context.brief.targetAudience) lines.push(`- \u76ee\u6807\u53d7\u4f17\uff1a${context.brief.targetAudience}`);
      if (context.brief.callToAction) lines.push(`- CTA\uff1a${context.brief.callToAction}`);
      if (context.brief.constraints.length > 0) lines.push(`- \u7ea6\u675f\u6761\u4ef6\uff1a${context.brief.constraints.join("\u3001")}`);
    }

    return lines.join("\n");
  }
}
