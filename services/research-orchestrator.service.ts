import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deriveProjectTitle, resolveProjectIntent } from "@/lib/project-intent";
import {
  buildGeneratedCoreIdea,
  buildGeneratedProjectIntroduction,
  buildGeneratedProjectTitle,
  buildGeneratedStyleReferenceSample,
} from "@/lib/project-brief";
import { finalResearchReportOutputSchema } from "@/schemas/ai-output";
import { projectCreateSchema, type ProjectCreateInput } from "@/schemas/project";
import { searchLatestNews } from "@/services/news-search";
import { getPlatformConnector } from "@/services/platform-connectors";
import { TrendScoringEngine } from "@/services/trend-scoring";
import type { Creator, ContentItem } from "@/types/platform-data";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function dedupeCreators(creators: Creator[]) {
  const unique = new Map<string, Creator>();
  for (const creator of creators) {
    unique.set(`${creator.platform}:${creator.external_creator_id}`, creator);
  }
  return [...unique.values()];
}

function dedupeContentItems(items: ContentItem[]) {
  const unique = new Map<string, ContentItem>();
  for (const item of items) {
    unique.set(`${item.platform}:${item.external_content_id}`, item);
  }
  return [...unique.values()];
}

export class ResearchOrchestratorService {
  private readonly trendScoringEngine = new TrendScoringEngine();

