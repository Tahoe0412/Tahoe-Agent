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

