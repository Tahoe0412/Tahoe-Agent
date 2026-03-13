-- RenameIndex
ALTER INDEX "scene_classifications_project_id_human_type_motion_type_li_idx" RENAME TO "scene_classifications_project_id_human_type_motion_type_lip_idx";

-- RenameIndex
ALTER INDEX "scene_classifications_project_id_production_class_difficulty_sc" RENAME TO "scene_classifications_project_id_production_class_difficult_idx";

-- RenameIndex
ALTER INDEX "scene_classifications_script_scene_id_classification_version_ke" RENAME TO "scene_classifications_script_scene_id_classification_versio_key";
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'X', 'TIKTOK');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('TREND_RESEARCH', 'CREATOR_DISCOVERY', 'CONTENT_DISCOVERY', 'SCRIPT_REWRITE', 'SHOT_BREAKDOWN', 'REPORT_GENERATION');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CreatorTier" AS ENUM ('HEAD', 'GROWTH', 'EMERGING');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SHORT_VIDEO', 'LONG_VIDEO', 'THREAD', 'POST', 'ARTICLE', 'LIVE_STREAM');

-- CreateEnum
CREATE TYPE "TopicCategory" AS ENUM ('CREATIVE_FORMAT', 'NARRATIVE_PATTERN', 'VISUAL_STYLE', 'AUDIENCE_SIGNAL', 'PLATFORM_SIGNAL', 'COMMERCIAL_ANGLE');

