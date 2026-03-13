import { fail, ok } from "@/lib/api-response";
import { PromotionalCopyService } from "@/services/promotional-copy.service";

const promotionalCopyService = new PromotionalCopyService();

// Extend the serverless function timeout for LLM-heavy operations
export const maxDuration = 120;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rawBody = await _request.text();
    const body = rawBody
      ? (JSON.parse(rawBody) as {
          action?: "generate" | "enhance";
          title?: string;
          master_angle?: string;
          headline_options?: string[];
          hero_copy?: string;
          long_form_copy?: string;
          proof_points?: string[];
          call_to_action?: string;
          risk_notes?: string[];
          recommended_next_steps?: string[];
          source_task_id?: string | null;
        })
      : {};
    const result =
      body.action === "enhance"
        ? await promotionalCopyService.diagnoseAndEnhance(id, {
            title: body.title,
            master_angle: body.master_angle ?? "",
            headline_options: body.headline_options ?? [],
            hero_copy: body.hero_copy ?? "",
            long_form_copy: body.long_form_copy ?? "",
            proof_points: body.proof_points ?? [],
            call_to_action: body.call_to_action ?? "",
            risk_notes: body.risk_notes ?? [],
            recommended_next_steps: body.recommended_next_steps ?? [],
            source_task_id: body.source_task_id ?? null,
          })
        : await promotionalCopyService.generateForProject(id);
    return ok(result, { status: 201 });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const isAbortError = error instanceof Error && (error.name === "AbortError" || rawMessage.includes("aborted"));
    // Turn raw Zod / schema errors into a human-readable message
    const isSchemaError = rawMessage.includes("invalid_type") || rawMessage.includes("too_small") || rawMessage.includes("zodSchema");

    if (isAbortError) {
      return fail(
        "生成宣传文案失败。",
        504,
        "AI 模型生成时间过长，连接已中断。建议：1）确认网络稳定；2）缩短输入内容后重试；3）切换更快的模型。",
      );
    }

    const userMessage = isSchemaError
      ? "AI 模型返回的数据格式不完整，系统已尝试自动补全。如果仍然失败，请重试一次或切换模型。"
      : rawMessage;

    // Client errors (validation, missing data) → 400; server errors (DB, LLM infra) → 500
    const isClientError =
      isSchemaError ||
      rawMessage.includes("not found") ||
      rawMessage.includes("缺少") ||
      rawMessage.includes("未找到");
    return fail("生成宣传文案失败。", isClientError ? 400 : 500, userMessage);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      title?: string;
      master_angle: string;
      headline_options: string[];
      hero_copy: string;
      long_form_copy: string;
      proof_points: string[];
      call_to_action: string;
      risk_notes?: string[];
      recommended_next_steps?: string[];
      source_task_id?: string | null;
    };
    const result = await promotionalCopyService.saveVersion(id, body);
    return ok(result, { status: 201 });
  } catch (error) {
    return fail("保存宣传主稿版本失败。", 400, error instanceof Error ? error.message : undefined);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) {
      return fail("缺少 taskId 参数。", 400);
    }
    await promotionalCopyService.deleteVersion(id, taskId);
    return ok({ deleted: true });
  } catch (error) {
    return fail("删除版本失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
