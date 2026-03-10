import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { complianceCheckOutputSchema, complianceRunInputSchema, type ComplianceCheckOutput } from "@/schemas/compliance-check";
import { AppSettingsService } from "@/services/app-settings.service";
import { MarketingContextService } from "@/services/marketing-context.service";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const DEFAULT_SENSITIVE_WORDS = ["最强", "顶级", "国家级", "包过", "稳赚", "唯一", "根治", "治愈"];
const EXAGGERATED_PATTERNS = [/100%/i, /绝对/, /立刻/, /马上见效/, /永久/, /完全/];
const EFFECT_PROMISE_PATTERNS = [/改善.{0,8}症状/, /治疗/, /治愈/, /降三高/, /瘦身/, /祛痘/, /逆龄/, /抗癌/];

const complianceReviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    check_status: { type: "string", enum: ["PASSED", "NEEDS_REVIEW", "BLOCKED"] },
    flagged_issues: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: { type: "string", enum: ["SENSITIVE_WORD", "EXAGGERATED_CLAIM", "EFFECT_PROMISE", "MISSING_DISCLOSURE", "RISK_BOUNDARY"] },
          text: { type: "string" },
          reason: { type: "string" },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        },
        required: ["type", "text", "reason", "severity"],
      },
    },
    sensitive_hits: {
      type: "array",
      items: { type: "string" },
      maxItems: 20,
    },
    risk_summary: { type: "string" },
    needs_human_review: { type: "boolean" },
  },
  required: ["check_status", "flagged_issues", "sensitive_hits", "risk_summary", "needs_human_review"],
} as const;

export class ComplianceCheckService {
  private readonly settingsService = new AppSettingsService();
  private readonly marketingContextService = new MarketingContextService();

  private buildRuleResult(content: string, forbiddenTerms: string[], forbiddenPhrases: string[]): ComplianceCheckOutput {
    const issues: ComplianceCheckOutput["flagged_issues"] = [];
    const sensitiveHits = [...DEFAULT_SENSITIVE_WORDS, ...forbiddenTerms].filter((word) => content.includes(word));

    for (const hit of sensitiveHits) {
      issues.push({
        type: "SENSITIVE_WORD",
        text: hit,
        reason: "命中了敏感词或风险词，需要改写或人工复核。",
        severity: forbiddenTerms.includes(hit) ? "HIGH" : "MEDIUM",
      });
    }

    for (const phrase of forbiddenPhrases.filter((item) => content.includes(item))) {
      issues.push({
        type: "RISK_BOUNDARY",
        text: phrase,
        reason: "命中了品牌禁用表达，不能直接用于发布。",
        severity: "HIGH",
      });
    }

    for (const pattern of EXAGGERATED_PATTERNS) {
      const matched = content.match(pattern);
      if (matched?.[0]) {
        issues.push({
          type: "EXAGGERATED_CLAIM",
          text: matched[0],
          reason: "存在夸张或绝对化表达，容易引发平台或合规风险。",
          severity: "MEDIUM",
        });
      }
    }

    for (const pattern of EFFECT_PROMISE_PATTERNS) {
      const matched = content.match(pattern);
      if (matched?.[0]) {
        issues.push({
          type: "EFFECT_PROMISE",
          text: matched[0],
          reason: "存在疑似功效承诺或医疗化表达，需要谨慎处理。",
          severity: "HIGH",
        });
      }
    }

    const uniqueIssues = issues.filter(
      (item, index, array) => array.findIndex((candidate) => candidate.type === item.type && candidate.text === item.text) === index,
    );
    const highCount = uniqueIssues.filter((item) => item.severity === "HIGH").length;

    return {
      check_status: highCount > 0 ? "BLOCKED" : uniqueIssues.length > 0 ? "NEEDS_REVIEW" : "PASSED",
      flagged_issues: uniqueIssues.slice(0, 40),
      sensitive_hits: [...new Set(sensitiveHits)].slice(0, 40),
      risk_summary:
        uniqueIssues.length > 0
          ? `本轮共命中 ${uniqueIssues.length} 项风险提示，其中高风险 ${highCount} 项。建议先改写再发布。`
          : "规则检测未发现明显风险，可进入人工快速复核或直接发布前检查。",
      needs_human_review: uniqueIssues.length > 0,
    };
  }

  async run(projectId: string, input: unknown) {
    const payload = complianceRunInputSchema.parse(input);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand_profile: true,
        industry_template: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    const adaptation = payload.platform_adaptation_id
      ? await prisma.platformAdaptation.findUnique({
          where: { id: payload.platform_adaptation_id },
        })
      : null;
    const contentText = payload.content_text ?? adaptation?.body_text;

    if (!contentText) {
      throw new Error("缺少待检查的正文内容。");
    }

    const forbiddenTerms = ((project.industry_template?.forbidden_terms as string[] | null) ?? []).filter(Boolean);
    const forbiddenPhrases = ((project.brand_profile?.forbidden_phrases as string[] | null) ?? []).filter(Boolean);
    const ruleResult = this.buildRuleResult(contentText, forbiddenTerms, forbiddenPhrases);

    let finalResult = ruleResult;
    const settings = await this.settingsService.getEffectiveSettings();
    if (canUseModelRoute("MARKETING_ANALYSIS", settings)) {
      const context = await this.marketingContextService.getProjectContext(projectId);
      const contextPrompt = this.marketingContextService.formatPromptContext(context);
      try {
        const reviewed = await generateStructuredJson({
          routeKey: "MARKETING_ANALYSIS",
          schemaName: "compliance_check_output",
          schema: complianceReviewJsonSchema,
          zodSchema: complianceCheckOutputSchema,
          systemPrompt: "You are a marketing compliance reviewer. Review promotional copy and return only valid JSON.",
          userPrompt: [
            "Review the following content for publishing risk.",
            "Prioritize: sensitive words, exaggerated claims, effect promises, forbidden phrases, and industry risk boundaries.",
            "If the content appears risky, keep the result conservative.",
            "",
            `Marketing Context:\n${contextPrompt}`,
            "",
            `Rule Findings:\n${JSON.stringify(ruleResult)}`,
            "",
            `Title:\n${payload.title_text ?? adaptation?.title_text ?? ""}`,
            "",
            `Body:\n${contentText}`,
          ].join("\n"),
        });
        finalResult = {
          ...reviewed,
          sensitive_hits: reviewed.sensitive_hits ?? [],
        };
      } catch {
        finalResult = ruleResult;
      }
    }

    return prisma.complianceCheck.create({
      data: {
        project_id: projectId,
        brand_profile_id: payload.brand_profile_id ?? project.brand_profile_id,
        campaign_sprint_id: payload.campaign_sprint_id,
        platform_adaptation_id: payload.platform_adaptation_id,
        target_type: payload.target_type,
        target_id: payload.target_id,
        check_status: finalResult.check_status,
        flagged_issues_json: toJson(finalResult.flagged_issues),
        sensitive_hits_json: toJson(finalResult.sensitive_hits),
        risk_summary: finalResult.risk_summary,
        needs_human_review: finalResult.needs_human_review,
        raw_payload: toJson({
          rule_result: ruleResult,
          title_text: payload.title_text ?? adaptation?.title_text ?? null,
          body_text: contentText,
          platform_surface: payload.platform_surface ?? adaptation?.platform_surface ?? null,
        }),
      },
    });
  }
}