-- CreateEnum
CREATE TYPE "TrendStage" AS ENUM ('EMERGING', 'GROWING', 'PEAK', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('CONTENT', 'CREATOR', 'SEARCH_RESULT', 'NEWS', 'PLATFORM_FEED');

-- CreateEnum
CREATE TYPE "SignalMetric" AS ENUM ('VIEW_COUNT', 'LIKE_COUNT', 'COMMENT_COUNT', 'SHARE_COUNT', 'ENGAGEMENT_RATE', 'GROWTH_RATE', 'SEARCH_VOLUME');

-- CreateEnum
CREATE TYPE "ScriptSourceType" AS ENUM ('USER_INPUT', 'AI_REWRITE', 'HUMAN_EDIT');

-- CreateEnum
CREATE TYPE "ScriptStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StoryStructure" AS ENUM ('PROBLEM_SOLUTION', 'PAS', 'BEFORE_AFTER_BRIDGE', 'LISTICLE', 'CASE_STUDY');

-- CreateEnum
CREATE TYPE "ShotType" AS ENUM ('TALKING_HEAD', 'VOICEOVER_BROLL', 'SCREENCAST', 'DEMO', 'MOTION_GRAPHIC', 'CINEMATIC');

-- CreateEnum
CREATE TYPE "ProductionClass" AS ENUM ('UGC', 'STUDIO', 'SCREEN_CAPTURE', 'HYBRID', 'ANIMATION');

-- CreateEnum
CREATE TYPE "SubjectPresence" AS ENUM ('HUMAN', 'NON_HUMAN', 'NONE');

-- CreateEnum
CREATE TYPE "MotionLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'NONE');

-- CreateEnum
CREATE TYPE "DialogueMode" AS ENUM ('SPOKEN', 'ON_SCREEN_TEXT', 'VOICEOVER', 'NONE');

-- CreateEnum
CREATE TYPE "CameraMode" AS ENUM ('STATIC', 'PAN', 'TILT', 'TRACKING', 'ZOOM', 'SCREEN_CAPTURE');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('CHARACTER_BASE', 'SCENE_BASE', 'CHARACTER_SCENE_COMPOSITE', 'PRODUCT_UI', 'PROP', 'BROLL', 'VOICEOVER', 'MUSIC', 'SFX', 'SUBTITLE');

-- CreateEnum
CREATE TYPE "AssetSource" AS ENUM ('GENERATED', 'STOCK', 'SCREEN_CAPTURE', 'UPLOADED', 'SYNTHETIC');

-- CreateEnum
CREATE TYPE "DependencyLevel" AS ENUM ('REQUIRED', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PLANNED', 'READY', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TREND_RESEARCH', 'SCRIPT_PLAN', 'SHOT_PLAN', 'FINAL_RESEARCH');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic_query" TEXT NOT NULL,
    "primary_platform" "Platform",
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "source_language" TEXT NOT NULL DEFAULT 'zh-CN',
    "raw_script_text" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchTask" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "task_type" "TaskType" NOT NULL,
    "task_status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
    "platform" "Platform",
    "query_text" TEXT,
    "input_payload" JSONB,
    "raw_payload" JSONB,
    "error_code" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCreator" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "external_creator_id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "creator_tier" "CreatorTier" NOT NULL,
    "follower_count" INTEGER,
    "total_content_count" INTEGER,
    "average_view_count" INTEGER,
    "average_engagement_rate" DOUBLE PRECISION,
    "profile_url" TEXT,
    "avatar_url" TEXT,
    "country_code" TEXT,
    "language_code" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformContent" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "creator_id" TEXT,
    "platform" "Platform" NOT NULL,
    "external_content_id" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "normalized_title" TEXT,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "view_count" INTEGER,
    "like_count" INTEGER,
    "comment_count" INTEGER,
    "share_count" INTEGER,
    "save_count" INTEGER,
    "language_code" TEXT,
    "keyword_set" JSONB,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendTopic" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "research_task_id" TEXT,
    "topic_key" TEXT NOT NULL,
    "topic_label" TEXT NOT NULL,
    "topic_category" "TopicCategory" NOT NULL,
    "trend_stage" "TrendStage" NOT NULL,
    "production_class" "ProductionClass",
    "platform_priority" "Platform",
    "momentum_score" INTEGER NOT NULL,
    "evidence_count" INTEGER NOT NULL DEFAULT 0,
    "keyword_set" JSONB,
    "summary_json" JSONB,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendEvidence" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "trend_topic_id" TEXT NOT NULL,
    "content_id" TEXT,
    "creator_id" TEXT,
    "platform" "Platform" NOT NULL,
    "evidence_type" "EvidenceType" NOT NULL,
    "signal_metric" "SignalMetric" NOT NULL,
    "evidence_label" TEXT NOT NULL,
    "signal_value" DOUBLE PRECISION NOT NULL,
    "signal_delta" DOUBLE PRECISION,
    "source_url" TEXT,
    "published_at" TIMESTAMP(3),
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptVersion" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_by_task_id" TEXT,
    "source_type" "ScriptSourceType" NOT NULL,
    "script_status" "ScriptStatus" NOT NULL DEFAULT 'DRAFT',
    "version_number" INTEGER NOT NULL,
    "language_code" TEXT NOT NULL DEFAULT 'zh-CN',
    "story_structure" "StoryStructure",
    "content_text" TEXT NOT NULL,
    "structured_output" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shot" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "script_version_id" TEXT NOT NULL,
    "shot_index" INTEGER NOT NULL,
    "shot_name" TEXT NOT NULL,
    "shot_type" "ShotType" NOT NULL,
    "production_class" "ProductionClass" NOT NULL,
    "subject_presence" "SubjectPresence" NOT NULL,
    "motion_level" "MotionLevel" NOT NULL,
    "dialogue_mode" "DialogueMode" NOT NULL,
    "camera_mode" "CameraMode" NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "structured_output" JSONB NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShotAssetDependency" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "shot_id" TEXT NOT NULL,
    "asset_key" TEXT NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "asset_source" "AssetSource" NOT NULL,
    "dependency_level" "DependencyLevel" NOT NULL,
    "production_class" "ProductionClass" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "AssetStatus" NOT NULL DEFAULT 'PLANNED',
    "prompt_json" JSONB,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShotAssetDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchReport" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "generated_by_task_id" TEXT,
    "report_type" "ReportType" NOT NULL,
    "report_status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "input_snapshot" JSONB,
    "report_json" JSONB NOT NULL,
    "raw_payload" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_status_created_at_idx" ON "Project"("status", "created_at");

-- CreateIndex
CREATE INDEX "Project_primary_platform_created_at_idx" ON "Project"("primary_platform", "created_at");

-- CreateIndex
CREATE INDEX "ResearchTask_project_id_task_type_task_status_idx" ON "ResearchTask"("project_id", "task_type", "task_status");

-- CreateIndex
CREATE INDEX "ResearchTask_platform_task_status_idx" ON "ResearchTask"("platform", "task_status");

-- CreateIndex
CREATE INDEX "PlatformCreator_project_id_platform_creator_tier_idx" ON "PlatformCreator"("project_id", "platform", "creator_tier");

-- CreateIndex
CREATE INDEX "PlatformCreator_platform_follower_count_idx" ON "PlatformCreator"("platform", "follower_count");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCreator_project_id_platform_external_creator_id_key" ON "PlatformCreator"("project_id", "platform", "external_creator_id");

-- CreateIndex
CREATE INDEX "PlatformContent_project_id_platform_published_at_idx" ON "PlatformContent"("project_id", "platform", "published_at");

-- CreateIndex
CREATE INDEX "PlatformContent_creator_id_published_at_idx" ON "PlatformContent"("creator_id", "published_at");

-- CreateIndex
CREATE INDEX "PlatformContent_content_type_published_at_idx" ON "PlatformContent"("content_type", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformContent_project_id_platform_external_content_id_key" ON "PlatformContent"("project_id", "platform", "external_content_id");

-- CreateIndex
CREATE INDEX "TrendTopic_project_id_topic_category_trend_stage_idx" ON "TrendTopic"("project_id", "topic_category", "trend_stage");

-- CreateIndex
CREATE INDEX "TrendTopic_project_id_momentum_score_idx" ON "TrendTopic"("project_id", "momentum_score");

-- CreateIndex
CREATE UNIQUE INDEX "TrendTopic_project_id_topic_key_key" ON "TrendTopic"("project_id", "topic_key");

-- CreateIndex
CREATE INDEX "TrendEvidence_trend_topic_id_evidence_type_idx" ON "TrendEvidence"("trend_topic_id", "evidence_type");

-- CreateIndex
CREATE INDEX "TrendEvidence_content_id_idx" ON "TrendEvidence"("content_id");

-- CreateIndex
CREATE INDEX "TrendEvidence_creator_id_idx" ON "TrendEvidence"("creator_id");

-- CreateIndex
CREATE INDEX "TrendEvidence_platform_published_at_idx" ON "TrendEvidence"("platform", "published_at");

-- CreateIndex
CREATE INDEX "ScriptVersion_project_id_script_status_source_type_idx" ON "ScriptVersion"("project_id", "script_status", "source_type");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptVersion_project_id_version_number_key" ON "ScriptVersion"("project_id", "version_number");

-- CreateIndex
CREATE INDEX "Shot_project_id_production_class_shot_type_idx" ON "Shot"("project_id", "production_class", "shot_type");

-- CreateIndex
CREATE INDEX "Shot_project_id_subject_presence_motion_level_dialogue_mode_idx" ON "Shot"("project_id", "subject_presence", "motion_level", "dialogue_mode");

-- CreateIndex
CREATE UNIQUE INDEX "Shot_script_version_id_shot_index_key" ON "Shot"("script_version_id", "shot_index");

-- CreateIndex
CREATE INDEX "ShotAssetDependency_project_id_asset_type_status_idx" ON "ShotAssetDependency"("project_id", "asset_type", "status");

-- CreateIndex
CREATE INDEX "ShotAssetDependency_shot_id_dependency_level_idx" ON "ShotAssetDependency"("shot_id", "dependency_level");

-- CreateIndex
CREATE UNIQUE INDEX "ShotAssetDependency_shot_id_asset_key_key" ON "ShotAssetDependency"("shot_id", "asset_key");

-- CreateIndex
CREATE INDEX "ResearchReport_project_id_report_type_report_status_idx" ON "ResearchReport"("project_id", "report_type", "report_status");

-- CreateIndex
CREATE INDEX "ResearchReport_generated_at_idx" ON "ResearchReport"("generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchReport_project_id_report_type_version_number_key" ON "ResearchReport"("project_id", "report_type", "version_number");

-- AddForeignKey
ALTER TABLE "ResearchTask" ADD CONSTRAINT "ResearchTask_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCreator" ADD CONSTRAINT "PlatformCreator_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformContent" ADD CONSTRAINT "PlatformContent_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformContent" ADD CONSTRAINT "PlatformContent_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "PlatformCreator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendTopic" ADD CONSTRAINT "TrendTopic_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendTopic" ADD CONSTRAINT "TrendTopic_research_task_id_fkey" FOREIGN KEY ("research_task_id") REFERENCES "ResearchTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_trend_topic_id_fkey" FOREIGN KEY ("trend_topic_id") REFERENCES "TrendTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "PlatformContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "PlatformCreator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptVersion" ADD CONSTRAINT "ScriptVersion_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptVersion" ADD CONSTRAINT "ScriptVersion_created_by_task_id_fkey" FOREIGN KEY ("created_by_task_id") REFERENCES "ResearchTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_script_version_id_fkey" FOREIGN KEY ("script_version_id") REFERENCES "ScriptVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShotAssetDependency" ADD CONSTRAINT "ShotAssetDependency_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShotAssetDependency" ADD CONSTRAINT "ShotAssetDependency_shot_id_fkey" FOREIGN KEY ("shot_id") REFERENCES "Shot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchReport" ADD CONSTRAINT "ResearchReport_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchReport" ADD CONSTRAINT "ResearchReport_generated_by_task_id_fkey" FOREIGN KEY ("generated_by_task_id") REFERENCES "ResearchTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "HumanType" AS ENUM ('H0', 'H1');

-- CreateEnum
CREATE TYPE "MotionType" AS ENUM ('M0', 'M1', 'M2');

-- CreateEnum
CREATE TYPE "LipSyncType" AS ENUM ('L0', 'L1');

-- CreateEnum
CREATE TYPE "AssetDependencyType" AS ENUM ('S0', 'S1', 'S2', 'S3', 'S4');

-- CreateEnum
CREATE TYPE "SceneProductionClass" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'T');

-- CreateEnum
CREATE TYPE "SceneClassificationVersion" AS ENUM ('V1');

-- CreateTable
CREATE TABLE "scripts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "research_task_id" TEXT,
    "source_type" "ScriptSourceType" NOT NULL,
    "script_status" "ScriptStatus" NOT NULL DEFAULT 'DRAFT',
    "version_number" INTEGER NOT NULL,
    "title" TEXT,
    "original_text" TEXT NOT NULL,
    "rewritten_text" TEXT,
    "model_name" TEXT,
    "structured_output" JSONB NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_scenes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "script_id" TEXT NOT NULL,
    "scene_order" INTEGER NOT NULL,
    "original_text" TEXT NOT NULL,
    "rewritten_for_ai" TEXT NOT NULL,
    "shot_goal" TEXT NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "continuity_group" TEXT NOT NULL,
    "visual_priority" JSONB NOT NULL,
    "avoid" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_classifications" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "script_scene_id" TEXT NOT NULL,
    "classification_version" "SceneClassificationVersion" NOT NULL DEFAULT 'V1',
    "human_type" "HumanType" NOT NULL,
    "motion_type" "MotionType" NOT NULL,
    "lip_sync_type" "LipSyncType" NOT NULL,
    "asset_dependency_type" "AssetDependencyType" NOT NULL,
    "production_class" "SceneProductionClass" NOT NULL,
    "difficulty_score" INTEGER NOT NULL,
    "risk_flags" JSONB NOT NULL,
    "rule_based_output" JSONB,
    "llm_output" JSONB,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scripts_project_id_version_number_key" ON "scripts"("project_id", "version_number");

-- CreateIndex
CREATE INDEX "scripts_project_id_source_type_script_status_idx" ON "scripts"("project_id", "source_type", "script_status");

-- CreateIndex
CREATE UNIQUE INDEX "script_scenes_script_id_scene_order_key" ON "script_scenes"("script_id", "scene_order");

-- CreateIndex
CREATE INDEX "script_scenes_project_id_scene_order_idx" ON "script_scenes"("project_id", "scene_order");

-- CreateIndex
CREATE INDEX "script_scenes_project_id_continuity_group_idx" ON "script_scenes"("project_id", "continuity_group");

-- CreateIndex
CREATE UNIQUE INDEX "scene_classifications_script_scene_id_classification_version_key" ON "scene_classifications"("script_scene_id", "classification_version");

-- CreateIndex
CREATE INDEX "scene_classifications_project_id_production_class_difficulty_sc_idx" ON "scene_classifications"("project_id", "production_class", "difficulty_score");

-- CreateIndex
CREATE INDEX "scene_classifications_project_id_human_type_motion_type_li_idx" ON "scene_classifications"("project_id", "human_type", "motion_type", "lip_sync_type");

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_research_task_id_fkey" FOREIGN KEY ("research_task_id") REFERENCES "ResearchTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_scenes" ADD CONSTRAINT "script_scenes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_scenes" ADD CONSTRAINT "script_scenes_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "scripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_classifications" ADD CONSTRAINT "scene_classifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_classifications" ADD CONSTRAINT "scene_classifications_script_scene_id_fkey" FOREIGN KEY ("script_scene_id") REFERENCES "script_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('OPENAI', 'GEMINI');

-- CreateEnum
CREATE TYPE "SearchProvider" AS ENUM ('MOCK', 'TAVILY');

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "llm_provider" "LlmProvider" NOT NULL DEFAULT 'OPENAI',
    "llm_model" TEXT NOT NULL DEFAULT 'gpt-4.1-mini',
    "llm_mock_mode" BOOLEAN NOT NULL DEFAULT true,
    "openai_api_key" TEXT,
    "gemini_api_key" TEXT,
    "news_search_provider" "SearchProvider" NOT NULL DEFAULT 'MOCK',
    "news_search_mock_mode" BOOLEAN NOT NULL DEFAULT true,
    "tavily_api_key" TEXT,
    "app_base_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
-- CreateEnum
CREATE TYPE "RequiredAssetVersion" AS ENUM ('V1');

-- CreateEnum
CREATE TYPE "UploadedAssetType" AS ENUM ('CHARACTER_BASE', 'SCENE_BASE', 'CHARACTER_SCENE_COMPOSITE', 'VOICE', 'REFERENCE_IMAGE');

-- CreateTable
CREATE TABLE "required_assets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "script_scene_id" TEXT NOT NULL,
    "asset_version" "RequiredAssetVersion" NOT NULL DEFAULT 'V1',
    "needs_character_base" BOOLEAN NOT NULL DEFAULT false,
    "needs_scene_base" BOOLEAN NOT NULL DEFAULT false,
    "needs_character_scene_comp" BOOLEAN NOT NULL DEFAULT false,
    "needs_voice" BOOLEAN NOT NULL DEFAULT false,
    "needs_reference_images" BOOLEAN NOT NULL DEFAULT false,
    "missing_asset_hints" JSONB NOT NULL,
    "required_assets_json" JSONB NOT NULL,
    "is_asset_ready" BOOLEAN NOT NULL DEFAULT false,
    "rule_based_output" JSONB,
    "llm_output" JSONB,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "required_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_assets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "script_scene_id" TEXT,
    "asset_type" "UploadedAssetType" NOT NULL,
    "continuity_group" TEXT,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "mime_type" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "required_assets_script_scene_id_asset_version_key" ON "required_assets"("script_scene_id", "asset_version");

-- CreateIndex
CREATE INDEX "required_assets_project_id_is_asset_ready_idx" ON "required_assets"("project_id", "is_asset_ready");

-- CreateIndex
CREATE INDEX "uploaded_assets_project_id_asset_type_continuity_group_idx" ON "uploaded_assets"("project_id", "asset_type", "continuity_group");

-- AddForeignKey
ALTER TABLE "required_assets" ADD CONSTRAINT "required_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "required_assets" ADD CONSTRAINT "required_assets_script_scene_id_fkey" FOREIGN KEY ("script_scene_id") REFERENCES "script_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_assets" ADD CONSTRAINT "uploaded_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- CreateEnum
CREATE TYPE "BriefStatus" AS ENUM ('DRAFT', 'ACTIVE', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BriefObjective" AS ENUM ('AWARENESS', 'CONSIDERATION', 'CONVERSION', 'RETENTION', 'LAUNCH');

-- CreateEnum
CREATE TYPE "BriefTone" AS ENUM ('PREMIUM', 'DIRECT', 'PLAYFUL', 'TECHNICAL', 'HUMAN', 'CINEMATIC');

-- CreateEnum
CREATE TYPE "AudienceAwareness" AS ENUM ('COLD', 'WARM', 'HOT');

-- CreateEnum
CREATE TYPE "ConstraintType" AS ENUM ('BRAND', 'PLATFORM', 'AUDIENCE', 'STYLE', 'LEGAL', 'DELIVERY');

-- CreateEnum
CREATE TYPE "ApprovalStage" AS ENUM ('BRIEF', 'RESEARCH', 'SCRIPT', 'STORYBOARD', 'ASSET_PLAN', 'RENDER', 'DELIVERY');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StoryboardStatus" AS ENUM ('DRAFT', 'ACTIVE', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FrameStatus" AS ENUM ('DRAFT', 'READY', 'LOCKED', 'OMITTED');

-- CreateEnum
CREATE TYPE "FrameReferenceType" AS ENUM ('STYLE', 'CHARACTER', 'PRODUCT', 'ENVIRONMENT', 'COMPOSITION', 'PROP', 'WARDROBE');

-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('BRIEF', 'SCRIPT', 'SCENE', 'STORYBOARD', 'FRAME', 'RENDER_JOB', 'REPORT');

-- CreateEnum
CREATE TYPE "ReviewSeverity" AS ENUM ('INFO', 'WARNING', 'BLOCKER');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "RenderJobType" AS ENUM ('IMAGE', 'VIDEO', 'VOICE', 'MUSIC', 'PACKAGE');

-- CreateEnum
CREATE TYPE "RenderProvider" AS ENUM ('COMFYUI', 'RUNWAY', 'KLING', 'LUMA', 'ELEVENLABS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RenderJobStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RenderAssetType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'SUBTITLE', 'ARCHIVE', 'PREVIEW');

-- CreateTable
CREATE TABLE "creative_briefs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "brief_status" "BriefStatus" NOT NULL DEFAULT 'DRAFT',
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "campaign_name" TEXT,
    "objective" "BriefObjective" NOT NULL,
    "primary_tone" "BriefTone" NOT NULL,
    "audience_awareness" "AudienceAwareness",
    "target_platforms" JSONB NOT NULL,
    "key_message" TEXT NOT NULL,
    "call_to_action" TEXT,
    "target_audience" TEXT,
    "duration_target_sec" INTEGER,
    "language_code" TEXT NOT NULL DEFAULT 'zh-CN',
    "brief_json" JSONB NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brief_constraints" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "creative_brief_id" TEXT NOT NULL,
    "constraint_type" "ConstraintType" NOT NULL,
    "constraint_code" TEXT NOT NULL,
    "constraint_label" TEXT NOT NULL,
    "constraint_value" TEXT,
    "is_hard_constraint" BOOLEAN NOT NULL DEFAULT true,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brief_constraints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_gates" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "stage" "ApprovalStage" NOT NULL,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "target_version" INTEGER NOT NULL DEFAULT 1,
    "reviewer_label" TEXT,
    "decision_summary" TEXT,
    "decision_json" JSONB,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyboards" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "source_brief_id" TEXT,
    "script_id" TEXT,
    "storyboard_status" "StoryboardStatus" NOT NULL DEFAULT 'DRAFT',
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "goal_summary" TEXT,
    "style_direction" TEXT,
    "aspect_ratio" TEXT NOT NULL DEFAULT '9:16',
    "frame_count" INTEGER NOT NULL DEFAULT 0,
    "structured_output" JSONB NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storyboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyboard_frames" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "storyboard_id" TEXT NOT NULL,
    "script_scene_id" TEXT,
    "frame_order" INTEGER NOT NULL,
    "frame_status" "FrameStatus" NOT NULL DEFAULT 'DRAFT',
    "continuity_group" TEXT,
    "frame_title" TEXT NOT NULL,
    "composition_notes" TEXT,
    "camera_plan" TEXT,
    "motion_plan" TEXT,
    "narration_text" TEXT,
    "on_screen_text" TEXT,
    "visual_prompt" TEXT NOT NULL,
    "negative_prompt" TEXT,
    "reference_strategy" JSONB,
    "duration_sec" INTEGER,
    "production_class" "SceneProductionClass",
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storyboard_frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frame_references" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "storyboard_frame_id" TEXT NOT NULL,
    "reference_type" "FrameReferenceType" NOT NULL,
    "source_label" TEXT,
    "file_name" TEXT,
    "file_url" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frame_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_notes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "target_type" "ReviewTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "severity" "ReviewSeverity" NOT NULL DEFAULT 'INFO',
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'OPEN',
    "note_text" TEXT NOT NULL,
    "author_label" TEXT,
    "metadata_json" JSONB,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "render_jobs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "storyboard_id" TEXT,
    "storyboard_frame_id" TEXT,
    "script_scene_id" TEXT,
    "job_type" "RenderJobType" NOT NULL,
    "job_status" "RenderJobStatus" NOT NULL DEFAULT 'DRAFT',
    "provider" "RenderProvider" NOT NULL,
    "provider_model" TEXT,
    "input_json" JSONB NOT NULL,
    "output_json" JSONB,
    "error_message" TEXT,
    "queued_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "render_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "render_assets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "render_job_id" TEXT NOT NULL,
    "storyboard_frame_id" TEXT,
    "asset_type" "RenderAssetType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "mime_type" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration_sec" DOUBLE PRECISION,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "render_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creative_briefs_project_id_brief_status_objective_idx" ON "creative_briefs"("project_id", "brief_status", "objective");

-- CreateIndex
CREATE UNIQUE INDEX "creative_briefs_project_id_version_number_key" ON "creative_briefs"("project_id", "version_number");

-- CreateIndex
CREATE INDEX "brief_constraints_project_id_constraint_type_is_hard_constr_idx" ON "brief_constraints"("project_id", "constraint_type", "is_hard_constraint");

-- CreateIndex
CREATE UNIQUE INDEX "brief_constraints_creative_brief_id_constraint_code_key" ON "brief_constraints"("creative_brief_id", "constraint_code");

-- CreateIndex
CREATE INDEX "approval_gates_project_id_stage_approval_status_idx" ON "approval_gates"("project_id", "stage", "approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "approval_gates_project_id_stage_target_version_key" ON "approval_gates"("project_id", "stage", "target_version");

-- CreateIndex
CREATE INDEX "storyboards_project_id_storyboard_status_created_at_idx" ON "storyboards"("project_id", "storyboard_status", "created_at");

-- CreateIndex
CREATE INDEX "storyboards_source_brief_id_idx" ON "storyboards"("source_brief_id");

-- CreateIndex
CREATE INDEX "storyboards_script_id_idx" ON "storyboards"("script_id");

-- CreateIndex
CREATE UNIQUE INDEX "storyboards_project_id_version_number_key" ON "storyboards"("project_id", "version_number");

-- CreateIndex
CREATE INDEX "storyboard_frames_project_id_frame_status_frame_order_idx" ON "storyboard_frames"("project_id", "frame_status", "frame_order");

-- CreateIndex
CREATE INDEX "storyboard_frames_script_scene_id_idx" ON "storyboard_frames"("script_scene_id");

-- CreateIndex
CREATE INDEX "storyboard_frames_continuity_group_idx" ON "storyboard_frames"("continuity_group");

-- CreateIndex
CREATE UNIQUE INDEX "storyboard_frames_storyboard_id_frame_order_key" ON "storyboard_frames"("storyboard_id", "frame_order");

-- CreateIndex
CREATE INDEX "frame_references_project_id_reference_type_idx" ON "frame_references"("project_id", "reference_type");

-- CreateIndex
CREATE INDEX "frame_references_storyboard_frame_id_reference_type_idx" ON "frame_references"("storyboard_frame_id", "reference_type");

-- CreateIndex
CREATE INDEX "review_notes_project_id_target_type_target_id_idx" ON "review_notes"("project_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "review_notes_project_id_review_status_severity_idx" ON "review_notes"("project_id", "review_status", "severity");

-- CreateIndex
CREATE INDEX "render_jobs_project_id_job_type_job_status_idx" ON "render_jobs"("project_id", "job_type", "job_status");

-- CreateIndex
CREATE INDEX "render_jobs_storyboard_id_idx" ON "render_jobs"("storyboard_id");

-- CreateIndex
CREATE INDEX "render_jobs_storyboard_frame_id_idx" ON "render_jobs"("storyboard_frame_id");

-- CreateIndex
CREATE INDEX "render_jobs_script_scene_id_idx" ON "render_jobs"("script_scene_id");

-- CreateIndex
CREATE INDEX "render_assets_project_id_asset_type_created_at_idx" ON "render_assets"("project_id", "asset_type", "created_at");

-- CreateIndex
CREATE INDEX "render_assets_render_job_id_idx" ON "render_assets"("render_job_id");

-- CreateIndex
CREATE INDEX "render_assets_storyboard_frame_id_idx" ON "render_assets"("storyboard_frame_id");

-- AddForeignKey
ALTER TABLE "creative_briefs" ADD CONSTRAINT "creative_briefs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief_constraints" ADD CONSTRAINT "brief_constraints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief_constraints" ADD CONSTRAINT "brief_constraints_creative_brief_id_fkey" FOREIGN KEY ("creative_brief_id") REFERENCES "creative_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_gates" ADD CONSTRAINT "approval_gates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboards" ADD CONSTRAINT "storyboards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboards" ADD CONSTRAINT "storyboards_source_brief_id_fkey" FOREIGN KEY ("source_brief_id") REFERENCES "creative_briefs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboards" ADD CONSTRAINT "storyboards_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "scripts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboard_frames" ADD CONSTRAINT "storyboard_frames_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboard_frames" ADD CONSTRAINT "storyboard_frames_storyboard_id_fkey" FOREIGN KEY ("storyboard_id") REFERENCES "storyboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboard_frames" ADD CONSTRAINT "storyboard_frames_script_scene_id_fkey" FOREIGN KEY ("script_scene_id") REFERENCES "script_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_references" ADD CONSTRAINT "frame_references_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_references" ADD CONSTRAINT "frame_references_storyboard_frame_id_fkey" FOREIGN KEY ("storyboard_frame_id") REFERENCES "storyboard_frames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_storyboard_id_fkey" FOREIGN KEY ("storyboard_id") REFERENCES "storyboards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_storyboard_frame_id_fkey" FOREIGN KEY ("storyboard_frame_id") REFERENCES "storyboard_frames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_script_scene_id_fkey" FOREIGN KEY ("script_scene_id") REFERENCES "script_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "render_assets" ADD CONSTRAINT "render_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "render_assets" ADD CONSTRAINT "render_assets_render_job_id_fkey" FOREIGN KEY ("render_job_id") REFERENCES "render_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "render_assets" ADD CONSTRAINT "render_assets_storyboard_frame_id_fkey" FOREIGN KEY ("storyboard_frame_id") REFERENCES "storyboard_frames"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- CreateEnum
CREATE TYPE "BrandStage" AS ENUM ('COLD_START', 'VALIDATION', 'SCALE');

-- CreateEnum
CREATE TYPE "IndustryResearchStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CompetitorTier" AS ENUM ('DIRECT', 'ASPIRATIONAL', 'CATEGORY_LEADER');

-- CreateEnum
CREATE TYPE "ContentPillarType" AS ENUM ('EDUCATION', 'BRAND_STORY', 'PRODUCT_VALUE', 'USE_CASE', 'TRUST_SIGNAL', 'FOUNDER_IP', 'USER_TESTIMONIAL', 'TREND_REACTION');

-- CreateEnum
CREATE TYPE "PlatformSurface" AS ENUM ('XIAOHONGSHU_POST', 'XIAOHONGSHU_VIDEO', 'DOUYIN_VIDEO', 'DOUYIN_TITLE', 'COMMENT_REPLY', 'COVER_COPY');

-- CreateEnum
CREATE TYPE "AdaptationStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ComplianceCheckStatus" AS ENUM ('PENDING', 'PASSED', 'NEEDS_REVIEW', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ComplianceIssueType" AS ENUM ('SENSITIVE_WORD', 'EXAGGERATED_CLAIM', 'EFFECT_PROMISE', 'MEDICAL_RISK', 'FINANCE_RISK', 'MISSING_DISCLOSURE');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StrategyTaskType" AS ENUM ('RESEARCH', 'TOPIC_PLAN', 'SCRIPT', 'ADAPTATION', 'COMPLIANCE', 'REVIEW');

-- CreateEnum
CREATE TYPE "StrategyTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "brand_profile_id" TEXT,
ADD COLUMN     "industry_template_id" TEXT;

-- CreateTable
CREATE TABLE "brand_profiles" (
    "id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "brand_positioning" TEXT NOT NULL,
    "core_belief" TEXT,
    "product_lines_json" JSONB NOT NULL,
    "target_personas_json" JSONB NOT NULL,
    "platform_priority" JSONB NOT NULL,
    "forbidden_phrases" JSONB NOT NULL,
    "compliance_notes" TEXT,
    "brand_voice" TEXT,
    "brand_stage" "BrandStage" NOT NULL DEFAULT 'COLD_START',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_templates" (
    "id" TEXT NOT NULL,
    "industry_name" TEXT NOT NULL,
    "industry_keywords" JSONB NOT NULL,
    "competitor_keywords" JSONB NOT NULL,
    "expression_boundaries" TEXT,
    "forbidden_terms" JSONB NOT NULL,
    "platform_content_priorities" JSONB NOT NULL,
    "common_pain_points" JSONB NOT NULL,
    "common_questions" JSONB NOT NULL,
    "recommended_content_pillars" JSONB NOT NULL,
    "recommended_topic_directions" JSONB NOT NULL,
    "template_notes" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_research_snapshots" (
    "id" TEXT NOT NULL,
    "industry_template_id" TEXT NOT NULL,
    "snapshot_title" TEXT NOT NULL,
    "research_status" "IndustryResearchStatus" NOT NULL DEFAULT 'DRAFT',
    "summary_text" TEXT,
    "signal_json" JSONB NOT NULL,
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_research_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_profiles" (
    "id" TEXT NOT NULL,
    "industry_template_id" TEXT NOT NULL,
    "competitor_name" TEXT NOT NULL,
    "competitor_tier" "CompetitorTier" NOT NULL,
    "keywords_json" JSONB NOT NULL,
    "primary_platforms" JSONB NOT NULL,
    "messaging_angles_json" JSONB NOT NULL,
    "notes_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pillars" (
    "id" TEXT NOT NULL,
    "brand_profile_id" TEXT NOT NULL,
    "pillar_name" TEXT NOT NULL,
    "pillar_type" "ContentPillarType" NOT NULL,
    "pillar_summary" TEXT,
    "topic_directions" JSONB NOT NULL,
    "platform_fit_json" JSONB,
    "priority_score" INTEGER NOT NULL DEFAULT 50,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pillars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_sprints" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "brand_profile_id" TEXT,
    "sprint_name" TEXT NOT NULL,
    "sprint_goal" TEXT,
    "sprint_status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "objective_json" JSONB,
    "content_strategy_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "brand_profile_id" TEXT,
    "campaign_sprint_id" TEXT,
    "content_pillar_id" TEXT,
    "task_type" "StrategyTaskType" NOT NULL,
    "task_status" "StrategyTaskStatus" NOT NULL DEFAULT 'TODO',
    "task_title" TEXT NOT NULL,
    "task_summary" TEXT,
    "priority_score" INTEGER NOT NULL DEFAULT 50,
    "owner_label" TEXT,
    "due_at" TIMESTAMP(3),
    "task_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_adaptations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "brand_profile_id" TEXT,
    "campaign_sprint_id" TEXT,
    "content_pillar_id" TEXT,
    "script_id" TEXT,
    "script_scene_id" TEXT,
    "source_message" TEXT NOT NULL,
    "platform_surface" "PlatformSurface" NOT NULL,
    "adaptation_status" "AdaptationStatus" NOT NULL DEFAULT 'DRAFT',
    "title_text" TEXT,
    "body_text" TEXT NOT NULL,
    "hook_text" TEXT,
    "cover_copy" TEXT,
    "interaction_prompt" TEXT,
    "structured_output" JSONB NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_adaptations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "brand_profile_id" TEXT,
    "campaign_sprint_id" TEXT,
    "platform_adaptation_id" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "check_status" "ComplianceCheckStatus" NOT NULL DEFAULT 'PENDING',
    "flagged_issues_json" JSONB NOT NULL,
    "sensitive_hits_json" JSONB,
    "risk_summary" TEXT,
    "needs_human_review" BOOLEAN NOT NULL DEFAULT false,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_reviews" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "brand_profile_id" TEXT,
    "campaign_sprint_id" TEXT,
    "content_pillar_id" TEXT,
    "review_title" TEXT NOT NULL,
    "content_theme" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "platform_surface" "PlatformSurface" NOT NULL,
    "headline_text" TEXT,
    "opening_style" TEXT,
    "core_selling_points" JSONB NOT NULL,
    "metric_json" JSONB NOT NULL,
    "optimization_summary" TEXT,
    "next_recommendations" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "optimization_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_profiles_brand_stage_created_at_idx" ON "brand_profiles"("brand_stage", "created_at");

-- CreateIndex
CREATE INDEX "industry_templates_industry_name_created_at_idx" ON "industry_templates"("industry_name", "created_at");

-- CreateIndex
CREATE INDEX "industry_research_snapshots_industry_template_id_research_s_idx" ON "industry_research_snapshots"("industry_template_id", "research_status", "created_at");

-- CreateIndex
CREATE INDEX "competitor_profiles_industry_template_id_competitor_tier_idx" ON "competitor_profiles"("industry_template_id", "competitor_tier");

-- CreateIndex
CREATE INDEX "content_pillars_brand_profile_id_pillar_type_active_idx" ON "content_pillars"("brand_profile_id", "pillar_type", "active");

-- CreateIndex
CREATE INDEX "campaign_sprints_project_id_sprint_status_created_at_idx" ON "campaign_sprints"("project_id", "sprint_status", "created_at");

-- CreateIndex
CREATE INDEX "campaign_sprints_brand_profile_id_sprint_status_idx" ON "campaign_sprints"("brand_profile_id", "sprint_status");

-- CreateIndex
CREATE INDEX "strategy_tasks_project_id_task_type_task_status_idx" ON "strategy_tasks"("project_id", "task_type", "task_status");

-- CreateIndex
CREATE INDEX "strategy_tasks_campaign_sprint_id_task_status_idx" ON "strategy_tasks"("campaign_sprint_id", "task_status");

-- CreateIndex
CREATE INDEX "strategy_tasks_brand_profile_id_priority_score_idx" ON "strategy_tasks"("brand_profile_id", "priority_score");

-- CreateIndex
CREATE INDEX "platform_adaptations_project_id_platform_surface_adaptation_idx" ON "platform_adaptations"("project_id", "platform_surface", "adaptation_status");

-- CreateIndex
CREATE INDEX "platform_adaptations_campaign_sprint_id_platform_surface_idx" ON "platform_adaptations"("campaign_sprint_id", "platform_surface");

-- CreateIndex
CREATE INDEX "platform_adaptations_script_scene_id_platform_surface_idx" ON "platform_adaptations"("script_scene_id", "platform_surface");

-- CreateIndex
CREATE INDEX "compliance_checks_project_id_check_status_created_at_idx" ON "compliance_checks"("project_id", "check_status", "created_at");

-- CreateIndex
CREATE INDEX "compliance_checks_platform_adaptation_id_check_status_idx" ON "compliance_checks"("platform_adaptation_id", "check_status");

-- CreateIndex
CREATE INDEX "compliance_checks_target_type_target_id_idx" ON "compliance_checks"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "optimization_reviews_project_id_platform_surface_created_at_idx" ON "optimization_reviews"("project_id", "platform_surface", "created_at");

-- CreateIndex
CREATE INDEX "optimization_reviews_campaign_sprint_id_created_at_idx" ON "optimization_reviews"("campaign_sprint_id", "created_at");

-- CreateIndex
CREATE INDEX "Project_brand_profile_id_created_at_idx" ON "Project"("brand_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "Project_industry_template_id_created_at_idx" ON "Project"("industry_template_id", "created_at");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_industry_template_id_fkey" FOREIGN KEY ("industry_template_id") REFERENCES "industry_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_research_snapshots" ADD CONSTRAINT "industry_research_snapshots_industry_template_id_fkey" FOREIGN KEY ("industry_template_id") REFERENCES "industry_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_profiles" ADD CONSTRAINT "competitor_profiles_industry_template_id_fkey" FOREIGN KEY ("industry_template_id") REFERENCES "industry_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_pillars" ADD CONSTRAINT "content_pillars_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_sprints" ADD CONSTRAINT "campaign_sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_sprints" ADD CONSTRAINT "campaign_sprints_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_tasks" ADD CONSTRAINT "strategy_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_tasks" ADD CONSTRAINT "strategy_tasks_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_tasks" ADD CONSTRAINT "strategy_tasks_campaign_sprint_id_fkey" FOREIGN KEY ("campaign_sprint_id") REFERENCES "campaign_sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_tasks" ADD CONSTRAINT "strategy_tasks_content_pillar_id_fkey" FOREIGN KEY ("content_pillar_id") REFERENCES "content_pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_adaptations" ADD CONSTRAINT "platform_adaptations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_adaptations" ADD CONSTRAINT "platform_adaptations_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_adaptations" ADD CONSTRAINT "platform_adaptations_campaign_sprint_id_fkey" FOREIGN KEY ("campaign_sprint_id") REFERENCES "campaign_sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_adaptations" ADD CONSTRAINT "platform_adaptations_content_pillar_id_fkey" FOREIGN KEY ("content_pillar_id") REFERENCES "content_pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_adaptations" ADD CONSTRAINT "platform_adaptations_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "scripts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_adaptations" ADD CONSTRAINT "platform_adaptations_script_scene_id_fkey" FOREIGN KEY ("script_scene_id") REFERENCES "script_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_campaign_sprint_id_fkey" FOREIGN KEY ("campaign_sprint_id") REFERENCES "campaign_sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_platform_adaptation_id_fkey" FOREIGN KEY ("platform_adaptation_id") REFERENCES "platform_adaptations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_reviews" ADD CONSTRAINT "optimization_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_reviews" ADD CONSTRAINT "optimization_reviews_brand_profile_id_fkey" FOREIGN KEY ("brand_profile_id") REFERENCES "brand_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_reviews" ADD CONSTRAINT "optimization_reviews_campaign_sprint_id_fkey" FOREIGN KEY ("campaign_sprint_id") REFERENCES "campaign_sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_reviews" ADD CONSTRAINT "optimization_reviews_content_pillar_id_fkey" FOREIGN KEY ("content_pillar_id") REFERENCES "content_pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TYPE "LlmProvider" ADD VALUE IF NOT EXISTS 'DEEPSEEK';
ALTER TYPE "LlmProvider" ADD VALUE IF NOT EXISTS 'QWEN';

ALTER TABLE "app_settings"
ADD COLUMN IF NOT EXISTS "deepseek_api_key" TEXT,
ADD COLUMN IF NOT EXISTS "qwen_api_key" TEXT,
ADD COLUMN IF NOT EXISTS "llm_routing_json" JSONB;
