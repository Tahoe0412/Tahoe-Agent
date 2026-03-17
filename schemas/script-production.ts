import { z } from "zod";

export const scriptSceneSchema = z.object({
  scene_order: z.number().int().min(1).max(200),
  original_text: z.string().min(1).max(2000),
  rewritten_for_ai: z.string().min(1).max(2000),
  shot_goal: z.string().min(1).max(500),
  duration_sec: z.number().int().min(1).max(120),
  continuity_group: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  visual_priority: z.array(z.string().min(1).max(64)).min(1).max(8),
  avoid: z.array(z.string().min(1).max(64)).max(8),
});

export const scriptRewriteOutputSchema = z.object({
  scenes: z.array(scriptSceneSchema).min(1).max(200),
});

export const humanTypeSchema = z.enum(["H0", "H1"]);
export const motionTypeSchema = z.enum(["M0", "M1", "M2"]);
export const lipSyncTypeSchema = z.enum(["L0", "L1"]);
export const assetDependencyTypeSchema = z.enum(["S0", "S1", "S2", "S3", "S4"]);
export const sceneProductionClassSchema = z.enum(["A", "B", "C", "D", "E", "F", "G", "T"]);

export const sceneClassificationSchema = z.object({
  human_type: humanTypeSchema,
  motion_type: motionTypeSchema,
  lip_sync_type: lipSyncTypeSchema,
  asset_dependency_type: assetDependencyTypeSchema,
  production_class: sceneProductionClassSchema,
  difficulty_score: z.number().int().min(1).max(100),
  risk_flags: z.array(z.string().min(1).max(64)).max(10),
});

export const scriptRewriteRequestSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  script_text: z.string().min(10).max(12000).optional(),
});

export const sceneClassificationRequestSchema = z.object({
  rewritten_for_ai: z.string().min(1).max(2000).optional(),
});

export const sceneUpdateRequestSchema = z.object({
  rewritten_for_ai: z.string().min(1).max(2000).optional(),
  shot_goal: z.string().min(1).max(200).optional(),
  continuity_group: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  duration_sec: z.number().int().min(1).max(120).optional(),
  visual_priority: z.array(z.string().min(1).max(64)).min(1).max(8).optional(),
  avoid: z.array(z.string().min(1).max(64)).max(8).optional(),
});

export type ScriptSceneOutput = z.infer<typeof scriptSceneSchema>;
export type ScriptRewriteOutput = z.infer<typeof scriptRewriteOutputSchema>;
export type SceneClassificationOutput = z.infer<typeof sceneClassificationSchema>;
export type SceneUpdateRequest = z.infer<typeof sceneUpdateRequestSchema>;
