import { NextRequest } from "next/server";

import { ok, fail } from "@/lib/api-response";
import { toErrorResponse } from "@/lib/http-error";
import { PublishExportService } from "@/services/publish-export.service";

const service = new PublishExportService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "toutiao";

    if (format !== "toutiao" && format !== "markdown") {
      return fail("不支持的导出格式，可选：toutiao / markdown", 400, undefined, { code: "VALIDATION_ERROR" });
    }

    if (format === "markdown") {
      const result = await service.exportAsMarkdown(id);
      return ok(result);
    }

    const result = await service.exportForToutiao(id);
    return ok(result);
  } catch (error) {
    return toErrorResponse(error, "导出文章失败");
  }
}
