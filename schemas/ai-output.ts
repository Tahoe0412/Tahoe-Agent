import { z } from "zod";

export const platformEnum = z.enum(["YOUTUBE", "X", "TIKTOK", "XHS", "DOUYIN"]);
export const contentTypeEnum = z.enum(["SHORT_VIDEO", "LONG_VIDEO", "THREAD", "POST", "ARTICLE", "LIVE_STREAM"]);
export const topicCategoryEnum = z.enum([
  "CREATIVE_FORMAT",
  "NARRATIVE_PATTERN",
  "VISUAL_STYLE",
  "AUDIENCE_SIGNAL",
  "PLATFORM_SIGNAL",
  "COMMERCIAL_ANGLE",
]);
export const trendStageEnum = z.enum(["EMERGING", "GROWING", "PEAK", "STABLE", "DECLINING"]);
export const evidenceTypeEnum = z.enum(["CONTENT", "CREATOR", "SEARCH_RESULT", "NEWS", "PLATFORM_FEED"]);
export const signalMetricEnum = z.enum([
  "VIEW_COUNT",
  "LIKE_COUNT",
  "COMMENT_COUNT",
  "SHARE_COUNT",
  "ENGAGEMENT_RATE",
  "GROWTH_RATE",
  "SEARCH_VOLUME",
]);
export const storyStructureEnum = z.enum([
  "PROBLEM_SOLUTION",
  "PAS",
  "BEFORE_AFTER_BRIDGE",
  "LISTICLE",
  "CASE_STUDY",
]);
export const shotTypeEnum = z.enum([
  "TALKING_HEAD",
  "VOICEOVER_BROLL",
  "SCREENCAST",
  "DEMO",
  "MOTION_GRAPHIC",
  "CINEMATIC",
]);
export const productionClassEnum = z.enum(["UGC", "STUDIO", "SCREEN_CAPTURE", "HYBRID", "ANIMATION"]);
export const subjectPresenceEnum = z.enum(["HUMAN", "NON_HUMAN", "NONE"]);
export const motionLevelEnum = z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]);
export const dialogueModeEnum = z.enum(["SPOKEN", "ON_SCREEN_TEXT", "VOICEOVER", "NONE"]);
export const cameraModeEnum = z.enum(["STATIC", "PAN", "TILT", "TRACKING", "ZOOM", "SCREEN_CAPTURE"]);
export const assetTypeEnum = z.enum([
  "CHARACTER_BASE",
  "SCENE_BASE",
  "CHARACTER_SCENE_COMPOSITE",
  "PRODUCT_UI",
  "PROP",
  "BROLL",
  "VOICEOVER",
  "MUSIC",
  "SFX",
  "SUBTITLE",
]);
export const assetSourceEnum = z.enum(["GENERATED", "STOCK", "SCREEN_CAPTURE", "UPLOADED", "SYNTHETIC"]);
export const dependencyLevelEnum = z.enum(["REQUIRED", "OPTIONAL"]);
export const reportTypeEnum = z.enum(["TREND_RESEARCH", "SCRIPT_PLAN", "SHOT_PLAN", "FINAL_RESEARCH"]);
export const creatorTierEnum = z.enum(["HEAD", "GROWTH", "EMERGING"]);

const isoDatetime = z.string().datetime();

export const trendTopicOutputSchema = z.object({
  platform_scope: z.array(platformEnum).min(1),
  topics: z.array(
    z.object({
      topic_key: z.string().min(3).max(80).regex(/^[a-z0-9_]+$/),
      topic_label: z.string().min(2).max(80),
      topic_category: topicCategoryEnum,
      trend_stage: trendStageEnum,
      platform_priority: platformEnum.optional(),
      production_class: productionClassEnum.optional(),
      momentum_score: z.number().int().min(0).max(100),
      evidence_count: z.number().int().min(1).max(1000),
      keyword_set: z.array(z.string().min(1).max(32)).min(1).max(10),
      evidence_chain: z.array(
        z.object({
          evidence_key: z.string().min(3).max(80).regex(/^[a-z0-9_:-]+$/),
          platform: platformEnum,
          evidence_type: evidenceTypeEnum,
          content_type: contentTypeEnum.optional(),
          creator_handle: z.string().min(1).max(64).optional(),
          signal_metric: signalMetricEnum,
          signal_value: z.number(),
          signal_delta: z.number().optional(),
          source_url: z.string().url().optional(),
          published_at: isoDatetime.optional(),
        }),
      ).min(1).max(20),
    }),
  ).min(1).max(20),
});

