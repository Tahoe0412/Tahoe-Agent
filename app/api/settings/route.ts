import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { appSettingsUpdateSchema } from "@/schemas/app-settings";
import { AppSettingsService } from "@/services/app-settings.service";

const service = new AppSettingsService();

export async function GET() {
  try {
    const settings = await service.getEffectiveSettings();
    return ok(settings);
  } catch (error) {
    return fail("读取设置失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function PUT(request: Request) {
  try {
    const body = appSettingsUpdateSchema.parse(await parseJsonBody(request));
    const saved = await service.update(body);
    return ok(saved);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const detail = error.message.includes("invalid input value for enum")
        ? "数据库里的 LlmProvider 枚举还是旧版本，缺少 QWEN 或 DEEPSEEK。请先执行最新 Prisma migration。"
        : error.message.includes("column")
          ? "数据库结构还是旧版本，缺少设置页需要的新字段。请先执行最新 Prisma migration。"
          : error.message;
      return fail("保存设置失败。", 500, detail);
    }

    return toErrorResponse(error, "保存设置失败。");
  }
}
