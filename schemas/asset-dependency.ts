import { z } from "zod";

export const requiredAssetItemSchema = z.object({
  asset_code: z.enum([
    "CHARACTER_BASE",
    "SCENE_BASE",
    "CHARACTER_SCENE_COMPOSITE",
    "VOICE",
    "REFERENCE_IMAGE",
  ]),
  required: z.boolean(),
  reason: z.string().min(1).max(200),
  reference_tags: z.array(z.string().min(1).max(64)).max(8),
});

export const assetDependencyAnalyzerOutputSchema = z.object({
  required_assets: z.array(requiredAssetItemSchema).length(5),
  needs_character_base: z.boolean(),
  needs_scene_base: z.boolean(),
  needs_character_scene_composite: z.boolean(),
  needs_voice: z.boolean(),
  needs_reference_images: z.boolean(),
  missing_asset_hints: z.array(z.string().min(1).max(120)).max(10),
  is_asset_ready: z.boolean(),
});

export const uploadedAssetMetadataSchema = z.object({
  script_scene_id: z.string().cuid().optional(),
  asset_type: z.enum([
    "CHARACTER_BASE",
    "SCENE_BASE",
    "CHARACTER_SCENE_COMPOSITE",
    "VOICE",
    "REFERENCE_IMAGE",
  ]),
  continuity_group: z.string().min(1).max(64).optional(),
  file_name: z.string().min(1).max(200),
  file_url: z.string().url().optional(),
  mime_type: z.string().min(1).max(120).optional(),
  metadata_json: z.record(z.string(), z.unknown()).optional(),
});

export type AssetDependencyAnalyzerOutput = z.infer<typeof assetDependencyAnalyzerOutputSchema>;
