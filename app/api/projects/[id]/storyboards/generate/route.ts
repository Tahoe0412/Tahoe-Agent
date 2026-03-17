import { fail, ok } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/http-error";
import { StoryboardGeneratorService } from "@/services/storyboard-generator.service";

const generatorService = new StoryboardGeneratorService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request).catch(() => ({}));
    const scriptId = typeof body === "object" && body !== null && "script_id" in body
      ? String((body as { script_id?: string }).script_id)
      : undefined;

    const storyboard = await generatorService.generate({
      projectId: id,
      scriptId: scriptId || undefined,
    });

    return ok(storyboard, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "自动分镜生成失败。";
    return fail(message, 500, error instanceof Error ? error.stack : undefined);
  }
}
