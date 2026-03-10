import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { projectCreateSchema } from "@/schemas/project";
import { ResearchJobService } from "@/services/research-job.service";

const service = new ResearchJobService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = projectCreateSchema.pick({ platforms: true, topic: true, mockMode: true }).parse(body);

    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) {
      return fail("项目不存在。", 404);
    }

    const result = await service.createJob({
      projectId: id,
      platforms: payload.platforms,
      topicQuery: payload.topic,
      mockMode: payload.mockMode,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("创建 research job 失败。", 500, error.message);
    }
    return fail("创建 research job 失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
