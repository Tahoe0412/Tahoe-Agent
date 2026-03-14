import { z } from "zod";

export const briefStatusSchema = z.enum(["DRAFT", "ACTIVE", "APPROVED", "ARCHIVED"]);
export const briefObjectiveSchema = z.enum(["AWARENESS", "CONSIDERATION", "CONVERSION", "RETENTION", "LAUNCH"]);
export const briefToneSchema = z.enum(["PREMIUM", "DIRECT", "PLAYFUL", "TECHNICAL", "HUMAN", "CINEMATIC"]);
export const audienceAwarenessSchema = z.enum(["COLD", "WARM", "HOT"]);
export const constraintTypeSchema = z.enum(["BRAND", "PLATFORM", "AUDIENCE", "STYLE", "LEGAL", "DELIVERY"]);
export const approvalStageSchema = z.enum(["BRIEF", "RESEARCH", "SCRIPT", "STORYBOARD", "ASSET_PLAN", "RENDER", "DELIVERY"]);
export const approvalStatusSchema = z.enum(["PENDING", "APPROVED", "CHANGES_REQUESTED", "REJECTED"]);
export const storyboardStatusSchema = z.enum(["DRAFT", "ACTIVE", "APPROVED", "ARCHIVED"]);
export const frameStatusSchema = z.enum(["DRAFT", "READY", "LOCKED", "OMITTED"]);
export const frameReferenceTypeSchema = z.enum(["STYLE", "CHARACTER", "PRODUCT", "ENVIRONMENT", "COMPOSITION", "PROP", "WARDROBE"]);
export const renderJobTypeSchema = z.enum(["IMAGE", "VIDEO", "VOICE", "MUSIC", "PACKAGE"]);
export const renderProviderSchema = z.enum(["COMFYUI", "RUNWAY", "KLING", "LUMA", "ELEVENLABS", "CUSTOM"]);
export const renderJobStatusSchema = z.enum(["DRAFT", "QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELED"]);
export const sceneProductionClassSchema = z.enum(["A", "B", "C", "D", "E", "F", "G", "T"]);
export const brandStageSchema = z.enum(["COLD_START", "VALIDATION", "SCALE"]);
export const contentPillarTypeSchema = z.enum([
  "EDUCATION",
  "BRAND_STORY",
  "PRODUCT_VALUE",
  "USE_CASE",
  "TRUST_SIGNAL",
  "FOUNDER_IP",
  "USER_TESTIMONIAL",
  "TREND_REACTION",
]);
export const platformSurfaceSchema = z.enum([
  "XIAOHONGSHU_POST",
  "XIAOHONGSHU_VIDEO",
  "DOUYIN_VIDEO",
  "DOUYIN_TITLE",
  "COMMENT_REPLY",
  "COVER_COPY",
]);
export const adaptationStatusSchema = z.enum(["DRAFT", "READY", "APPROVED", "ARCHIVED"]);
export const complianceCheckStatusSchema = z.enum(["PENDING", "PASSED", "NEEDS_REVIEW", "BLOCKED"]);
export const sprintStatusSchema = z.enum(["PLANNED", "ACTIVE", "CLOSED", "ARCHIVED"]);
export const strategyTaskTypeSchema = z.enum(["RESEARCH", "TOPIC_PLAN", "SCRIPT", "ADAPTATION", "COMPLIANCE", "REVIEW"]);
export const strategyTaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]);
export const competitorTierSchema = z.enum(["DIRECT", "ASPIRATIONAL", "CATEGORY_LEADER"]);

export const briefConstraintInputSchema = z.object({
  constraint_type: constraintTypeSchema,
  constraint_code: z.string().min(2).max(80),
  constraint_label: z.string().min(2).max(120),
  constraint_value: z.string().max(300).optional(),
  is_hard_constraint: z.boolean().default(true),
  metadata_json: z.record(z.string(), z.unknown()).optional(),
});

export const creativeBriefCreateSchema = z.object({
  title: z.string().min(3).max(120),
  campaign_name: z.string().max(120).optional(),
  objective: briefObjectiveSchema,
  primary_tone: briefToneSchema,
  audience_awareness: audienceAwarenessSchema.optional(),
  target_platforms: z.array(z.enum(["YOUTUBE", "X", "TIKTOK", "XHS", "DOUYIN"])).min(1).max(5),
  key_message: z.string().min(10).max(4000),
  call_to_action: z.string().max(240).optional(),
  target_audience: z.string().max(240).optional(),
  duration_target_sec: z.number().int().min(3).max(600).optional(),
  language_code: z.string().min(2).max(16).optional(),
  brief_json: z.record(z.string(), z.unknown()).optional(),
  constraints: z.array(briefConstraintInputSchema).max(32).default([]),
});

export const approvalGateUpsertSchema = z.object({
  stage: approvalStageSchema,
  approval_status: approvalStatusSchema,
  target_version: z.number().int().min(1).default(1),
  reviewer_label: z.string().max(120).optional(),
  decision_summary: z.string().max(4000).optional(),
  decision_json: z.record(z.string(), z.unknown()).optional(),
});

