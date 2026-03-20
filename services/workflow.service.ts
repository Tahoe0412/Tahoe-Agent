import { prisma } from "@/lib/db";
import { resolveProjectIntentFromMetadata } from "@/lib/project-intent";
import { AssetDependencyAnalyzerService } from "@/services/asset-dependency-analyzer.service";
import { ComplianceCheckService } from "@/services/compliance-check.service";
import { PromotionalCopyService } from "@/services/promotional-copy.service";
import { ReportService } from "@/services/report.service";
import { ResearchJobService } from "@/services/research-job.service";
import { SceneClassificationService } from "@/services/scene-classification.service";
import { ScriptRewriterService } from "@/services/script-rewriter.service";
import { ScriptService } from "@/services/script.service";
import { StoryboardGeneratorService } from "@/services/storyboard-generator.service";

type PlatformValue = "YOUTUBE" | "X" | "TIKTOK" | "XHS" | "DOUYIN";

function readRequestedPlatforms(project: { primary_platform: PlatformValue | null; metadata: unknown }): PlatformValue[] {
  const metadata = (project.metadata ?? {}) as { requested_platforms?: PlatformValue[] };
  if (metadata.requested_platforms && metadata.requested_platforms.length > 0) {
    return metadata.requested_platforms;
  }

  return [project.primary_platform ?? "YOUTUBE"];
}

export function resolveWorkflowResearchMockMode(metadata: { mock_mode?: boolean } | null | undefined) {
  return typeof metadata?.mock_mode === "boolean" ? metadata.mock_mode : false;
}

export class WorkflowService {
  private readonly researchJobService = new ResearchJobService();
  private readonly scriptService = new ScriptService();
  private readonly scriptRewriterService = new ScriptRewriterService();
  private readonly sceneClassificationService = new SceneClassificationService();
  private readonly assetDependencyAnalyzerService = new AssetDependencyAnalyzerService();
  private readonly reportService = new ReportService();
  private readonly promotionalCopyService = new PromotionalCopyService();
  private readonly complianceCheckService = new ComplianceCheckService();
  private readonly storyboardGeneratorService = new StoryboardGeneratorService();

