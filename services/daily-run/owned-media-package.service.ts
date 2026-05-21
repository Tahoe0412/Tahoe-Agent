import type { Prisma } from "@prisma/client";
import { DailyRunQueueService } from "@/services/daily-run/daily-run-queue.service";
import { prisma } from "@/lib/db";
import { getEditorialDirectionPresets } from "@/lib/editorial-direction-presets";
import {
  getOwnedMediaDirectionConfig,
  type OwnedMediaEditorialDirection,
} from "@/lib/owned-media-directions";
import type { LongFormWorthiness } from "@/lib/long-form-worthiness";
import { canUseModelRoute, resolveModelRoute } from "@/lib/model-routing";
import { NewsScriptService, type NewsItemInput } from "@/services/news-script.service";
import { AppSettingsService } from "@/services/app-settings.service";
import { ProjectOutputGeneratorService } from "@/services/project-output-generator.service";
import { StoryboardGeneratorService } from "@/services/storyboard-generator.service";
import type { ProjectOutputGenerationResult } from "@/services/project-output-generator-registry";

export type FastPackageContentLine = "OWNED_MEDIA" | "MARKETING";

export type FastPackageMaterial = NewsItemInput;

export type FastPackageStepName =
  | "MAIN_DRAFT"
  | "IMAGE_BRIEF"
  | "TITLE_PACK"
  | "PUBLISH_COPY"
  | "PLATFORM_COPY"
  | "AD_STORYBOARD";

export type FastPackageStep = {
  step: FastPackageStepName;
  ok: boolean;
  artifactId?: string;
  title?: string;
  message?: string;
  durationMs?: number;
};

export type FastPackageRequest = {
  topic: string;
  contentLine: FastPackageContentLine;
  editorialDirection?: OwnedMediaEditorialDirection;
  brandProfileId?: string | null;
  platforms?: string[];
  materials: FastPackageMaterial[];
  generateStoryboard?: boolean;
  deferPackaging?: boolean;
  worthiness?: LongFormWorthiness | null;
  dailyRunItemId?: string;
};

export type FastPackageResponse = {
  projectId: string;
  scriptId?: string;
  titleTaskId?: string;
  copyTaskId?: string;
  storyboardTaskId?: string;
  completed: number;
  failed: number;
  readiness: {
    status: "READY" | "NEEDS_REVIEW";
    score: number;
    message: string;
  };
  nextHref: string;
  packagingDeferred?: boolean;
  steps: FastPackageStep[];
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isLocalQwenUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function qwenModelsUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) {
    return trimmed.replace(/\/chat\/completions$/, "/models");
  }
  if (trimmed.endsWith("/v1")) {
    return `${trimmed}/models`;
  }
  return `${trimmed}/v1/models`;
}

async function runStep(
  step: FastPackageStepName,
  action: () => Promise<
    ProjectOutputGenerationResult | { id: string; title?: string | null } | { scriptId: string; title?: string }
  >,
): Promise<FastPackageStep> {
  const startedAt = Date.now();
  try {
    const result = await action();
    const artifactId = "artifactId" in result
      ? result.artifactId
      : "scriptId" in result
        ? result.scriptId
        : result.id;
    return {
      step,
      ok: true,
      artifactId,
      title: "title" in result ? result.title ?? undefined : undefined,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      step,
      ok: false,
      message: error instanceof Error ? error.message : "Unknown fast-package failure.",
      durationMs: Date.now() - startedAt,
    };
  }
}

export class OwnedMediaPackageService {
  private readonly appSettingsService = new AppSettingsService();
  private readonly newsScriptService = new NewsScriptService();
  private readonly storyboardGeneratorService = new StoryboardGeneratorService();
  private readonly projectOutputGeneratorService = new ProjectOutputGeneratorService();
  private readonly dailyRunQueueService = new DailyRunQueueService();

