import { z } from "zod";
import { allOutputTypes, type OutputType } from "@/lib/content-line";

const platformSchema = z.enum(["YOUTUBE", "X", "TIKTOK", "XHS", "DOUYIN"]);
const workspaceModeSchema = z.enum(["SHORT_VIDEO", "COPYWRITING", "PROMOTION"]);
const outputTypeSchema = z.enum(allOutputTypes as [OutputType, ...OutputType[]]);
const writingModeSchema = z.enum(["BRAND_INTRO", "PRODUCT_PROMO", "CAMPAIGN_PROMO", "RECRUITMENT"]);
const styleTemplateSchema = z.enum(["RATIONAL_PRO", "WARM_HEALING", "LIGHT_LUXURY", "HIGH_CONVERSION", "FOUNDER_VOICE", "STORE_TRUST"]);
const copyLengthSchema = z.enum(["SHORT", "STANDARD", "LONG"]);
const usageScenarioSchema = z.enum(["XIAOHONGSHU_POST", "BRAND_LANDING", "PRODUCT_DETAIL", "CAMPAIGN_LAUNCH", "STORE_PROMOTION", "FOUNDER_IP"]);

export const projectCreateSchema = z.object({
  title: z.string().max(120).default(""),
  topic: z.string().min(3).max(200),
  sourceScript: z.string().max(20000).default(""),
  projectIntroduction: z.string().max(2000).optional(),
  coreIdea: z.string().max(500).optional(),
  styleReferenceSample: z.string().max(12000).optional(),
  writingMode: writingModeSchema.optional(),
  styleTemplate: styleTemplateSchema.optional(),
  copyLength: copyLengthSchema.optional(),
  usageScenario: usageScenarioSchema.optional(),
  platforms: z.array(platformSchema).min(1).max(3),
  workspaceMode: workspaceModeSchema.optional(),
  contentLine: z.enum(["MARS_CITIZEN", "MARKETING"]).optional(),
  outputType: outputTypeSchema.optional(),
  mockMode: z.boolean().optional(),
});

export const projectUpdateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  topic_query: z.string().min(3).max(200).optional(),
  raw_script_text: z.string().min(20).optional(),
  project_introduction: z.string().max(2000).optional(),
  core_idea: z.string().max(500).optional(),
  style_reference_sample: z.string().max(12000).optional(),
  writing_mode: writingModeSchema.optional(),
  style_template: styleTemplateSchema.optional(),
  copy_length: copyLengthSchema.optional(),
  usage_scenario: usageScenarioSchema.optional(),
  status: z.enum(["DRAFT", "RUNNING", "COMPLETED", "FAILED", "ARCHIVED"]).optional(),
  brand_profile_id: z.string().cuid().nullable().optional(),
  industry_template_id: z.string().cuid().nullable().optional(),
  project_tags: z.array(z.string().min(1).max(32)).max(12).optional(),
  content_line: z.enum(["MARS_CITIZEN", "MARKETING"]).optional(),
  output_type: outputTypeSchema.optional(),
  is_pinned: z.boolean().optional(),
  last_opened_at: z.string().optional(),
});

export const trendSignalSchema = z.object({
  title: z.string(),
  summary: z.string(),
  momentumScore: z.number().min(0).max(100),
  keywords: z.array(z.string()).min(1),
});

export const creatorInsightSchema = z.object({
  handle: z.string(),
  platform: platformSchema,
  displayName: z.string(),
  followerCount: z.number().int().nonnegative().optional(),
  averageViews: z.number().int().nonnegative().optional(),
  niche: z.string().optional(),
  angle: z.string(),
});

export const contentPatternSchema = z.object({
  title: z.string(),
  patternType: z.string(),
  summary: z.string(),
  evidence: z.array(z.string()).min(1),
});

export const rewrittenScriptSchema = z.object({
  hook: z.string(),
  beats: z.array(
    z.object({
      title: z.string(),
      objective: z.string(),
      script: z.string(),
    }),
  ),
  cta: z.string(),
});

export const shotPlanSchema = z.object({
  shotNumber: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  durationSeconds: z.number().int().positive(),
  characterType: z.enum(["HUMAN", "NON_HUMAN", "NONE"]),
  motionType: z.enum(["ACTION", "STATIC"]),
  dialogueType: z.enum(["DIALOGUE", "SILENT"]),
  requiredAssets: z.array(
    z.object({
      type: z.enum([
        "CHARACTER_BASE",
        "SCENE_BASE",
        "CHARACTER_SCENE_COMPOSITE",
        "PROP",
        "VOICE",
        "MUSIC",
        "SFX",
        "BROLL",
      ]),
      name: z.string(),
      promptHint: z.string(),
    }),
  ),
});

export const researchOutputSchema = z.object({
  trendResearch: z.array(trendSignalSchema),
  creators: z.array(creatorInsightSchema),
  contentPatterns: z.array(contentPatternSchema),
  rewrittenScript: rewrittenScriptSchema,
  shotPlans: z.array(shotPlanSchema),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ResearchOutput = z.infer<typeof researchOutputSchema>;