  async runFullWorkflow(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        topic_query: true,
        raw_script_text: true,
        primary_platform: true,
        metadata: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    const rawScriptText = project.raw_script_text?.trim() ? project.raw_script_text : null;
    const platforms = readRequestedPlatforms(project);
    const metadata = (project.metadata ?? {}) as { mock_mode?: boolean };
    const intent = resolveProjectIntentFromMetadata(
      (project.metadata as Record<string, unknown> | null) ?? undefined,
    );

    const jobGroup = await this.runStep("trend_job_create", () =>
      this.researchJobService.createJob({
        projectId,
        platforms,
        topicQuery: project.topic_query,
        mockMode: resolveWorkflowResearchMockMode(metadata),
      }),
    );

    const trendRuns = [];
    for (const task of jobGroup.tasks) {
      trendRuns.push(await this.runStep(`trend_task:${task.platform ?? "UNKNOWN"}`, () => this.researchJobService.runTask(task.id)));
    }

    if (intent.workflowKind === "MARKETING") {
      const promotionalCopy = await this.runStep("promotional_copy", () => this.promotionalCopyService.generateForProject(projectId));
      const complianceRuns = [];
      for (const adaptationId of promotionalCopy.platform_adaptation_ids) {
        complianceRuns.push(
          await this.runStep(`compliance:${adaptationId}`, () =>
            this.complianceCheckService.run(projectId, {
              target_type: "PLATFORM_ADAPTATION",
              target_id: adaptationId,
              platform_adaptation_id: adaptationId,
            }),
          ),
        );
      }
      const report = await this.runStep("report_generate", () => this.reportService.generateProjectReport(projectId));

      return {
        job_group_id: jobGroup.job_group_id,
        trend_task_count: trendRuns.length,
        workflow_mode: intent.workspaceMode,
        content_line: intent.contentLine,
        output_type: intent.outputType,
        promotional_copy_task_id: promotionalCopy.strategy_task_id,
        adaptation_count: promotionalCopy.platform_adaptation_count,
        compliance_check_count: complianceRuns.length,
        report_id: report.id,
      };
    }

    const shouldGenerateStoryboard =
      intent.outputType === "STORYBOARD_SCRIPT" || intent.outputType === "AD_STORYBOARD";
    let userScript: { id: string } | null = null;
    let rewrittenScript: { id: string; script_scenes: Array<{ id: string; scene_order: number }> } | null = null;
    let storyboard: { id: string; frame_count: number } | null = null;
    let sceneResults: Awaited<ReturnType<WorkflowService["collectSceneResults"]>> = [];
    let scriptGenerationStatus: "generated" | "skipped_missing_raw_script" = "generated";

    if (rawScriptText) {
      const existingUserScript = await prisma.script.findFirst({
        where: {
          project_id: projectId,
          source_type: "USER_INPUT",
        },
        orderBy: { created_at: "asc" },
        select: { id: true },
      });

      userScript =
        existingUserScript ??
        (await this.runStep("user_script_create", () =>
          this.scriptService.createUserScript({
            projectId,
            title: project.title,
            originalText: rawScriptText,
          }),
        ));

      rewrittenScript = await this.runStep("script_rewrite", () =>
        this.scriptRewriterService.rewriteAndSave({
          projectId,
          title: project.title,
          scriptText: rawScriptText,
        }),
      );
    } else {
      scriptGenerationStatus = "skipped_missing_raw_script";
    }

    if (shouldGenerateStoryboard) {
      storyboard = await this.runStep("storyboard_generate", async () => {
        const generated = await this.storyboardGeneratorService.generate({
          projectId,
          scriptId: rewrittenScript?.id,
        });

        return {
          id: generated.id,
          frame_count: generated.frame_count,
        };
      });
    } else if (rewrittenScript) {
      for (const scene of rewrittenScript.script_scenes) {
        const classification = await this.runStep(`scene_classify:${scene.scene_order}`, () =>
          this.sceneClassificationService.classifyAndSave({
            projectId,
            sceneId: scene.id,
          }),
        );
        const assets = await this.runStep(`scene_assets:${scene.scene_order}`, () =>
          this.assetDependencyAnalyzerService.analyzeAndSave({
            projectId,
            sceneId: scene.id,
          }),
        );

        sceneResults.push({
          scene_id: scene.id,
          scene_order: scene.scene_order,
          production_class: classification.classification.production_class,
          difficulty_score: classification.classification.difficulty_score,
          is_asset_ready: assets.is_asset_ready,
        });
      }
    }

    if (rewrittenScript) {
      sceneResults = await this.collectSceneResults(rewrittenScript.id);
    }

    const report = await this.runStep("report_generate", () => this.reportService.generateProjectReport(projectId));

    return {
      job_group_id: jobGroup.job_group_id,
      trend_task_count: trendRuns.length,
      workflow_mode: intent.workspaceMode,
      content_line: intent.contentLine,
      output_type: intent.outputType,
      user_script_id: userScript?.id ?? null,
      rewritten_script_id: rewrittenScript?.id ?? null,
      script_generation_status: scriptGenerationStatus,
      scene_count: sceneResults.length,
      storyboard_id: storyboard?.id ?? null,
      storyboard_frame_count: storyboard?.frame_count ?? 0,
      report_id: report.id,
      scene_results: sceneResults,
    };
  }

  async generateReportOnly(projectId: string) {
    return this.reportService.generateProjectReport(projectId);
  }

  private async runStep<T>(step: string, task: () => Promise<T>) {
    try {
      return await task();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown workflow error.";
      throw new Error(`[${step}] ${message}`);
    }
  }

  private async collectSceneResults(scriptId: string) {
    const scenes = await prisma.scriptScene.findMany({
      where: { script_id: scriptId },
      orderBy: { scene_order: "asc" },
      select: {
        id: true,
        scene_order: true,
        scene_classifications: {
          select: {
            production_class: true,
            difficulty_score: true,
          },
          orderBy: { created_at: "desc" },
          take: 1,
        },
        required_assets: {
          select: { is_asset_ready: true },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    return scenes.map((scene) => ({
      scene_id: scene.id,
      scene_order: scene.scene_order,
      production_class: scene.scene_classifications[0]?.production_class ?? null,
      difficulty_score: scene.scene_classifications[0]?.difficulty_score ?? null,
      is_asset_ready: scene.required_assets[0]?.is_asset_ready ?? false,
    }));
  }
}
