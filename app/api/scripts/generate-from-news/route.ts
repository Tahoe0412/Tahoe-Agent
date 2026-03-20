import { z } from "zod";
import { ok } from "@/lib/api-response";
import { allOutputTypes, type OutputType } from "@/lib/content-line";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { NewsScriptService } from "@/services/news-script.service";

const newsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  snippet: z.string().default(""),
  source: z.string().default("未知来源"),
  source_type: z.string().default("unknown"),
  published_at: z.string().default(""),
});

const requestSchema = z.object({
  searchQuery: z.string().min(1, "searchQuery 不能为空"),
  newsItems: z.array(newsItemSchema).min(1, "至少选择一条新闻"),
  contentLine: z.enum(["MARS_CITIZEN", "MARKETING"]).optional(),
  outputType: z.enum(allOutputTypes as [OutputType, ...OutputType[]]).optional(),
});

const service = new NewsScriptService();

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await parseJsonBody(request));

    const result = await service.generate({
      searchQuery: body.searchQuery,
      newsItems: body.newsItems,
      contentLine: body.contentLine,
      outputType: body.outputType,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "生成脚本失败。");
  }
}
