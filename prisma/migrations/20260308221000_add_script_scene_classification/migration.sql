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
