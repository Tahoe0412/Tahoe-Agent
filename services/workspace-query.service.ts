import { prisma } from "@/lib/db";
import { getCopyLengthMeta, getUsageScenarioMeta } from "@/lib/copy-goal";
import { resolveProjectIntentFromMetadata } from "@/lib/project-intent";
import { analyzeStyleReferenceSample, normalizeStyleReferenceInsight } from "@/lib/style-reference";
import { getStyleTemplateMeta } from "@/lib/style-template";
import { getWritingModeMeta } from "@/lib/writing-mode";

function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toClientSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function taskHasKind(taskJson: unknown, kind: string) {
  return ((taskJson as Record<string, unknown> | null)?.kind as string | undefined) === kind;
}

function scoreFromTopic(topic: { momentum_score: number; summary_json: unknown }) {
  const summary = (topic.summary_json ?? {}) as Record<string, number>;
  return {
    total: topic.momentum_score,
    reach: Math.round(summary.reach_score ?? topic.momentum_score * 0.92),
    engagement: Math.round(summary.engagement_score ?? topic.momentum_score * 0.86),
    velocity: Math.round(summary.velocity_score ?? topic.momentum_score * 0.8),
    crossPlatform: Math.round(summary.cross_platform_score ?? 50),
    producibility: Math.round(summary.ai_producibility_score ?? 70),
    brandFit: Math.round(summary.brand_fit_score ?? 70),
  };
}

