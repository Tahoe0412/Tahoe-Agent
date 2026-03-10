import { z } from "zod";

export const complianceIssueSchema = z.object({
  type: z.enum([
    "SENSITIVE_WORD",
    "EXAGGERATED_CLAIM",
    "EFFECT_PROMISE",
    "MISSING_DISCLOSURE",
    "RISK_BOUNDARY",
  ]),
  text: z.string().min(1).max(240),
  reason: z.string().min(1).max(400),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const complianceCheckOutputSchema = z.object({
  check_status: z.enum(["PASSED", "NEEDS_REVIEW", "BLOCKED"]),
  flagged_issues: z.array(complianceIssueSchema).max(40),
  sensitive_hits: z.array(z.string().min(1).max(80)).max(40).default([]),
  risk_summary: z.string().min(1).max(3000),
  needs_human_review: z.boolean(),
});

export const complianceRunInputSchema = z.object({
  brand_profile_id: z.string().cuid().optional(),
  campaign_sprint_id: z.string().cuid().optional(),
  platform_adaptation_id: z.string().cuid().optional(),
  target_type: z.string().min(2).max(80).default("PLATFORM_ADAPTATION"),
  target_id: z.string().min(2).max(80),
  content_text: z.string().min(4).max(12000).optional(),
  title_text: z.string().max(240).optional(),
  platform_surface: z.string().max(80).optional(),
});

export type ComplianceCheckOutput = z.infer<typeof complianceCheckOutputSchema>;
export type ComplianceRunInput = z.infer<typeof complianceRunInputSchema>;
