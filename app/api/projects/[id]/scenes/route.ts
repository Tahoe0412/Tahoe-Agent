import { ok } from "@/lib/api-response";
import { toErrorResponse } from "@/lib/http-error";
import { ScriptService } from "@/services/script.service";

const service = new ScriptService();

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const scenes = await service.listScenes(id);
    return ok(scenes);
  } catch (error) {
    return toErrorResponse(error, "读取 scenes 失败。");
  }
}
