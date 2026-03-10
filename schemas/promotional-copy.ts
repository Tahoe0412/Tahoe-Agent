import { z } from "zod";
import { platformSurfaceSchema } from "@/schemas/production-control";

export const promotionalCopyDiagnosisSchema = z.object({
  overall_score: z.number().min(0).max(100),
  strengths: z.array(z.string().min(4).max(200)).min(2).max(6),
  issues: z.array(z.string().min(4).max(240)).min(2).max(8),
  rewrite_focus: z.array(z.string().min(4).max(200)).min(2).max(6),
  summary: z.string().min(10).max(400),
});

export const promotionalCopyOutputSchema = z.object({
  master_angle: z.string().min(6).max(240),
  headline_options: z.array(z.string().min(4).max(120)).min(3).max(6),
  hero_copy: z.string().min(20).max(500),
  long_form_copy: z.string().min(80).max(6000),
  proof_points: z.array(z.string().min(4).max(240)).min(3).max(8),
  call_to_action: z.string().min(4).max(240),
  risk_notes: z.array(z.string().min(4).max(200)).max(8).default([]),
  platform_adaptations: z.array(
    z.object({
      platform_surface: platformSurfaceSchema,
      title_text: z.string().max(240).optional(),
      body_text: z.string().min(6).max(8000),
      hook_text: z.string().max(400).optional(),
      cover_copy: z.string().max(240).optional(),
      interaction_prompt: z.string().max(1000).optional(),
    }),
  ).max(6).default([]),
  recommended_next_steps: z.array(z.string().min(4).max(200)).max(8).default([]),
  quality_diagnosis: promotionalCopyDiagnosisSchema.optional(),
});

export type PromotionalCopyOutput = z.infer<typeof promotionalCopyOutputSchema>;
export type PromotionalCopyDiagnosis = z.infer<typeof promotionalCopyDiagnosisSchema>;
