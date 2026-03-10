import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { WorkflowService } from "@/services/workflow.service";

const workflowService = new WorkflowService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { mode?: "full" | "report" };
    const mode = body.mode ?? "full";

    const result =
      mode === "report"
        ? await workflowService.generateReportOnly(id)
        : await workflowService.runFullWorkflow(id);

    return ok(result, { status: 201 });
  } catch (error) {
    console.error("workflow.run failed", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("工作流执行失败。", 500, error.message);
    }

    return fail("工作流执行失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
