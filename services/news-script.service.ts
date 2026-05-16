import { z } from "zod";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { type NewsItemForPrompt, type TrendItemForPrompt } from "@/lib/news-script-prompt";
import { buildOwnedMediaNarrativePrompt } from "@/lib/mars-citizen-prompt";
import { buildAdScriptPrompt } from "@/lib/ad-script-prompt";
import {
  audiencePanelReviewJsonSchema,
  audiencePanelReviewSchema,
  buildAudiencePanelPrompt,
  normalizeAudiencePanelReview,
} from "@/lib/copy-review-panel";
import { analyzeStyleReferenceSample } from "@/lib/style-reference";
import { resolveProjectIntent } from "@/lib/project-intent";
import type { Prisma } from "@prisma/client";
import {
  assertSupportedNewsScriptOutputType,
  getNewsScriptGenerator,
  type AdNewsScriptGenerationInput,
  type NarrativeNewsScriptGenerationInput,
  type NewsScriptGeneratorRegistry,
} from "@/services/news-script-generator-registry";
import { AppSettingsService } from "@/services/app-settings.service";
import {
  getOwnedMediaDirectionConfig,
  isOwnedMediaEditorialDirection,
  type OwnedMediaEditorialDirection,
} from "@/lib/owned-media-directions";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function mergeScriptStructuredOutput(
  scriptId: string,
  patch: Record<string, unknown>,
) {
  const script = await prisma.script.findUnique({ where: { id: scriptId } });
  if (!script) {
    return;
  }

  const existing = (script.structured_output as Record<string, unknown>) ?? {};
  await prisma.script.update({
    where: { id: scriptId },
    data: {
      structured_output: toJson({ ...existing, ...patch }),
    },
  });
}

/** Zod schema for the narrative LLM output (Mars Citizen / legacy) */
const generatedNarrativeSchema = z.object({
  title: z.string(),
  opening: z.string(),
  body: z.string(),
  closing: z.string(),
  full_text: z.string(),
  estimated_duration_sec: z.number().default(90),
});

/** Zod schema for the ad script LLM output (Marketing) */
const generatedAdScriptSchema = z.object({
  title: z.string(),
  hook: z.string(),
  pain_point: z.string(),
  solution: z.string(),
  social_proof: z.string(),
  cta: z.string(),
  full_text: z.string(),
  estimated_duration_sec: z.number().default(60),
});

type GeneratedNarrative = z.infer<typeof generatedNarrativeSchema>;
type GeneratedAdScript = z.infer<typeof generatedAdScriptSchema>;

export interface NewsItemInput {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  source_type: string;
  published_at: string;
}

export class NewsScriptService {
  private readonly appSettingsService = new AppSettingsService();

  /**
   * Generate a script from selected news/content items.
   * The entry point is chosen by `outputType`, while `contentLine`
   * defines the domain defaults and metadata written to the project.
   */
  async generate(input: {
    searchQuery: string;
    newsItems: NewsItemInput[];
    contentLine?: string;
    outputType?: string;
    editorialDirection?: OwnedMediaEditorialDirection;
    strictModel?: boolean;
  }): Promise<{ projectId: string; scriptId: string; title: string }> {
    const { searchQuery, newsItems } = input;
    const intent = resolveProjectIntent({
      contentLine: input.contentLine,
      outputType: input.outputType,
    });

    if (newsItems.length === 0) {
      throw new Error("至少选择一条新闻。");
    }

    const outputType = assertSupportedNewsScriptOutputType(intent.outputType);

    // 1. Create a project for this script
    const editorialDirection = isOwnedMediaEditorialDirection(input.editorialDirection)
      ? input.editorialDirection
      : "AI快讯";
    const projectTitle = intent.contentLine === "MARS_CITIZEN"
      ? `${searchQuery} — ${editorialDirection}`
      : `${searchQuery} — 商业内容`;

    const project = await prisma.project.create({
      data: {
        title: projectTitle,
        topic_query: searchQuery,
        source_language: "zh-CN",
        status: "DRAFT",
        metadata: toJson({
          content_line: intent.contentLine,
          output_type: intent.outputType,
          workspace_mode: intent.workspaceMode,
          ...(intent.contentLine === "MARS_CITIZEN" ? { editorial_direction: editorialDirection } : {}),
        }),
      },
    });

    // 2. Build prompt — branch by content line
    const factNewsItems = newsItems.filter((i) => i.source_type !== "trend_signal");
    const trendNewsItems = newsItems.filter((i) => i.source_type === "trend_signal");

    const factPromptItems: NewsItemForPrompt[] = factNewsItems.map((item) => ({
      title: item.title,
      source: item.source,
      published_at: item.published_at,
      snippet: item.snippet,
    }));

    const trendPromptItems: TrendItemForPrompt[] = trendNewsItems.map((item) => ({
      title: item.title,
      source: item.source,
      snippet: item.snippet,
    }));

    const generators: NewsScriptGeneratorRegistry = {
      NARRATIVE_SCRIPT: (params) => this.generateNarrativeScript(params),
      AD_SCRIPT: (params) => this.generateAdScript(params),
    };

    if (outputType === "NARRATIVE_SCRIPT") {
      return getNewsScriptGenerator(generators, outputType)({
        project,
        searchQuery,
        newsItems,
        factPromptItems,
        trendPromptItems,
        contentLine: intent.contentLine,
        outputType,
        editorialDirection,
        strictModel: input.strictModel,
      });
    }

    return getNewsScriptGenerator(generators, outputType)({
      project,
      searchQuery,
      newsItems,
      factPromptItems,
      contentLine: intent.contentLine,
      outputType,
    });
  }

