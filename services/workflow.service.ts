import { prisma } from "@/lib/db";
import { getWorkspaceMode } from "@/lib/workspace-mode";
import { AssetDependencyAnalyzerService } from "@/services/asset-dependency-analyzer.service";
import { ComplianceCheckService } from "@/services/compliance-check.service";
import { PromotionalCopyService } from "@/services/promotional-copy.service";
import { ReportService } from "@/services/report.service";
import { ResearchJobService } from "@/services/research-job.service";
import { SceneClassificationService } from "@/services/scene-classification.service";
import { ScriptRewriterService } from "@/services/script-rewriter.service";
import { ScriptService } from "@/services/script.service";

type PlatformValue = "YOUTUBE" | "X" | "TIKTOK";

function readRequestedPlatforms(project: { primary_platform: PlatformValue | null; metadata: unknown }): PlatformValue[] {
  const metadata = (project.metadata ?? {}) as { requested_platforms?: PlatformValue[] };
  if (metadata.requested_platforms && metadata.requested_platforms.length > 0) {
    return metadata.requested_platforms;
  }

  return [project.primary_platform ?? "YOUTUBE"];
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

    if (!project.raw_script_text) {
      throw new Error("Project raw script is empty.");
    }

    const rawScriptText = project.raw_script_text;
    const platforms = readRequestedPlatforms(project);
    const metadata = (project.metadata ?? {}) as { mock_mode?: boolean };
    const workspaceMode = getWorkspaceMode((project.metadata as { workspace_mode?: unknown } | null)?.workspace_mode);

    const jobGroup = await this.runStep("trend_job_create", () =>
      this.researchJobService.createJob({
        projectId,
        platforms,
        topicQuery: project.topic_query,
        mockMode: metadata.mock_mode ?? true,
      }),
    );

    const trendRuns = [];
    for (const task of jobGroup.tasks) {
      trendRuns.push(await this.runStep(`trend_task:${task.platform ?? "UNKNOWN"}`, () => this.researchJobService.runTask(task.id)));
    }

    if (workspaceMode !== "SHORT_VIDEO") {
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
        workflow_mode: workspaceMode,
        promotional_copy_task_id: promotionalCopy.strategy_task_id,
        adaptation_count: promotionalCopy.platform_adaptation_count,
        compliance_check_count: complianceRuns.length,
        report_id: report.id,
      };
    }

    const existingUserScript = await prisma.script.findFirst({
      where: {
        project_id: projectId,
        source_type: "USER_INPUT",
      },
      orderBy: { created_at: "asc" },
    });

    const userScript =
      existingUserScript ??
      (await this.runStep("user_script_create", () =>
        this.scriptService.createUserScript({
          projectId,
          title: project.title,
          originalText: rawScriptText,
        }),
      ));

    const rewrittenScript = await this.runStep("script_rewrite", () =>
      this.scriptRewriterService.rewriteAndSave({
        projectId,
        title: project.title,
        scriptText: rawScriptText,
      }),
    );

    const sceneResults = [];
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
        classification,
        assets,
      });
    }

    const report = await this.runStep("report_generate", () => this.reportService.generateProjectReport(projectId));

    return {
      job_group_id: jobGroup.job_group_id,
      trend_task_count: trendRuns.length,
      user_script_id: userScript.id,
      rewritten_script_id: rewrittenScript.id,
      scene_count: rewrittenScript.script_scenes.length,
      report_id: report.id,
      scene_results: sceneResults.map((item) => ({
        scene_id: item.scene_id,
        scene_order: item.scene_order,
        production_class: item.classification.classification.production_class,
        difficulty_score: item.classification.classification.difficulty_score,
        is_asset_ready: item.assets.is_asset_ready,
      })),
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
}