  async generateFastPackage(input: FastPackageRequest): Promise<FastPackageResponse> {
    if (input.materials.length === 0) {
      throw new Error("至少需要一条素材才能生成热点长文包。");
    }

    if (input.contentLine === "MARKETING") {
      return this.generateMarketingPackage(input);
    }

    const settings = await this.appSettingsService.getEffectiveSettings();
    const resolved = resolveModelRoute("PROMOTIONAL_COPY", settings);
    if (!canUseModelRoute("PROMOTIONAL_COPY", settings) && !resolved.didFallback) {
      throw new Error(
        "本地 Qwen / PROMOTIONAL_COPY 路由不可用。请先配置 QWEN_BASE_URL、LOCAL_QWEN_BASE_URL 或 Qwen API key，并关闭 LLM mock mode。",
      );
    }
    // Only check local Qwen readiness if the resolved route actually uses local Qwen
    if (!resolved.didFallback) {
      await this.assertPromotionalCopyRouteReady(settings);
    }

    const direction = getOwnedMediaDirectionConfig(input.editorialDirection);
    const steps: FastPackageStep[] = [];
    const draftStartedAt = Date.now();
    const draftResult = await this.newsScriptService.generate({
      searchQuery: input.topic,
      newsItems: input.materials,
      contentLine: "MARS_CITIZEN",
      outputType: "NARRATIVE_SCRIPT",
      editorialDirection: direction.label,
      strictModel: true,
    });
    steps.push({
      step: "MAIN_DRAFT",
      ok: true,
      artifactId: draftResult.scriptId,
      title: draftResult.title,
      durationMs: Date.now() - draftStartedAt,
    });

    if (input.dailyRunItemId) {
      await this.dailyRunQueueService.updateStatus(input.dailyRunItemId, "DRAFTING", {
        projectId: draftResult.projectId,
      }).catch((error) => {
        console.warn("[daily-run] Failed to update DailyRunItem status to DRAFTING:", error);
      });
    }

    await this.patchOwnedMediaProject({
      projectId: draftResult.projectId,
      title: draftResult.title || input.topic,
      topic: input.topic,
      direction: direction.label,
      brandProfileId: input.brandProfileId,
      platforms: input.platforms ?? ["TOUTIAO"],
      materials: input.materials,
      worthiness: input.worthiness ?? null,
    });

    if (input.deferPackaging) {
      await this.patchFastPackageStatus(draftResult.projectId, "RUNNING");
      void this.runOwnedMediaPackagingSteps({
        projectId: draftResult.projectId,
        scriptId: draftResult.scriptId,
        generateStoryboard: input.generateStoryboard,
        parallel: false,
      }).then((deferredSteps) => {
        const failed = deferredSteps.filter((step) => !step.ok);
        void this.patchFastPackageStatus(
          draftResult.projectId,
          failed.length > 0 ? "FAILED" : "DONE",
          deferredSteps,
        ).catch((error) => {
          console.warn("[daily-run] Failed to record deferred owned-media packaging status:", error);
        });
        if (input.dailyRunItemId) {
          void this.dailyRunQueueService.updateStatus(
            input.dailyRunItemId,
            failed.length > 0 ? "FAILED" : "PACKAGE_READY",
            failed.length > 0 ? { errorMessage: "部分产物生成失败" } : undefined,
          ).catch((err) => {
            console.warn("[daily-run] Failed to update DailyRunItem status after deferred packaging:", err);
          });
        }
        if (failed.length > 0) {
          console.warn("[daily-run] Deferred owned-media packaging partially failed:", failed);
        }
      }).catch((error) => {
        void this.patchFastPackageStatus(draftResult.projectId, "FAILED").catch((statusError) => {
          console.warn("[daily-run] Failed to record deferred owned-media packaging failure:", statusError);
        });
        console.warn("[daily-run] Deferred owned-media packaging failed:", error);
      });

      return this.buildResponse({
        projectId: draftResult.projectId,
        scriptId: draftResult.scriptId,
        steps,
        nextHref: `/script-lab?projectId=${draftResult.projectId}`,
        packagingDeferred: true,
      });
    }

    steps.push(...(await this.runOwnedMediaPackagingSteps({
      projectId: draftResult.projectId,
      scriptId: draftResult.scriptId,
      generateStoryboard: input.generateStoryboard,
      parallel: true,
    })));

    if (input.dailyRunItemId) {
      const syncFailed = steps.some((step) => !step.ok);
      await this.dailyRunQueueService.updateStatus(
        input.dailyRunItemId,
        syncFailed ? "FAILED" : "PACKAGE_READY",
        syncFailed ? { errorMessage: "部分产物生成失败" } : undefined,
      ).catch((err) => {
        console.warn("[daily-run] Failed to update DailyRunItem status after sync packaging:", err);
      });
    }

    return this.buildResponse({
      projectId: draftResult.projectId,
      scriptId: draftResult.scriptId,
      steps,
      nextHref: `/script-lab?projectId=${draftResult.projectId}`,
    });
  }

