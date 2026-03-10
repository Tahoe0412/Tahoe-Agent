import { fail, ok } from "@/lib/api-response";
import { ApprovalGateService } from "@/services/approval-gate.service";

const approvalGateService = new ApprovalGateService();

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const approvals = await approvalGateService.listByProject(id);
    return ok(approvals);
  } catch (error) {
    return fail("读取 approval gates 失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const approval = await approvalGateService.upsert(id, await request.json());
    return ok(approval, { status: 201 });
  } catch (error) {
    return fail("写入 approval gate 失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