export const storyboardFrameInputSchema = z.object({
  script_scene_id: z.string().cuid().optional(),
  frame_order: z.number().int().min(1),
  frame_status: frameStatusSchema.default("DRAFT"),
  continuity_group: z.string().max(120).optional(),
  frame_title: z.string().min(2).max(160),
  composition_notes: z.string().max(2000).optional(),
  camera_plan: z.string().max(500).optional(),
  motion_plan: z.string().max(500).optional(),
  narration_text: z.string().max(2000).optional(),
  on_screen_text: z.string().max(1000).optional(),
  visual_prompt: z.string().min(10).max(6000),
  negative_prompt: z.string().max(3000).optional(),
  reference_strategy: z.record(z.string(), z.unknown()).optional(),
  duration_sec: z.number().int().min(1).max(120).optional(),
  production_class: sceneProductionClassSchema.optional(),
});

export const storyboardCreateSchema = z.object({
  source_brief_id: z.string().cuid().optional(),
  script_id: z.string().cuid().optional(),
  title: z.string().min(3).max(160),
  goal_summary: z.string().max(2000).optional(),
  style_direction: z.string().max(1000).optional(),
  aspect_ratio: z.string().min(3).max(20).default("9:16"),
  structured_output: z.record(z.string(), z.unknown()).optional(),
  frames: z.array(storyboardFrameInputSchema).max(120).default([]),
});

export const frameReferenceCreateSchema = z.object({
  storyboard_frame_id: z.string().cuid(),
  reference_type: frameReferenceTypeSchema,
  source_label: z.string().max(120).optional(),
  file_name: z.string().max(255).optional(),
  file_url: z.string().url().optional(),
  metadata_json: z.record(z.string(), z.unknown()).optional(),
});

export const renderJobCreateSchema = z.object({
  storyboard_id: z.string().cuid().optional(),
  storyboard_frame_id: z.string().cuid().optional(),
  script_scene_id: z.string().cuid().optional(),
  job_type: renderJobTypeSchema,
  provider: renderProviderSchema,
  provider_model: z.string().max(160).optional(),
  input_json: z.record(z.string(), z.unknown()).default({}),
  job_status: renderJobStatusSchema.optional(),
});

export const brandProfileCreateSchema = z.object({
  brand_name: z.string().min(2).max(120),
  brand_positioning: z.string().min(6).max(2000),
  core_belief: z.string().max(2000).optional(),
  product_lines: z.array(z.string().min(1).max(120)).max(40).default([]),
  target_personas: z.array(z.string().min(1).max(200)).max(24).default([]),
  platform_priority: z.array(platformSurfaceSchema).min(1).max(6),
  forbidden_phrases: z.array(z.string().min(1).max(120)).max(40).default([]),
  compliance_notes: z.string().max(4000).optional(),
  brand_voice: z.string().max(2000).optional(),
  brand_stage: brandStageSchema.default("COLD_START"),
  metadata_json: z.record(z.string(), z.unknown()).optional(),
});

export const industryTemplateCreateSchema = z.object({
  industry_name: z.string().min(2).max(120),
  industry_keywords: z.array(z.string().min(1).max(80)).max(40).default([]),
  competitor_keywords: z.array(z.string().min(1).max(80)).max(40).default([]),
  expression_boundaries: z.string().max(3000).optional(),
  forbidden_terms: z.array(z.string().min(1).max(80)).max(60).default([]),
  platform_content_priorities: z.array(platformSurfaceSchema).min(1).max(6),
  common_pain_points: z.array(z.string().min(1).max(200)).max(40).default([]),
  common_questions: z.array(z.string().min(1).max(200)).max(40).default([]),
  recommended_content_pillars: z.array(z.string().min(1).max(120)).max(20).default([]),
  recommended_topic_directions: z.array(z.string().min(1).max(200)).max(40).default([]),
  template_notes: z.string().max(3000).optional(),
  metadata_json: z.record(z.string(), z.unknown()).optional(),
});

export const competitorProfileInputSchema = z.object({
  competitor_name: z.string().min(2).max(120),
  competitor_tier: competitorTierSchema,
  keywords: z.array(z.string().min(1).max(80)).max(24).default([]),
  primary_platforms: z.array(platformSurfaceSchema).min(1).max(6),
  messaging_angles: z.array(z.string().min(1).max(200)).max(20).default([]),
  notes_text: z.string().max(2000).optional(),
});

export const contentPillarCreateSchema = z.object({
  brand_profile_id: z.string().cuid(),
  pillar_name: z.string().min(2).max(120),
  pillar_type: contentPillarTypeSchema,
  pillar_summary: z.string().max(2000).optional(),
  topic_directions: z.array(z.string().min(1).max(200)).max(30).default([]),
  platform_fit: z.array(platformSurfaceSchema).max(6).default([]),
  priority_score: z.number().int().min(0).max(100).default(50),
  active: z.boolean().default(true),
});

