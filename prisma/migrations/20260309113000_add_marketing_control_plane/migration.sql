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
