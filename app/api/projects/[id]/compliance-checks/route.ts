import { fail, ok } from "@/lib/api-response";
import { ComplianceCheckService } from "@/services/compliance-check.service";

const complianceCheckService = new ComplianceCheckService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const check = await complianceCheckService.run(id, await request.json());
    return ok(check, { status: 201 });
  } catch (error) {
    return fail("创建合规检查失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
