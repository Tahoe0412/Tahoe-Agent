import { z } from "zod";
import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { ownedMediaEditorialDirections } from "@/lib/owned-media-directions";
import { OwnedMediaPackageService } from "@/services/daily-run/owned-media-package.service";

const materialSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().default(""),
  snippet: z.string().default(""),
  source: z.string().default("未知来源"),
  source_type: z.string().default("unknown"),
  published_at: z.string().default(""),
});

const worthinessSchema = z.object({
  score: z.number(),
  freshnessScore: z.number(),
  heatScore: z.number(),
  evidenceScore: z.number(),
  accountFitScore: z.number(),
  explainabilityScore: z.number(),
  judgmentScore: z.number(),
  visualPotentialScore: z.number(),
  riskControlScore: z.number(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  whyNow: z.string(),
  angleHint: z.string(),
  recommendedOutput: z.enum(["HOT_LONG_FORM", "SHORT_UPDATE", "SKIP"]),
  strengths: z.array(z.string()),
  cautions: z.array(z.string()),
}).optional().nullable();

const requestSchema = z.object({
  topic: z.string().min(1, "topic 不能为空"),
  contentLine: z.enum(["OWNED_MEDIA", "MARKETING"]).default("OWNED_MEDIA"),
  editorialDirection: z.enum(ownedMediaEditorialDirections).optional(),
  brandProfileId: z.string().min(1).optional().nullable(),
  platforms: z.array(z.string()).optional(),
  materials: z.array(materialSchema).min(1, "至少需要一条素材"),
  generateStoryboard: z.boolean().optional(),
  deferPackaging: z.boolean().optional(),
  worthiness: worthinessSchema,
});

const service = new OwnedMediaPackageService();

export const maxDuration = 900;

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await parseJsonBody(request));
    const result = await service.generateFastPackage(body);
    return ok(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "生成热点长文包失败。");
  }
}
