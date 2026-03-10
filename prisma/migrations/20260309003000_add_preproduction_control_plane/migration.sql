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
