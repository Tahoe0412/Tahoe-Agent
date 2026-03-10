import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { ReportService } from "@/services/report.service";

const service = new ReportService();

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reports = await service.listReports(id);
    return ok(reports);
  } catch (error) {
    return fail("读取研究报告失败。", 400, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await service.generateProjectReport(id);
    return ok(report, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("生成研究报告失败。", 500, error.message);
    }
    return fail("生成研究报告失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
