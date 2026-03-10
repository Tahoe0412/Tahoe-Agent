import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { projectCreateSchema } from "@/schemas/project";
import { ResearchOrchestratorService } from "@/services/research-orchestrator.service";

const orchestrator = new ResearchOrchestratorService();

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { created_at: "desc" },
      take: 24,
      select: {
        id: true,
        title: true,
        topic_query: true,
        status: true,
        created_at: true,
        metadata: true,
        trend_topics: {
          select: { id: true },
        },
        creative_briefs: {
          select: { id: true },
        },
        storyboards: {
          select: { id: true },
        },
        scripts: {
          include: {
            script_scenes: {
              select: { id: true },
            },
          },
        },
      },
    });

    return ok(
      projects.map((project) => ({
        id: project.id,
        title: project.title,
        topic_query: project.topic_query,
        status: project.status,
        created_at: project.created_at,
        workspace_mode: ((project.metadata as Record<string, unknown> | null)?.workspace_mode as string | undefined) ?? "SHORT_VIDEO",
        trend_count: project.trend_topics.length,
        brief_count: project.creative_briefs.length,
        storyboard_count: project.storyboards.length,
        scene_count: project.scripts.flatMap((script) => script.script_scenes).length,
      })),
    );
  } catch (error) {
    return fail("读取项目列表失败。", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = projectCreateSchema.parse(body);
    const result = await orchestrator.run(payload);

    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return fail("数据库未初始化，请先配置 PostgreSQL 并执行 Prisma 命令。", 500, error.message);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return fail("数据库写入失败。", 500, error.message);
    }

    if (error instanceof Error) {
      return fail("项目创建失败。", 400, error.message);
    }

    return fail("未知错误。", 500);
  }
}
