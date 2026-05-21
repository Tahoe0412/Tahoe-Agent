import { NextRequest } from "next/server";
import { z } from "zod";

import { ok, fail } from "@/lib/api-response";
import { toErrorResponse } from "@/lib/http-error";
import { parseJsonBody } from "@/lib/http-error";
import { runQualityCheck } from "@/lib/quality-gate";

const QualityCheckInput = z.object({
  title: z.string().min(1, "标题不能为空"),
  content: z.string().min(1, "正文不能为空"),
  direction: z.string().min(1, "方向不能为空"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<unknown>(request);
    const parsed = QualityCheckInput.safeParse(body);

    if (!parsed.success) {
      return fail("请求参数校验失败", 400, parsed.error.flatten(), { code: "VALIDATION_ERROR" });
    }

    const { title, content, direction } = parsed.data;
    const result = runQualityCheck(title, content, direction);

    return ok(result);
  } catch (error) {
    return toErrorResponse(error, "文章质量检查失败");
  }
}
