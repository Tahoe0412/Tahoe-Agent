import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { searchLatestNews } from "@/services/news-search";
import { TrendScoringEngine } from "@/services/trend-scoring";
import { getPlatformConnector } from "@/services/platform-connectors";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class ResearchJobService {
  private readonly trendScoringEngine = new TrendScoringEngine();

  async createJob(params: {
    projectId: string;
    platforms: ("YOUTUBE" | "X" | "TIKTOK")[];
    topicQuery: string;
    mockMode?: boolean;
  }) {
    const tasks = await Promise.all(
      params.platforms.map((platform) =>
        prisma.researchTask.create({
          data: {
            project_id: params.projectId,
            task_type: "TREND_RESEARCH",
            task_status: "QUEUED",
            platform,
            query_text: params.topicQuery,
            input_payload: toJson({
              mock_mode: params.mockMode ?? false,
            }),
          },
        }),
      ),
    );

    return {
      job_group_id: tasks[0]?.project_id ?? params.projectId,
      tasks,
    };
  }

  async runTask(taskId: string) {
    const task = await prisma.researchTask.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new Error("Research task not found.");
    }

    await prisma.researchTask.update({
      where: { id: task.id },
      data: {
        task_status: "RUNNING",
        started_at: new Date(),
      },
    });

    try {
      const result = await getPlatformConnector(task.platform ?? task.project.primary_platform ?? "YOUTUBE").collect({
        topic: task.query_text || task.project.topic_query,
        limit: 6,
        mock: Boolean((task.input_payload as { mock_mode?: boolean } | null)?.mock_mode),
      });
      const newsResult = await searchLatestNews({
        topic: task.query_text || task.project.topic_query,
        limit: 5,
      });

      const trendTopics = this.trendScoringEngine.score(result.content_items);
      const assignedNewsTitles = new Set<string>();

      await prisma.$transaction([
        prisma.researchTask.update({
          where: { id: task.id },
          data: {
            task_status: result.success ? "SUCCEEDED" : "FAILED",
            raw_payload: toJson(result),
            input_payload: toJson({
              ...(task.input_payload as Record<string, unknown> | null),
              news_result: newsResult,
            }),
            error_code: result.errors[0]?.code,
            error_message: result.errors[0]?.message,
            finished_at: new Date(),
          },
        }),
        ...result.creators.map((creator) =>
          prisma.platformCreator.upsert({
            where: {
              project_id_platform_external_creator_id: {
                project_id: task.project_id,
                platform: creator.platform,
                external_creator_id: creator.external_creator_id,
              },
            },
            update: {
              handle: creator.handle,
              display_name: creator.display_name,
              follower_count: creator.follower_count,
              average_view_count: creator.average_view_count,
              creator_tier: creator.creator_tier,
              raw_payload: toJson(creator.raw_payload ?? creator),
            },
            create: {
              project_id: task.project_id,
              platform: creator.platform,
              external_creator_id: creator.external_creator_id,
              handle: creator.handle,
              display_name: creator.display_name,
              follower_count: creator.follower_count,
              average_view_count: creator.average_view_count,
              creator_tier: creator.creator_tier,
              raw_payload: toJson(creator.raw_payload ?? creator),
            },
          }),
        ),
        ...result.content_items.map((item) =>
          prisma.platformContent.upsert({
            where: {
              project_id_platform_external_content_id: {
                project_id: task.project_id,
                platform: item.platform,
                external_content_id: item.external_content_id,
              },
            },
            update: {
              title: item.title,
              normalized_title: item.normalized_title,
              url: item.url,
              published_at: new Date(item.published_at),
              duration_seconds: item.duration_seconds,
              view_count: item.view_count,
              like_count: item.like_count,
              comment_count: item.comment_count,
              share_count: item.share_count,
              keyword_set: toJson(item.keyword_set),
              raw_payload: toJson(item.raw_payload ?? item),
            },
            create: {
              project_id: task.project_id,
              platform: item.platform,
              external_content_id: item.external_content_id,
              content_type: item.content_type,
              title: item.title,
              normalized_title: item.normalized_title,
              url: item.url,
              published_at: new Date(item.published_at),
              duration_seconds: item.duration_seconds,
              view_count: item.view_count,
              like_count: item.like_count,
              comment_count: item.comment_count,
              share_count: item.share_count,
              keyword_set: toJson(item.keyword_set),
              raw_payload: toJson(item.raw_payload ?? item),
            },
          }),
        ),
      ]);

      for (const topic of trendTopics) {
        const savedTopic = await prisma.trendTopic.upsert({
          where: {
            project_id_topic_key: {
              project_id: task.project_id,
              topic_key: topic.topic_key,
            },
          },
          update: {
            research_task_id: task.id,
            topic_label: topic.topic_label,
            topic_category: "CREATIVE_FORMAT",
            trend_stage: topic.scores.total_score > 75 ? "PEAK" : topic.scores.total_score > 55 ? "GROWING" : "EMERGING",
            platform_priority: topic.source_platforms[0],
            momentum_score: topic.scores.total_score,
            evidence_count: topic.evidence.length,
            summary_json: toJson(topic.scores),
            raw_payload: toJson(topic),
          },
          create: {
            project_id: task.project_id,
            research_task_id: task.id,
            topic_key: topic.topic_key,
            topic_label: topic.topic_label,
            topic_category: "CREATIVE_FORMAT",
            trend_stage: topic.scores.total_score > 75 ? "PEAK" : topic.scores.total_score > 55 ? "GROWING" : "EMERGING",
            platform_priority: topic.source_platforms[0],
            momentum_score: topic.scores.total_score,
            evidence_count: topic.evidence.length,
            summary_json: toJson(topic.scores),
            raw_payload: toJson(topic),
          },
        });

        await prisma.trendEvidence.createMany({
          data: [
            ...topic.evidence.map((evidence) => ({
              project_id: task.project_id,
              trend_topic_id: savedTopic.id,
              platform: evidence.platform,
              evidence_type: "CONTENT" as const,
              signal_metric: "VIEW_COUNT" as const,
              evidence_label: evidence.title,
              signal_value: evidence.view_count,
              source_url: evidence.url,
              published_at: new Date(evidence.published_at),
              raw_payload: toJson(evidence),
            })),
            ...newsResult.items
              .filter((item) => item.title.toLowerCase().includes(topic.topic_key.toLowerCase().replace(/_/g, " ")))
              .map((item) => ({
                project_id: task.project_id,
                trend_topic_id: savedTopic.id,
                platform: task.platform ?? task.project.primary_platform ?? "YOUTUBE",
                evidence_type: "NEWS" as const,
                signal_metric: "SEARCH_VOLUME" as const,
                evidence_label: item.title,
                signal_value: Math.round(item.score * 100),
                source_url: item.url,
                published_at: new Date(item.published_at),
                raw_payload: toJson(item),
              }))
              .map((row) => {
                assignedNewsTitles.add(row.evidence_label);
                return row;
              }),
          ],
        });
      }

      if (newsResult.items.length > 0 && trendTopics.length > 0) {
        const fallbackTopic = await prisma.trendTopic.findUnique({
          where: {
            project_id_topic_key: {
              project_id: task.project_id,
              topic_key: trendTopics[0].topic_key,
            },
          },
        });

        if (fallbackTopic) {
          const unassignedNews = newsResult.items.filter((item) => !assignedNewsTitles.has(item.title));
          if (unassignedNews.length > 0) {
            await prisma.trendEvidence.createMany({
              data: unassignedNews.map((item) => ({
                project_id: task.project_id,
                trend_topic_id: fallbackTopic.id,
                platform: task.platform ?? task.project.primary_platform ?? "YOUTUBE",
                evidence_type: "NEWS",
                signal_metric: "SEARCH_VOLUME",
                evidence_label: item.title,
                signal_value: Math.round(item.score * 100),
                source_url: item.url,
                published_at: new Date(item.published_at),
                raw_payload: toJson(item),
              })),
            });
          }
        }
      }

      return {
        task_id: task.id,
        result,
        trend_topics: trendTopics,
        news_result: newsResult,
      };
    } catch (error) {
      await prisma.researchTask.update({
        where: { id: task.id },
        data: {
          task_status: "FAILED",
          error_message: error instanceof Error ? error.message : "Trend research failed.",
          finished_at: new Date(),
        },
      });
      throw error;
    }
  }
}