export const campaignSprintCreateSchema = z.object({
  brand_profile_id: z.string().cuid().optional(),
  sprint_name: z.string().min(2).max(120),
  sprint_goal: z.string().max(2000).optional(),
  sprint_status: sprintStatusSchema.default("PLANNED"),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  objective_json: z.record(z.string(), z.unknown()).optional(),
  content_strategy_json: z.record(z.string(), z.unknown()).optional(),
});

export const strategyTaskCreateSchema = z.object({
  brand_profile_id: z.string().cuid().optional(),
  campaign_sprint_id: z.string().cuid().optional(),
  content_pillar_id: z.string().cuid().optional(),
  task_type: strategyTaskTypeSchema,
  task_status: strategyTaskStatusSchema.default("TODO"),
  task_title: z.string().min(2).max(160),
  task_summary: z.string().max(3000).optional(),
  priority_score: z.number().int().min(0).max(100).default(50),
  owner_label: z.string().max(120).optional(),
  due_at: z.string().datetime().optional(),
  task_json: z.record(z.string(), z.unknown()).optional(),
});

export const platformAdaptationCreateSchema = z.object({
  brand_profile_id: z.string().cuid().optional(),
  campaign_sprint_id: z.string().cuid().optional(),
  content_pillar_id: z.string().cuid().optional(),
  script_id: z.string().cuid().optional(),
  script_scene_id: z.string().cuid().optional(),
  source_message: z.string().min(6).max(4000),
  platform_surface: platformSurfaceSchema,
  adaptation_status: adaptationStatusSchema.default("DRAFT"),
  title_text: z.string().max(240).optional(),
  body_text: z.string().min(6).max(8000).optional(),
  hook_text: z.string().max(400).optional(),
  cover_copy: z.string().max(240).optional(),
  interaction_prompt: z.string().max(1000).optional(),
  structured_output: z.record(z.string(), z.unknown()).default({}),
  auto_generate: z.boolean().default(false),
});

export const platformAdaptationOutputSchema = z.object({
  title_text: z.string().max(240).optional(),
  body_text: z.string().min(6).max(8000),
  hook_text: z.string().max(400).optional(),
  cover_copy: z.string().max(240).optional(),
  interaction_prompt: z.string().max(1000).optional(),
  adaptation_notes: z.array(z.string().min(1).max(200)).max(12).default([]),
});

export const complianceCheckCreateSchema = z.object({
  brand_profile_id: z.string().cuid().optional(),
  campaign_sprint_id: z.string().cuid().optional(),
  platform_adaptation_id: z.string().cuid().optional(),
  target_type: z.string().min(2).max(80),
  target_id: z.string().min(2).max(80),
  check_status: complianceCheckStatusSchema.default("PENDING"),
  flagged_issues: z.array(z.string().min(1).max(200)).max(40).default([]),
  sensitive_hits: z.array(z.string().min(1).max(80)).max(40).default([]),
  risk_summary: z.string().max(3000).optional(),
  needs_human_review: z.boolean().default(false),
});

export const optimizationReviewCreateSchema = z.object({
  brand_profile_id: z.string().cuid().optional(),
  campaign_sprint_id: z.string().cuid().optional(),
  content_pillar_id: z.string().cuid().optional(),
  review_title: z.string().min(2).max(160),
  content_theme: z.string().min(2).max(160),
  content_type: z.string().min(2).max(120),
  platform_surface: platformSurfaceSchema,
  headline_text: z.string().max(240).optional(),
  opening_style: z.string().max(240).optional(),
  core_selling_points: z.array(z.string().min(1).max(200)).max(20).default([]),
  metric_json: z.record(z.string(), z.unknown()).default({}),
  optimization_summary: z.string().max(4000).optional(),
  next_recommendations: z.array(z.string().min(1).max(200)).max(20).default([]),
});

export type CreativeBriefCreateInput = z.infer<typeof creativeBriefCreateSchema>;
export type ApprovalGateUpsertInput = z.infer<typeof approvalGateUpsertSchema>;
export type StoryboardCreateInput = z.infer<typeof storyboardCreateSchema>;
export type StoryboardFrameInput = z.infer<typeof storyboardFrameInputSchema>;
export type FrameReferenceCreateInput = z.infer<typeof frameReferenceCreateSchema>;
export type RenderJobCreateInput = z.infer<typeof renderJobCreateSchema>;
export type BrandProfileCreateInput = z.infer<typeof brandProfileCreateSchema>;
export type IndustryTemplateCreateInput = z.infer<typeof industryTemplateCreateSchema>;
export type CompetitorProfileInput = z.infer<typeof competitorProfileInputSchema>;
export type ContentPillarCreateInput = z.infer<typeof contentPillarCreateSchema>;
export type CampaignSprintCreateInput = z.infer<typeof campaignSprintCreateSchema>;
export type StrategyTaskCreateInput = z.infer<typeof strategyTaskCreateSchema>;
export type PlatformAdaptationCreateInput = z.infer<typeof platformAdaptationCreateSchema>;
export type PlatformAdaptationOutput = z.infer<typeof platformAdaptationOutputSchema>;
export type ComplianceCheckCreateInput = z.infer<typeof complianceCheckCreateSchema>;
export type OptimizationReviewCreateInput = z.infer<typeof optimizationReviewCreateSchema>;
