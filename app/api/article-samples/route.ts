import { NextRequest } from "next/server";
import { z } from "zod";

import { ok, fail } from "@/lib/api-response";
import { toErrorResponse } from "@/lib/http-error";
import { parseJsonBody } from "@/lib/http-error";
import { ArticleSampleService } from "@/services/article-sample.service";

const CreateSampleInput = z.object({
  accountDirection: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(10),
  sourceProjectId: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  isExternal: z.boolean().optional(),
  qualityScore: z.number().min(0).max(100).optional(),
});

const service = new ArticleSampleService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction");
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    if (direction) {
      const samples = await service.getSamples(direction, limit);
      return ok(samples);
    }

    // If no direction, return summary for all directions
    const directions = ["AI快讯", "全球股市", "消费时尚"];
    const summaries = await Promise.all(
      directions.map(async (d) => ({
        direction: d,
        summary: await service.getStyleSummary(d),
        samples: await service.getSamples(d, 3),
      })),
    );
    return ok(summaries);
  } catch (error) {
    return toErrorResponse(error, "获取文章样本失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<unknown>(request);
    const parsed = CreateSampleInput.safeParse(body);

    if (!parsed.success) {
      return fail("请求参数校验失败", 400, parsed.error.flatten(), { code: "VALIDATION_ERROR" });
    }

    const sample = await service.addSample(parsed.data);
    return ok(sample, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建文章样本失败");
  }
}