export const scriptLineSchema = z.object({
  line_index: z.number().int().min(1),
  line_role: z.enum(["HOOK", "SETUP", "PROOF", "PAYOFF", "CTA"]),
  text: z.string().min(1).max(500),
});

export const scriptShotBreakdownOutputSchema = z.object({
  version_number: z.number().int().min(1),
  source_type: z.enum(["AI_REWRITE"]),
  language_code: z.string().min(2).max(16),
  story_structure: storyStructureEnum,
  total_duration_seconds: z.number().int().min(5).max(600),
  script_lines: z.array(scriptLineSchema).min(1).max(50),
  shots: z.array(
    z.object({
      shot_index: z.number().int().min(1).max(200),
      shot_name: z.string().min(1).max(80),
      shot_type: shotTypeEnum,
      production_class: productionClassEnum,
      platform: platformEnum,
      duration_seconds: z.number().int().min(1).max(120),
      line_index_refs: z.array(z.number().int().min(1)).min(1).max(10),
    }),
  ).min(1).max(200),
});

export const shotClassificationItemSchema = z.object({
  shot_index: z.number().int().min(1),
  shot_type: shotTypeEnum,
  production_class: productionClassEnum,
  subject_presence: subjectPresenceEnum,
  motion_level: motionLevelEnum,
  dialogue_mode: dialogueModeEnum,
  camera_mode: cameraModeEnum,
  duration_seconds: z.number().int().min(1).max(120),
});

export const shotClassificationOutputSchema = z.object({
  classifications: z.array(shotClassificationItemSchema).min(1).max(200),
});

export const assetDependencyItemSchema = z.object({
  asset_key: z.string().min(3).max(80).regex(/^[a-z0-9_]+$/),
  asset_type: assetTypeEnum,
  asset_source: assetSourceEnum,
  dependency_level: dependencyLevelEnum,
  production_class: productionClassEnum,
  quantity: z.number().int().min(1).max(20),
  prompt_json: z
    .object({
      subject_tags: z.array(z.string().min(1).max(32)).max(10).default([]),
      style_tags: z.array(z.string().min(1).max(32)).max(10).default([]),
      constraint_tags: z.array(z.string().min(1).max(32)).max(10).default([]),
    })
    .optional(),
});

export const assetDependencyOutputSchema = z.object({
  shot_assets: z.array(
    z.object({
      shot_index: z.number().int().min(1),
      assets: z.array(assetDependencyItemSchema).min(1).max(20),
    }),
  ).min(1).max(200),
});

export const finalResearchReportOutputSchema = z.object({
  report_type: z.literal("FINAL_RESEARCH"),
  primary_platform: platformEnum,
  creator_summary: z.object({
    creator_count: z.number().int().min(0),
    top_creator_tiers: z.array(creatorTierEnum).min(1).max(3),
  }),
  content_summary: z.object({
    content_count: z.number().int().min(0),
    top_content_types: z.array(contentTypeEnum).min(1).max(4),
  }),
  trend_summary: z.object({
    topic_keys: z.array(z.string().min(3).max(80)).min(1).max(20),
    top_topic_key: z.string().min(3).max(80),
  }),
  script_summary: z.object({
    version_number: z.number().int().min(1),
    story_structure: storyStructureEnum,
    shot_count: z.number().int().min(0).max(200),
  }),
  production_summary: z.object({
    production_classes: z.array(productionClassEnum).min(1).max(5),
    required_asset_types: z.array(assetTypeEnum).min(1).max(10),
  }),
  report_json: z.object({
    recommendation_codes: z.array(
      z.enum([
        "RESULT_FIRST_HOOK",
        "FAST_PACING",
        "SOCIAL_PROOF",
        "UGC_TONE",
        "SCREEN_PROOF",
        "BROLL_SUPPORT",
      ]),
    ).min(1).max(10),
    risk_codes: z.array(
      z.enum([
        "HOOK_TOO_WEAK",
        "TOO_MUCH_TEXT",
        "LOW_VISUAL_VARIETY",
        "MISSING_PROOF",
        "ASSET_GAP",
      ]),
    ).max(10),
  }),
});

export type TrendTopicOutput = z.infer<typeof trendTopicOutputSchema>;
export type ScriptShotBreakdownOutput = z.infer<typeof scriptShotBreakdownOutputSchema>;
export type ShotClassificationOutput = z.infer<typeof shotClassificationOutputSchema>;
export type AssetDependencyOutput = z.infer<typeof assetDependencyOutputSchema>;
export type FinalResearchReportOutput = z.infer<typeof finalResearchReportOutputSchema>;