export class WorkspaceQueryService {
  async listBrandProfiles() {
    return prisma.brandProfile.findMany({
      include: {
        content_pillars: {
          orderBy: [{ priority_score: "desc" }, { updated_at: "desc" }],
        },
        projects: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: [{ updated_at: "desc" }],
    });
  }

  async listIndustryTemplates() {
    return prisma.industryTemplate.findMany({
      include: {
        competitor_profiles: true,
        industry_research_snapshots: {
          orderBy: { created_at: "desc" },
          take: 2,
        },
        projects: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: [{ updated_at: "desc" }],
    });
  }

  async listRecentProjects(limit = 12) {
    const projects = await prisma.project.findMany({
      take: Math.max(limit * 4, 36),
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        title: true,
        topic_query: true,
        created_at: true,
        status: true,
        metadata: true,
      },
    });

    return [...projects]
      .sort((a, b) => {
        const aMeta = (a.metadata as Record<string, unknown> | null) ?? {};
        const bMeta = (b.metadata as Record<string, unknown> | null) ?? {};
        const aPinned = aMeta.is_pinned === true ? 1 : 0;
        const bPinned = bMeta.is_pinned === true ? 1 : 0;
        if (aPinned !== bPinned) {
          return bPinned - aPinned;
        }

        const aOpened = aMeta.last_opened_at ? new Date(String(aMeta.last_opened_at)).getTime() : 0;
        const bOpened = bMeta.last_opened_at ? new Date(String(bMeta.last_opened_at)).getTime() : 0;
        if (aOpened !== bOpened) {
          return bOpened - aOpened;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, limit)
      .map((project) => ({
        id: project.id,
        title: project.title,
        topic_query: project.topic_query,
        created_at: project.created_at,
        status: project.status,
        is_pinned: ((project.metadata as Record<string, unknown> | null)?.is_pinned as boolean | undefined) ?? false,
      }));
  }

  async listProjects(limit = 24) {
    const projects = await prisma.project.findMany({
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
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

    return projects.map((project) => {
      const intent = resolveProjectIntentFromMetadata(
        (project.metadata as Record<string, unknown> | null) ?? undefined,
      );

      return {
        id: project.id,
        title: project.title,
        topic_query: project.topic_query,
        status: project.status,
        created_at: project.created_at,
        workspace_mode: intent.workspaceMode,
        content_line: intent.contentLine,
        output_type: intent.outputType,
        project_tags: (((project.metadata as Record<string, unknown> | null)?.project_tags as string[] | undefined) ?? []).slice(0, 12),
        is_pinned: ((project.metadata as Record<string, unknown> | null)?.is_pinned as boolean | undefined) ?? false,
        last_opened_at: ((project.metadata as Record<string, unknown> | null)?.last_opened_at as string | undefined) ?? null,
        brand_profile_id: project.brand_profile_id,
        industry_template_id: project.industry_template_id,
        trend_count: project.trend_topics.length,
        brief_count: project.creative_briefs.length,
        storyboard_count: project.storyboards.length,
        scene_count: project.scripts.flatMap((script) => script.script_scenes).length,
      };
    });
  }

  async getProjectWorkspace(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand_profile: {
          include: {
            content_pillars: {
              orderBy: [{ priority_score: "desc" }, { updated_at: "desc" }],
            },
          },
        },
        industry_template: {
          include: {
            competitor_profiles: true,
          },
        },
        campaign_sprints: {
          orderBy: [{ created_at: "desc" }],
        },
        strategy_tasks: {
          orderBy: [{ priority_score: "desc" }, { created_at: "desc" }],
        },
        platform_adaptations: {
          orderBy: [{ created_at: "desc" }],
        },
        compliance_checks: {
          orderBy: [{ created_at: "desc" }],
        },
        optimization_reviews: {
          orderBy: [{ created_at: "desc" }],
        },
        trend_topics: {
          include: {
            trend_evidences: true,
          },
          orderBy: { momentum_score: "desc" },
        },
        platform_contents: {
          select: {
            platform: true,
          },
        },
        creative_briefs: {
          include: {
            constraints: true,
          },
          orderBy: { version_number: "desc" },
        },
        approval_gates: {
          orderBy: [{ created_at: "desc" }],
        },
        storyboards: {
          include: {
            frames: {
              include: {
                references: true,
              },
              orderBy: { frame_order: "asc" },
            },
          },
          orderBy: { version_number: "desc" },
        },
        render_jobs: {
          include: {
            render_assets: true,
          },
          orderBy: { created_at: "desc" },
        },
        scripts: {
          include: {
            script_scenes: {
              include: {
                scene_classifications: {
                  orderBy: { created_at: "desc" },
                  take: 1,
                },
                required_assets: {
                  orderBy: { created_at: "desc" },
                  take: 1,
                },
              },
              orderBy: { scene_order: "asc" },
            },
          },
          orderBy: { version_number: "desc" },
        },
        uploaded_assets: true,
        research_reports: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (!project) {
      return null;
    }

    const latestScript = project.scripts[0] ?? null;
    const scenes = latestScript?.script_scenes ?? [];
    const readyScenes = scenes.filter((scene) => scene.required_assets[0]?.is_asset_ready);
    const difficultyScores = scenes.map((scene) => scene.scene_classifications[0]?.difficulty_score ?? 0).filter(Boolean);
    const intent = resolveProjectIntentFromMetadata(
      (project.metadata as Record<string, unknown> | null) ?? undefined,
    );
    const workspaceMode = intent.workspaceMode;

    const dashboardMetrics = [
      { label: "Active Trends", value: String(project.trend_topics.length), caption: "已评分趋势主题" },
      { label: "Scenes", value: String(scenes.length), caption: "当前脚本场景数" },
      {
        label: "Asset Readiness",
        value: `${scenes.length === 0 ? 0 : Math.round((readyScenes.length / scenes.length) * 100)}%`,
        caption: "当前脚本素材齐备率",
      },
      { label: "Avg Difficulty", value: String(Math.round(average(difficultyScores) || 0)), caption: "场景平均制作难度" },
    ];

    const trendRows = project.trend_topics.map((topic) => {
      const scores = scoreFromTopic(topic);
      const sourcePlatforms = [...new Set(topic.trend_evidences.map((evidence) => evidence.platform))];
      const sourceEvidenceMap = sourcePlatforms.map((platform) => ({
        platform,
        count: topic.trend_evidences.filter((evidence) => evidence.platform === platform).length,
      }));
      return {
        topic: topic.topic_key,
        label: topic.topic_label,
        ...scores,
        platforms: sourcePlatforms.length > 0 ? sourcePlatforms.join(" / ") : topic.platform_priority ? topic.platform_priority : "N/A",
        sourcePlatforms,
        sourceEvidenceMap,
        evidence: topic.trend_evidences.length,
        summary: `evidence ${topic.trend_evidences.length} · stage ${topic.trend_stage}`,
      };
    });

    const uploadedAssets = project.uploaded_assets;

    const scriptLabRows = scenes.map((scene) => {
      const classification = scene.scene_classifications[0];
      const requiredAssets = scene.required_assets[0];
      const assetRows = ((requiredAssets?.required_assets_json as Array<{ asset_code: string; required: boolean }> | null) ?? [])
        .filter((asset) => asset.required)
        .map((asset) => asset.asset_code);
      const sceneUploadedAssets = uploadedAssets
        .filter((asset) => asset.script_scene_id === scene.id || asset.continuity_group === scene.continuity_group)
        .map((asset) => ({
          id: asset.id,
          type: asset.asset_type,
          fileName: asset.file_name,
          continuityGroup: asset.continuity_group,
          fileUrl: asset.file_url,
        }));

      return {
        id: scene.id,
        sceneOrder: scene.scene_order,
        originalText: scene.original_text,
        rewritten: scene.rewritten_for_ai,
        shotGoal: scene.shot_goal,
        durationSec: scene.duration_sec,
        visualPriority: (scene.visual_priority as string[] | null) ?? [],
        avoid: (scene.avoid as string[] | null) ?? [],
        labels: classification
          ? [
              classification.human_type,
              classification.motion_type,
              classification.lip_sync_type,
              classification.production_class,
            ]
          : [],
        classification: classification
          ? {
              humanType: classification.human_type,
              motionType: classification.motion_type,
              lipSyncType: classification.lip_sync_type,
              assetDependencyType: classification.asset_dependency_type,
              productionClass: classification.production_class,
              difficultyScore: classification.difficulty_score,
              riskFlags: (classification.risk_flags as string[] | null) ?? [],
            }
          : null,
        assets: assetRows,
        assetReady: requiredAssets?.is_asset_ready ?? false,
        missingAssets: ((requiredAssets?.missing_asset_hints as string[] | null) ?? []).slice(0, 6),
        uploadedAssets: sceneUploadedAssets,
        continuityGroup: scene.continuity_group,
      };
    });

    const latestStoryboard = project.storyboards[0] ?? null;
    const storyboardFrames = latestStoryboard?.frames ?? [];
    const promotionalCopyTasks = project.strategy_tasks.filter((task) => task.task_type === "SCRIPT" && taskHasKind(task.task_json, "PROMOTIONAL_COPY"));
    const videoTitleTasks = project.strategy_tasks.filter((task) => task.task_type === "SCRIPT" && taskHasKind(task.task_json, "VIDEO_TITLE_PACK"));
    const publishCopyTasks = project.strategy_tasks.filter((task) => task.task_type === "SCRIPT" && taskHasKind(task.task_json, "PUBLISH_COPY"));
    const adCreativeTasks = project.strategy_tasks.filter((task) => taskHasKind(task.task_json, "AD_CREATIVE"));

    const scenePlannerRows = scenes.map((scene) => {
      const classification = scene.scene_classifications[0];
      const requiredAssets = scene.required_assets[0];
      const requiredAssetItems =
        ((requiredAssets?.required_assets_json as Array<{ asset_code: string; required: boolean; reason?: string }> | null) ?? []).filter(
          (asset) => asset.required,
        );
      const matchedFrame =
        storyboardFrames.find((frame) => frame.script_scene_id === scene.id) ??
        storyboardFrames.find((frame) => frame.continuity_group && frame.continuity_group === scene.continuity_group) ??
        storyboardFrames.find((frame) => frame.frame_order === scene.scene_order) ??
        null;
      const sceneUploadedAssets = uploadedAssets
        .filter((asset) => asset.script_scene_id === scene.id || asset.continuity_group === scene.continuity_group)
        .map((asset) => ({
          id: asset.id,
          type: asset.asset_type,
          fileName: asset.file_name,
          continuityGroup: asset.continuity_group,
          fileUrl: asset.file_url,
        }));

      return {
        id: scene.id,
        sceneOrder: scene.scene_order,
        frameId: matchedFrame?.id ?? null,
        frameOrder: matchedFrame?.frame_order ?? scene.scene_order,
        frameStatus: matchedFrame?.frame_status ?? "DRAFT",
        frameTitle: matchedFrame?.frame_title ?? scene.shot_goal,
        rewritten: scene.rewritten_for_ai,
        shotGoal: scene.shot_goal,
        durationSec: scene.duration_sec,
        continuityGroup: scene.continuity_group,
        productionClass: classification?.production_class ?? "N/A",
        difficulty: classification?.difficulty_score ?? 0,
        riskFlags: ((classification?.risk_flags as string[] | null) ?? []).slice(0, 6),
        assetReady: requiredAssets?.is_asset_ready ?? false,
        requiredAssets: requiredAssetItems.map((asset) => asset.asset_code),
        uploadedAssets: sceneUploadedAssets,
        missing: ((requiredAssets?.missing_asset_hints as string[] | null) ?? []).slice(0, 4),
        cameraPlan: matchedFrame?.camera_plan ?? null,
        motionPlan: matchedFrame?.motion_plan ?? null,
        compositionNotes: matchedFrame?.composition_notes ?? null,
        visualPrompt: matchedFrame?.visual_prompt ?? null,
        onScreenText: matchedFrame?.on_screen_text ?? null,
        narrationText: matchedFrame?.narration_text ?? null,
        referenceCount: matchedFrame?.references.length ?? 0,
        storyboardVersion: latestStoryboard?.version_number ?? null,
        references:
          matchedFrame?.references.map((reference) => ({
            id: reference.id,
            type: reference.reference_type,
            label: reference.source_label ?? reference.file_name ?? reference.reference_type,
            fileUrl: reference.file_url,
          })) ?? [],
      };
    });

    const priorities = [
      project.brand_profile
        ? `当前项目已绑定品牌“${project.brand_profile.brand_name}”，可直接继承品牌语气与禁用表达。`
        : "当前项目还未绑定品牌档案，建议先完成品牌配置。",
      project.industry_template
        ? `当前项目已绑定行业模板“${project.industry_template.industry_name}”，可直接复用竞品与风险词库。`
        : "当前项目还未绑定行业模板，建议先完成行业边界配置。",
      project.trend_topics[0]
        ? `当前最高分趋势是“${project.trend_topics[0].topic_label}”，建议用于开场或封面主钩子。`
        : "尚未生成趋势主题，建议先运行 trend research。",
      latestScript
        ? `当前最新脚本版本为 v${latestScript.version_number}，共 ${scenes.length} 个 scene。`
        : "尚未生成脚本重构结果，建议先执行 script rewrite。",
      readyScenes.length < scenes.length
        ? `仍有 ${scenes.length - readyScenes.length} 个 scene 缺少关键素材。`
        : "当前场景素材齐备，可进入生成或分镜阶段。",
      project.campaign_sprints[0]
        ? `当前执行周期为“${project.campaign_sprints[0].sprint_name}”，建议围绕同一周期管理改写、合规与复盘。`
        : "当前项目还未创建执行周期，建议先设定 Campaign / Sprint。",
    ];

    const styleReferenceSample = (((project.metadata as Record<string, unknown> | null)?.style_reference_sample as string | undefined) ?? "").trim();
    const styleReferenceInsight = normalizeStyleReferenceInsight(analyzeStyleReferenceSample(styleReferenceSample));

    return toClientSafe({
      project,
      workspaceMode,
      contentLine: intent.contentLine,
      outputType: intent.outputType,
      projectSummary: {
        introduction: (((project.metadata as Record<string, unknown> | null)?.project_introduction as string | undefined) ?? "").trim(),
        coreIdea: ((((project.metadata as Record<string, unknown> | null)?.core_idea as string | undefined) ?? "").trim()) || project.topic_query,
        originalScript: project.raw_script_text ?? "",
        styleReferenceSample,
        styleReferenceInsight,
        writingMode: ((project.metadata as Record<string, unknown> | null)?.writing_mode as string | undefined) ?? "PRODUCT_PROMO",
        writingModeLabel: getWritingModeMeta((((project.metadata as Record<string, unknown> | null)?.writing_mode as string | undefined) ?? "PRODUCT_PROMO") as never, "zh").label,
        styleTemplate: ((project.metadata as Record<string, unknown> | null)?.style_template as string | undefined) ?? "RATIONAL_PRO",
        styleTemplateLabel: getStyleTemplateMeta((((project.metadata as Record<string, unknown> | null)?.style_template as string | undefined) ?? "RATIONAL_PRO") as never, "zh").label,
        copyLength: ((project.metadata as Record<string, unknown> | null)?.copy_length as string | undefined) ?? "STANDARD",
        copyLengthLabel: getCopyLengthMeta((((project.metadata as Record<string, unknown> | null)?.copy_length as string | undefined) ?? "STANDARD") as never, "zh").label,
        usageScenario: ((project.metadata as Record<string, unknown> | null)?.usage_scenario as string | undefined) ?? "XIAOHONGSHU_POST",
        usageScenarioLabel: getUsageScenarioMeta((((project.metadata as Record<string, unknown> | null)?.usage_scenario as string | undefined) ?? "XIAOHONGSHU_POST") as never, "zh").label,
      },
      marketingOverview: {
        brandProfile: project.brand_profile
          ? {
              id: project.brand_profile.id,
              brandName: project.brand_profile.brand_name,
              brandStage: project.brand_profile.brand_stage,
              brandVoice: project.brand_profile.brand_voice,
              pillarCount: project.brand_profile.content_pillars.length,
              forbiddenPhraseCount: ((project.brand_profile.forbidden_phrases as string[] | null) ?? []).length,
              platformPriority: ((project.brand_profile.platform_priority as string[] | null) ?? []).slice(0, 6),
            }
          : null,
        industryTemplate: project.industry_template
          ? {
              id: project.industry_template.id,
              industryName: project.industry_template.industry_name,
              competitorCount: project.industry_template.competitor_profiles.length,
              recommendedDirections: ((project.industry_template.recommended_topic_directions as string[] | null) ?? []).slice(0, 6),
              forbiddenTermCount: ((project.industry_template.forbidden_terms as string[] | null) ?? []).length,
            }
          : null,
        latestSprint: project.campaign_sprints[0]
          ? {
              id: project.campaign_sprints[0].id,
              name: project.campaign_sprints[0].sprint_name,
              status: project.campaign_sprints[0].sprint_status,
              goal: project.campaign_sprints[0].sprint_goal,
            }
          : null,
        strategyTasks: project.strategy_tasks.slice(0, 8).map((task) => ({
          id: task.id,
          title: task.task_title,
          type: task.task_type,
          status: task.task_status,
          priority: task.priority_score,
          owner: task.owner_label,
          summary: task.task_summary,
          taskJson: task.task_json,
          createdAt: task.created_at,
        })),
        latestPromotionalCopy: promotionalCopyTasks
          .slice(0, 1)
          .map((task) => ({
            id: task.id,
            title: task.task_title,
            summary: task.task_summary,
            taskJson: task.task_json,
            createdAt: task.created_at,
          }))[0] ?? null,
        promotionalCopyVersions: promotionalCopyTasks
          .slice(0, 12)
          .map((task) => ({
            id: task.id,
            title: task.task_title,
            summary: task.task_summary,
            createdAt: task.created_at,
            taskJson: task.task_json,
          })),
        latestAdCreative: adCreativeTasks
          .slice(0, 1)
          .map((task) => ({
            id: task.id,
            title: task.task_title,
            summary: task.task_summary,
            createdAt: task.created_at,
            taskJson: task.task_json,
          }))[0] ?? null,
        adCreativeVersions: adCreativeTasks
          .slice(0, 8)
          .map((task) => ({
            id: task.id,
            title: task.task_title,
            summary: task.task_summary,
            createdAt: task.created_at,
            taskJson: task.task_json,
          })),
        storyboardSummary: {
          latestStoryboardId: latestStoryboard?.id ?? null,
          versionNumber: latestStoryboard?.version_number ?? null,
          frameCount: storyboardFrames.length,
          readyFrameCount: storyboardFrames.filter((frame) => frame.frame_status === "READY" || frame.frame_status === "LOCKED").length,
          sceneCount: scenes.length,
        },
        platformAdaptations: project.platform_adaptations.slice(0, 8).map((item) => ({
          id: item.id,
          surface: item.platform_surface,
          status: item.adaptation_status,
          title: item.title_text,
          hook: item.hook_text,
          body: item.body_text,
          createdAt: item.created_at,
          structuredOutput: item.structured_output,
        })),
        complianceChecks: project.compliance_checks.slice(0, 8).map((item) => ({
          id: item.id,
          status: item.check_status,
          targetType: item.target_type,
          targetId: item.target_id,
          needsReview: item.needs_human_review,
          issueCount: (Array.isArray(item.flagged_issues_json) ? item.flagged_issues_json : []).length,
          summary: item.risk_summary,
          flaggedIssues: item.flagged_issues_json,
          sensitiveHits: item.sensitive_hits_json,
          createdAt: item.created_at,
        })),
        optimizationReviews: project.optimization_reviews.slice(0, 8).map((item) => ({
          id: item.id,
          title: item.review_title,
          theme: item.content_theme,
          platform: item.platform_surface,
          summary: item.optimization_summary,
          nextCount: ((item.next_recommendations as string[] | null) ?? []).length,
        })),
      },
      marsOutputs: {
        latestVideoTitlePack: videoTitleTasks
          .slice(0, 1)
          .map((task) => ({
            id: task.id,
            title: task.task_title,
            summary: task.task_summary,
            createdAt: task.created_at,
            taskJson: task.task_json,
          }))[0] ?? null,
        videoTitlePacks: videoTitleTasks.slice(0, 8).map((task) => ({
          id: task.id,
          title: task.task_title,
          summary: task.task_summary,
          createdAt: task.created_at,
          taskJson: task.task_json,
        })),
        latestPublishCopy: publishCopyTasks
          .slice(0, 1)
          .map((task) => ({
            id: task.id,
            title: task.task_title,
            summary: task.task_summary,
            createdAt: task.created_at,
            taskJson: task.task_json,
          }))[0] ?? null,
        publishCopyPacks: publishCopyTasks.slice(0, 8).map((task) => ({
          id: task.id,
          title: task.task_title,
          summary: task.task_summary,
          createdAt: task.created_at,
          taskJson: task.task_json,
        })),
      },
      latestBrief: project.creative_briefs[0] ?? null,
      latestStoryboard,
      latestApprovalByStage: Object.fromEntries(project.approval_gates.map((gate) => [gate.stage, gate])),
      latestRenderJobs: project.render_jobs.slice(0, 8),
      dashboardMetrics,
      platformCoverage: {
        connected: [...new Set(project.platform_contents.map((item) => item.platform))],
        planned: ["TIKTOK", "XIAOHONGSHU", "DOUYIN"],
      },
      trendRows,
      scriptLabRows,
      scenePlannerRows,
      priorities,
      latestReport: project.research_reports[0] ?? null,
      latestScriptPreview: latestScript
        ? {
            id: latestScript.id,
            title: latestScript.title,
            originalText: latestScript.original_text,
            structuredOutput: latestScript.structured_output,
            rawPayload: latestScript.raw_payload,
            modelName: latestScript.model_name,
            sourceType: latestScript.source_type,
            createdAt: latestScript.created_at,
          }
        : null,
    });
  }
}
