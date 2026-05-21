import { NextRequest } from "next/server";

import { ok } from "@/lib/api-response";
import { toErrorResponse } from "@/lib/http-error";
import { ArticleSampleService } from "@/services/article-sample.service";

const service = new ArticleSampleService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sample = await service.getSample(id);
    if (!sample) {
      return ok(null, { status: 404 });
    }
    return ok(sample);
  } catch (error) {
    return toErrorResponse(error, "获取文章样本失败");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await service.removeSample(id);
    return ok({ deleted: true });
  } catch (error) {
    return toErrorResponse(error, "删除文章样本失败");
  }
}
