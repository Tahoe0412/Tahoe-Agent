import { ok } from "@/lib/api-response";
import { parseJsonBody, toErrorResponse } from "@/lib/http-error";
import { ComplianceCheckService } from "@/services/compliance-check.service";

const complianceCheckService = new ComplianceCheckService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const check = await complianceCheckService.run(id, await parseJsonBody(request));
    return ok(check, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建合规检查失败。");
  }
}