  async run(payload: ProjectCreateInput) {
    const input = projectCreateSchema.parse(payload);
    const intent = resolveProjectIntent({
      contentLine: input.contentLine,
      outputType: input.outputType,
      workspaceMode: input.workspaceMode,
    });
    const projectTitle = buildGeneratedProjectTitle({
      title: deriveProjectTitle({
        title: input.title,
        topic: input.topic,
      }),
      topicQuery: input.topic,
      workspaceMode: intent.workspaceMode,
    });
    const sourceScript = input.sourceScript.trim();
    const hasSourceScript = sourceScript.length > 0;

    const collectionResults = await Promise.all(
      input.platforms.map((platform) =>
        getPlatformConnector(platform).collect({
          topic: input.topic,
          limit: 6,
          mock: input.mockMode,
        }),
      ),
    );

    const creators = dedupeCreators(collectionResults.flatMap((result) => result.creators));
    const contentItems = dedupeContentItems(collectionResults.flatMap((result) => result.content_items));
    const trendTopics = this.trendScoringEngine.score(contentItems);
    const newsResult = await searchLatestNews({
      topic: input.topic,
      limit: 5,
    });
    const creatorTiers = [...new Set(creators.map((creator) => creator.creator_tier))];
    const contentTypes = [...new Set(contentItems.map((item) => item.content_type))];
    const productionClasses = [...new Set(contentItems.map((item) => item.production_class))];

    const reportJson = finalResearchReportOutputSchema.parse({
      report_type: "FINAL_RESEARCH",
      primary_platform: input.platforms[0],
      creator_summary: {
        creator_count: creators.length,
        top_creator_tiers: (creatorTiers.length > 0 ? creatorTiers : ["EMERGING"]).slice(0, 3),
      },
      content_summary: {
        content_count: contentItems.length,
        top_content_types: (contentTypes.length > 0 ? contentTypes : ["SHORT_VIDEO"]).slice(0, 4),
      },
      trend_summary: {
        topic_keys: (trendTopics.length > 0 ? trendTopics.map((topic) => topic.topic_key) : ["insufficient_signal"]).slice(0, 20),
        top_topic_key: trendTopics[0]?.topic_key ?? input.topic.toLowerCase().replace(/\s+/g, "_"),
      },
      script_summary: {
        version_number: hasSourceScript ? 1 : 0,
        story_structure: "PROBLEM_SOLUTION",
        shot_count: 0,
      },
      production_summary: {
        production_classes: (productionClasses.length > 0 ? productionClasses : ["UGC"]).slice(0, 5),
        required_asset_types: ["CHARACTER_BASE", "SCENE_BASE", "BROLL", "SUBTITLE"],
      },
      report_json: {
        recommendation_codes: ["RESULT_FIRST_HOOK", "FAST_PACING", "BROLL_SUPPORT"],
        risk_codes: contentItems.length === 0 ? ["MISSING_PROOF", "ASSET_GAP"] : [],
      },
    });

    const project = await prisma.project.create({
      data: {
        title: projectTitle,
        topic_query: input.topic,
        primary_platform: input.platforms[0],
        status: "COMPLETED",
        raw_script_text: hasSourceScript ? sourceScript : null,
        metadata: toJson({
          requested_platforms: input.platforms,
          mock_mode: input.mockMode ?? false,
          workspace_mode: intent.workspaceMode,
          content_line: intent.contentLine,
          output_type: intent.outputType,
          project_introduction:
            input.projectIntroduction?.trim() ||
            buildGeneratedProjectIntroduction({
              topicQuery: input.topic,
              workspaceMode: intent.workspaceMode,
              writingMode: input.writingMode,
              styleTemplate: input.styleTemplate,
              copyLength: input.copyLength,
              usageScenario: input.usageScenario,
              originalScript: sourceScript,
            }),
          core_idea:
            input.coreIdea?.trim() ||
            buildGeneratedCoreIdea({
              topicQuery: input.topic,
              workspaceMode: intent.workspaceMode,
            }),
          style_reference_sample:
            input.styleReferenceSample?.trim() ||
            buildGeneratedStyleReferenceSample({
              workspaceMode: intent.workspaceMode,
              styleTemplate: input.styleTemplate,
            }),
          writing_mode: input.writingMode ?? "PRODUCT_PROMO",
          style_template: input.styleTemplate ?? "RATIONAL_PRO",
          copy_length: input.copyLength ?? "STANDARD",
          usage_scenario: input.usageScenario ?? "XIAOHONGSHU_POST",
        }),
        research_tasks: {
          create: collectionResults.map((result) => ({
            task_type: "TREND_RESEARCH",
            task_status: result.success ? "SUCCEEDED" : "FAILED",
            platform: result.platform,
              query_text: input.topic,
            raw_payload: toJson({
              platform_result: result,
              news_result: newsResult,
            }),
            error_code: result.errors[0]?.code,
            error_message: result.errors[0]?.message,
            started_at: new Date(result.fetched_at),
            finished_at: new Date(result.fetched_at),
          })),
        },
        platform_creators: {
          create: creators.map((creator) => ({
            platform: creator.platform,
            external_creator_id: creator.external_creator_id,
            handle: creator.handle,
            display_name: creator.display_name,
            profile_url: creator.profile_url,
            follower_count: creator.follower_count,
            average_view_count: creator.average_view_count,
            creator_tier: creator.creator_tier,
            raw_payload: toJson(creator.raw_payload ?? creator),
          })),
        },
        platform_contents: {
          create: contentItems.map((item) => ({
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
          })),
        },
        trend_topics: {
          create: trendTopics.map((topic, index) => ({
            topic_key: topic.topic_key,
            topic_label: topic.topic_label,
            topic_category: index === 0 ? "CREATIVE_FORMAT" : "NARRATIVE_PATTERN",
            trend_stage: topic.scores.total_score >= 75 ? "PEAK" : topic.scores.total_score >= 55 ? "GROWING" : "EMERGING",
            platform_priority: topic.source_platforms[0],
            production_class: contentItems.find((item) => item.topic_hints.includes(topic.topic_key))?.production_class,
            momentum_score: topic.scores.total_score,
            evidence_count: topic.evidence.length,
            keyword_set: toJson([topic.topic_key]),
            summary_json: toJson(topic.scores),
            raw_payload: toJson(topic),
          })),
        },
        script_versions: hasSourceScript
          ? {
              create: [
                {
                  source_type: "USER_INPUT",
                  script_status: "ACTIVE",
                  version_number: 1,
                  content_text: sourceScript,
                  structured_output: toJson({
                    topic: input.topic,
                    source_script_text: sourceScript,
                  }),
                },
              ],
            }
          : undefined,
        research_reports: {
          create: [
            {
              report_type: "FINAL_RESEARCH",
              report_status: "PUBLISHED",
              version_number: 1,
              input_snapshot: toJson(input),
              report_json: toJson(reportJson),
              raw_payload: toJson({
                collection_results: collectionResults,
                trend_topics: trendTopics,
                news_result: newsResult,
              }),
            },
          ],
        },
      },
      include: {
        research_tasks: true,
        platform_creators: true,
        platform_contents: true,
        trend_topics: true,
        script_versions: true,
        research_reports: true,
      },
    });

    const topicIdMap = new Map(project.trend_topics.map((topic) => [topic.topic_key, topic.id]));
    const evidenceRows = trendTopics.flatMap((topic) =>
      topic.evidence.map((evidence) => ({
        project_id: project.id,
        trend_topic_id: topicIdMap.get(topic.topic_key) ?? "",
        platform: evidence.platform,
        evidence_type: "CONTENT" as const,
        signal_metric: "VIEW_COUNT" as const,
        evidence_label: evidence.title,
        signal_value: evidence.view_count,
        source_url: evidence.url,
        published_at: new Date(evidence.published_at),
        raw_payload: toJson(evidence),
      })),
    );

    if (evidenceRows.length > 0) {
      await prisma.trendEvidence.createMany({
        data: evidenceRows.filter((row) => row.trend_topic_id.length > 0),
      });
    }

    if (newsResult.items.length > 0 && project.trend_topics[0]) {
      await prisma.trendEvidence.createMany({
        data: newsResult.items.map((item) => ({
          project_id: project.id,
          trend_topic_id: project.trend_topics[0].id,
          platform: project.primary_platform ?? "YOUTUBE",
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

    const hydratedProject = await prisma.project.findUniqueOrThrow({
      where: { id: project.id },
      include: {
        research_tasks: true,
        platform_creators: true,
        platform_contents: true,
        trend_topics: {
          include: {
            trend_evidences: true,
          },
        },
        script_versions: true,
        research_reports: true,
      },
    });

    return {
      project: hydratedProject,
      collection_results: collectionResults,
      trend_topics: trendTopics,
      news_result: newsResult,
      report: reportJson,
    };
  }
}