  private async runOwnedMediaPackagingSteps(params: {
    projectId: string;
    scriptId: string;
    generateStoryboard?: boolean;
    parallel?: boolean;
  }) {
    const packagingSteps = [
      ...(params.generateStoryboard !== false
        ? [
            () => runStep("IMAGE_BRIEF", () =>
              this.storyboardGeneratorService.generate({
                projectId: params.projectId,
                scriptId: params.scriptId,
              }),
            ),
          ]
        : []),
      () => runStep("TITLE_PACK", () =>
        this.projectOutputGeneratorService.generate(params.projectId, "VIDEO_TITLE"),
      ),
      () => runStep("PUBLISH_COPY", () =>
        this.projectOutputGeneratorService.generate(params.projectId, "PUBLISH_COPY"),
      ),
    ];

    if (params.parallel === false) {
      const results: FastPackageStep[] = [];
      for (const packagingStep of packagingSteps) {
        results.push(await packagingStep());
      }
      return results;
    }

    return Promise.all(packagingSteps.map((packagingStep) => packagingStep()));
  }

  private async assertPromotionalCopyRouteReady(settings: Awaited<ReturnType<AppSettingsService["getEffectiveSettings"]>>) {
    const route = settings.llmRouting.PROMOTIONAL_COPY;
    if (route.provider !== "QWEN" || !settings.qwenBaseUrl || !isLocalQwenUrl(settings.qwenBaseUrl)) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1_500);
    try {
      const response = await fetch(qwenModelsUrl(settings.qwenBaseUrl), {
        method: "GET",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${settings.qwenApiKey ?? "local-qwen"}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text().catch(() => "");
        throw new Error(
          `本地 Qwen 服务已响应，但 /v1/models 返回 ${response.status}${responseText ? `：${responseText.slice(0, 180)}` : ""}。请检查 LM Studio / vLLM / SGLang 的 OpenAI-compatible server。`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`本地 Qwen 连接超时：${settings.qwenBaseUrl}。请确认 LM Studio 已启动 server，并加载 Qwen 模型。`);
      }
      if (error instanceof Error && error.message.startsWith("本地 Qwen 服务已响应")) {
        throw error;
      }
      throw new Error(`本地 Qwen 未连接：${settings.qwenBaseUrl}。请先启动 LM Studio 的 Local Server，确认 /v1/models 可访问后再生成。`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async generateMarketingPackage(input: FastPackageRequest): Promise<FastPackageResponse> {
    const steps: FastPackageStep[] = [];
    const draftStartedAt = Date.now();
    const draftResult = await this.newsScriptService.generate({
      searchQuery: input.topic,
      newsItems: input.materials,
      contentLine: "MARKETING",
      outputType: "AD_SCRIPT",
    });
    steps.push({
      step: "MAIN_DRAFT",
      ok: true,
      artifactId: draftResult.scriptId,
      title: draftResult.title,
      durationMs: Date.now() - draftStartedAt,
    });

    await this.patchMarketingProject({
      projectId: draftResult.projectId,
      title: draftResult.title || input.topic,
      topic: input.topic,
      brandProfileId: input.brandProfileId,
      platforms: input.platforms ?? ["XHS"],
      materials: input.materials,
    });

    if (input.deferPackaging) {
      await this.patchFastPackageStatus(draftResult.projectId, "RUNNING");
      void this.runMarketingPackagingSteps({
        projectId: draftResult.projectId,
        generateStoryboard: input.generateStoryboard,
        parallel: false,
      }).then((deferredSteps) => {
        const failed = deferredSteps.filter((step) => !step.ok);
        void this.patchFastPackageStatus(
          draftResult.projectId,
          failed.length > 0 ? "FAILED" : "DONE",
          deferredSteps,
        ).catch((error) => {
          console.warn("[daily-run] Failed to record deferred marketing packaging status:", error);
        });
        if (failed.length > 0) {
          console.warn("[daily-run] Deferred marketing packaging partially failed:", failed);
        }
      }).catch((error) => {
        void this.patchFastPackageStatus(draftResult.projectId, "FAILED").catch((statusError) => {
          console.warn("[daily-run] Failed to record deferred marketing packaging failure:", statusError);
        });
        console.warn("[daily-run] Deferred marketing packaging failed:", error);
      });

      return this.buildResponse({
        projectId: draftResult.projectId,
        scriptId: draftResult.scriptId,
        steps,
        nextHref: `/marketing-ops?projectId=${draftResult.projectId}`,
        packagingDeferred: true,
      });
    }

    steps.push(...(await this.runMarketingPackagingSteps({
      projectId: draftResult.projectId,
      generateStoryboard: input.generateStoryboard,
      parallel: true,
    })));

    return this.buildResponse({
      projectId: draftResult.projectId,
      scriptId: draftResult.scriptId,
      steps,
      nextHref: `/marketing-ops?projectId=${draftResult.projectId}`,
    });
  }

  private async runMarketingPackagingSteps(params: {
    projectId: string;
    generateStoryboard?: boolean;
    parallel?: boolean;
  }) {
    const packagingSteps = [
      () => runStep("PLATFORM_COPY", () =>
        this.projectOutputGeneratorService.generate(params.projectId, "PLATFORM_COPY"),
      ),
      ...(params.generateStoryboard !== false
        ? [
            () => runStep("AD_STORYBOARD", () =>
              this.projectOutputGeneratorService.generate(params.projectId, "AD_STORYBOARD"),
            ),
          ]
        : []),
    ];

    if (params.parallel === false) {
      const results: FastPackageStep[] = [];
      for (const packagingStep of packagingSteps) {
        results.push(await packagingStep());
      }
      return results;
    }

    return Promise.all(packagingSteps.map((packagingStep) => packagingStep()));
  }

  private async patchFastPackageStatus(
    projectId: string,
    status: "RUNNING" | "DONE" | "FAILED",
    steps?: FastPackageStep[],
  ) {
    const current = await prisma.project.findUnique({
      where: { id: projectId },
      select: { metadata: true },
    });
    const currentMetadata = (current?.metadata as Record<string, unknown> | null) ?? {};
    const currentFastPackage = (currentMetadata.fast_package as Record<string, unknown> | undefined) ?? {};

    await prisma.project.update({
      where: { id: projectId },
      data: {
        metadata: toJson({
          ...currentMetadata,
          fast_package: {
            ...currentFastPackage,
            packaging_status: status,
            packaging_steps: steps ?? currentFastPackage.packaging_steps,
            packaging_updated_at: new Date().toISOString(),
          },
        }),
      },
    });
  }

  private async patchOwnedMediaProject(params: {
    projectId: string;
    title: string;
    topic: string;
    direction: OwnedMediaEditorialDirection;
    brandProfileId?: string | null;
    platforms: string[];
    materials: FastPackageMaterial[];
    worthiness: LongFormWorthiness | null;
  }) {
    const direction = getOwnedMediaDirectionConfig(params.direction);
    const preset = getEditorialDirectionPresets("zh").find((item) => item.id === direction.presetId);
    const current = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { metadata: true },
    });
    const currentMetadata = (current?.metadata as Record<string, unknown> | null) ?? {};

    await prisma.project.update({
      where: { id: params.projectId },
      data: {
        title: params.title,
        topic_query: params.topic,
        brand_profile_id: params.brandProfileId ?? undefined,
        metadata: toJson({
          ...currentMetadata,
          content_line: "MARS_CITIZEN",
          output_type: "NARRATIVE_SCRIPT",
          workspace_mode: "SHORT_VIDEO",
          editorial_direction: direction.label,
          project_introduction: preset?.introduction,
          core_idea: preset?.coreIdea,
          style_reference_sample: preset?.styleReferenceSample,
          writing_mode: "PRODUCT_PROMO",
          style_template: direction.label === "消费时尚" ? "LIGHT_LUXURY" : "RATIONAL_PRO",
          copy_length: "LONG",
          usage_scenario: "TOUTIAO_ARTICLE",
          project_tags: [direction.label, direction.presetId, "daily-run", "热点长文", "今日三篇"],
          fast_package: {
            content_line: "OWNED_MEDIA",
            editorial_direction: direction.label,
            platforms: params.platforms,
            source_materials: params.materials,
            long_form_worthiness: params.worthiness,
            generated_at: new Date().toISOString(),
          },
        }),
      },
    });
  }

  private async patchMarketingProject(params: {
    projectId: string;
    title: string;
    topic: string;
    brandProfileId?: string | null;
    platforms: string[];
    materials: FastPackageMaterial[];
  }) {
    const current = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { metadata: true },
    });
    const currentMetadata = (current?.metadata as Record<string, unknown> | null) ?? {};

