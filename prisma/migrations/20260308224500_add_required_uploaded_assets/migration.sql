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