  // ---------------------------------------------------------------------------
  // Mars Citizen: narrative script
  // ---------------------------------------------------------------------------
  private async generateNarrativeScript(params: NarrativeNewsScriptGenerationInput) {
    const { project, searchQuery, newsItems, factPromptItems, trendPromptItems, contentLine, outputType } = params;
    const direction = getOwnedMediaDirectionConfig(params.editorialDirection);

    const { systemPrompt, userPrompt } = buildOwnedMediaNarrativePrompt(
      factPromptItems,
      trendPromptItems,
      searchQuery,
      direction.label,
    );

    let generatedScript: GeneratedNarrative;
    try {
      generatedScript = await generateStructuredJson<GeneratedNarrative>({
        schemaName: "mars_citizen_narrative",
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            opening: { type: "string" },
            body: { type: "string" },
            closing: { type: "string" },
            full_text: { type: "string" },
            estimated_duration_sec: { type: "number" },
          },
          required: ["title", "opening", "body", "closing", "full_text"],
        },
        zodSchema: generatedNarrativeSchema as never,
        systemPrompt,
        userPrompt,
        routeKey: params.strictModel ? "PROMOTIONAL_COPY" : "SCRIPT_REWRITE",
        preprocess: (raw: unknown) => {
          if (typeof raw === "string") {
            return {
              title: `${searchQuery} 科技快讯`,
              opening: "",
              body: raw,
              closing: "",
              full_text: raw,
              estimated_duration_sec: 90,
            };
          }
          return raw;
        },
      });
    } catch (error) {
      if (params.strictModel) {
        await prisma.project.delete({ where: { id: project.id } }).catch((cleanupError) => {
          console.warn("[news-script] Failed to clean up strict narrative project after LLM failure:", cleanupError);
        });
        throw error;
      }
      const fallbackText = newsItems
        .map((item, i) => `${i + 1}. 【${item.source}】${item.title}\n${item.snippet}`)
        .join("\n\n");

      generatedScript = {
        title: `${searchQuery} — ${direction.label}`,
        opening: `今天关于"${searchQuery}"有 ${newsItems.length} 条动态值得关注。`,
        body: fallbackText,
        closing: `以上就是今天的${direction.label}观察。`,
        full_text: `今天关于"${searchQuery}"有 ${newsItems.length} 条动态值得关注。\n\n${fallbackText}\n\n以上就是今天的${direction.label}观察。`,
        estimated_duration_sec: 90,
      };
      console.warn("[news-script] LLM failed, using narrative fallback:", error);
    }

    const scriptCount = await prisma.script.count({ where: { project_id: project.id } });

    const script = await prisma.script.create({
      data: {
        project_id: project.id,
        source_type: "USER_INPUT",
        script_status: "ACTIVE",
        version_number: scriptCount + 1,
        title: generatedScript.title,
        original_text: generatedScript.full_text,
        rewritten_text: null,
        model_name: "mars-citizen-narrative",
        structured_output: toJson({
          content_line: contentLine,
          output_type: outputType,
          editorial_direction: direction.label,
          title: generatedScript.title,
          opening: generatedScript.opening,
          body: generatedScript.body,
          closing: generatedScript.closing,
          estimated_duration_sec: generatedScript.estimated_duration_sec,
          scene_split_status: "pending",
        }),
        raw_payload: toJson({
          origin: "mars_citizen_narrative",
          content_line: contentLine,
          output_type: outputType,
          editorial_direction: direction.label,
          search_query: searchQuery,
          news_items: newsItems,
          generated_at: new Date().toISOString(),
        }),
      },
    });

    void this.enrichNarrativeScriptReview({
      scriptId: script.id,
      topic: searchQuery,
      editorialDirection: direction.label,
      title: generatedScript.title,
      opening: generatedScript.opening,
      body: generatedScript.body,
      closing: generatedScript.closing,
      proofPoints: newsItems.slice(0, 5).map((item) => `${item.source}：${item.title}`),
    }).catch((error) => {
      console.warn("[news-script] Failed to enrich narrative audience review:", error);
    });

    return { projectId: project.id, scriptId: script.id, title: generatedScript.title };
  }

  // ---------------------------------------------------------------------------
  // Marketing: ad script
  // ---------------------------------------------------------------------------
  private async generateAdScript(params: AdNewsScriptGenerationInput) {
    const { project, searchQuery, newsItems, factPromptItems, contentLine, outputType } = params;

    const { systemPrompt, userPrompt } = buildAdScriptPrompt(
      factPromptItems.map((item) => ({
        title: item.title,
        snippet: item.snippet,
        source: item.source,
      })),
      {},
      searchQuery,
    );

    let generatedScript: GeneratedAdScript;
    try {
      generatedScript = await generateStructuredJson<GeneratedAdScript>({
        schemaName: "marketing_ad_script",
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            pain_point: { type: "string" },
            solution: { type: "string" },
            social_proof: { type: "string" },
            cta: { type: "string" },
            full_text: { type: "string" },
            estimated_duration_sec: { type: "number" },
          },
          required: ["title", "hook", "pain_point", "solution", "social_proof", "cta", "full_text"],
        },
        zodSchema: generatedAdScriptSchema as never,
        systemPrompt,
        userPrompt,
        routeKey: "SCRIPT_REWRITE",
        preprocess: (raw: unknown) => {
          if (typeof raw === "string") {
            return {
              title: `${searchQuery} 广告脚本`,
              hook: "",
              pain_point: "",
              solution: raw,
              social_proof: "",
              cta: "",
              full_text: raw,
              estimated_duration_sec: 60,
            };
          }
          return raw;
        },
      });
    } catch (error) {
      const fallbackText = newsItems
        .map((item, i) => `${i + 1}. 【${item.source}】${item.title}\n${item.snippet}`)
        .join("\n\n");

      generatedScript = {
        title: `${searchQuery} — 广告脚本`,
        hook: `关于"${searchQuery}"，你知道吗？`,
        pain_point: "很多用户都在关注这个问题。",
        solution: fallbackText,
        social_proof: "已有大量用户验证了这一方案。",
        cta: "立刻了解更多，点击链接。",
        full_text: `关于"${searchQuery}"，你知道吗？\n\n${fallbackText}\n\n立刻了解更多，点击链接。`,
        estimated_duration_sec: 60,
      };
      console.warn("[news-script] LLM failed, using ad script fallback:", error);
    }

    const scriptCount = await prisma.script.count({ where: { project_id: project.id } });

    const script = await prisma.script.create({
      data: {
        project_id: project.id,
        source_type: "USER_INPUT",
        script_status: "ACTIVE",
        version_number: scriptCount + 1,
        title: generatedScript.title,
        original_text: generatedScript.full_text,
        rewritten_text: null,
        model_name: "marketing-ad-script",
        structured_output: toJson({
          content_line: contentLine,
          output_type: outputType,
          title: generatedScript.title,
          hook: generatedScript.hook,
          pain_point: generatedScript.pain_point,
          solution: generatedScript.solution,
          social_proof: generatedScript.social_proof,
          cta: generatedScript.cta,
          estimated_duration_sec: generatedScript.estimated_duration_sec,
          scene_split_status: "pending",
        }),
        raw_payload: toJson({
          origin: "marketing_ad_script",
          content_line: contentLine,
          output_type: outputType,
          search_query: searchQuery,
          news_items: newsItems,
          generated_at: new Date().toISOString(),
        }),
      },
    });

    return { projectId: project.id, scriptId: script.id, title: generatedScript.title };
  }

  private async enrichNarrativeScriptReview(params: {
    scriptId: string;
    topic: string;
    editorialDirection?: OwnedMediaEditorialDirection;
    title: string;
    opening: string;
    body: string;
    closing: string;
    proofPoints: string[];
    styleReferenceSample?: string | null;
  }) {
    const settings = await this.appSettingsService.getEffectiveSettings();
    if (!canUseModelRoute("MARKETING_ANALYSIS", settings)) {
      return;
    }

    const styleReferenceInsight = analyzeStyleReferenceSample(params.styleReferenceSample ?? "");
    const prompt = buildAudiencePanelPrompt({
      topic: params.topic,
      draftTypeLabel: "主稿 / 长文",
      title: params.title,
      heroCopy: params.opening,
      bodyCopy: [params.body, params.closing].filter(Boolean).join("\n\n"),
      proofPoints: params.proofPoints,
      styleReferenceInsight,
    });

    const review = await generateStructuredJson({
      routeKey: "MARKETING_ANALYSIS",
      schemaName: "owned_media_main_draft_audience_panel_review",
      schema: audiencePanelReviewJsonSchema,
      zodSchema: audiencePanelReviewSchema,
      temperature: 0.15,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
    });

    const normalizedReview = normalizeAudiencePanelReview(review);
    if (!normalizedReview) {
      return;
    }

    await mergeScriptStructuredOutput(params.scriptId, {
      audience_panel_review: normalizedReview,
    });
  }
}
