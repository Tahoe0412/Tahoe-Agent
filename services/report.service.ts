import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class ReportService {
  async generateProjectReport(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        trend_topics: {
          include: {
            trend_evidences: true,
          },
        },
        scripts: {
          include: {
            script_scenes: {
              include: {
                scene_classifications: true,
                required_assets: true,
              },
            },
          },
        },
        uploaded_assets: true,
        strategy_tasks: true,
        platform_adaptations: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    const reportJson = {
      topic_query: project.topic_query,
      trend_topic_count: project.trend_topics.length,
      script_count: project.scripts.length,
      strategy_task_count: project.strategy_tasks.length,
      platform_adaptation_count: project.platform_adaptations.length,
      scene_count: project.scripts.flatMap((script) => script.script_scenes).length,
      ready_scene_count: project.scripts
        .flatMap((script) => script.script_scenes)
        .filter((scene) => scene.required_assets[0]?.is_asset_ready).length,
      uploaded_asset_count: project.uploaded_assets.length,
      top_trends: project.trend_topics
        .slice()
        .sort((a, b) => b.momentum_score - a.momentum_score)
        .slice(0, 5)
        .map((topic) => ({
          topic_key: topic.topic_key,
          topic_label: topic.topic_label,
          momentum_score: topic.momentum_score,
        })),
    };

    return prisma.researchReport.create({
      data: {
        project_id: projectId,
        report_type: "FINAL_RESEARCH",
        report_status: "PUBLISHED",
        version_number: (await prisma.researchReport.count({ where: { project_id: projectId, report_type: "FINAL_RESEARCH" } })) + 1,
        input_snapshot: toJson({
          project_id: projectId,
        }),
        report_json: toJson(reportJson),
      },
    });
  }

  async listReports(projectId: string) {
    return prisma.researchReport.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: "desc" },
    });
  }
}