    await prisma.project.update({
      where: { id: params.projectId },
      data: {
        title: params.title,
        topic_query: params.topic,
        brand_profile_id: params.brandProfileId ?? undefined,
        metadata: toJson({
          ...currentMetadata,
          content_line: "MARKETING",
          output_type: "PLATFORM_COPY",
          workspace_mode: "COPYWRITING",
          project_tags: ["商业线", "daily-run", "热点转化"],
          fast_package: {
            content_line: "MARKETING",
            platforms: params.platforms,
            source_materials: params.materials,
            generated_at: new Date().toISOString(),
          },
        }),
      },
    });
  }

  private buildResponse(params: {
    projectId: string;
    scriptId?: string;
    steps: FastPackageStep[];
    nextHref: string;
    packagingDeferred?: boolean;
  }): FastPackageResponse {
    const completed = params.steps.filter((step) => step.ok).length;
    const failed = params.steps.filter((step) => !step.ok).length;
    const titleTaskId = params.steps.find((step) => step.step === "TITLE_PACK")?.artifactId;
    const copyTaskId = params.steps.find((step) => step.step === "PUBLISH_COPY" || step.step === "PLATFORM_COPY")?.artifactId;
    const storyboardTaskId = params.steps.find((step) => step.step === "IMAGE_BRIEF" || step.step === "AD_STORYBOARD")?.artifactId;
    const score = params.packagingDeferred ? 72 : failed === 0 ? 88 : Math.max(45, 88 - failed * 16);

    return {
      projectId: params.projectId,
      scriptId: params.scriptId,
      titleTaskId,
      copyTaskId,
      storyboardTaskId,
      completed,
      failed,
      readiness: {
        status: failed === 0 && !params.packagingDeferred ? "READY" : "NEEDS_REVIEW",
        score,
        message: params.packagingDeferred
          ? "主稿已生成，标题、发布文案和配图说明正在后台补齐。"
          : failed === 0
            ? "热点长文包已生成，进入发布前轻审。"
            : "部分产物生成失败，需要人工补齐后再发布。",
      },
      nextHref: params.nextHref,
      packagingDeferred: params.packagingDeferred,
      steps: params.steps,
    };
  }
}
