import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { ResearchJobService } from "@/services/research-job.service";

const service = new ResearchJobService();

export async function POST(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const result = await service.runTask(jobId);
    return ok(result);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("运行趋势研究失败。", 500, error.message);
    }
    return fail("运行趋势研究失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
