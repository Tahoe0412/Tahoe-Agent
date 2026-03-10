import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { AppSettingsService } from "@/services/app-settings.service";
import {
  assetDependencyAnalyzerOutputSchema,
  type AssetDependencyAnalyzerOutput,
} from "@/schemas/asset-dependency";
import { assetDependencyAnalyzerJsonSchema } from "@/services/asset-dependency-analyzer/json-schema";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

export function buildAssetRuleOutput(input: {
  rewritten_for_ai: string;
  continuity_group: string;
  classification: {
    human_type: "H0" | "H1";
    lip_sync_type: "L0" | "L1";
    asset_dependency_type: "S0" | "S1" | "S2" | "S3" | "S4";
    production_class: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "T";
  };
  uploaded_asset_types: string[];
}): AssetDependencyAnalyzerOutput {
  const text = input.rewritten_for_ai.toLowerCase();
  const needsCharacterBase =
    input.classification.human_type === "H1" && input.classification.production_class !== "D" && input.classification.production_class !== "T";
  const needsSceneBase =
    input.classification.production_class !== "T" &&
    (includesAny(text, ["场景", "环境", "studio", "room", "street", "workspace"]) ||
      ["B", "C", "E", "F", "G"].includes(input.classification.production_class));
  const needsComposite =
    input.classification.human_type === "H1" &&
    needsSceneBase &&
    ["B", "E", "F", "G"].includes(input.classification.production_class);
  const needsVoice = input.classification.lip_sync_type === "L1" || includesAny(text, ["旁白", "voiceover", "口播", "说"]);
  const needsReferenceImages =
    input.classification.asset_dependency_type === "S3" ||
    input.classification.asset_dependency_type === "S4" ||
    includesAny(text, ["服装", "道具", "brand", "logo", "环境", "reference"]);

  const requiredAssets = [
    {
      asset_code: "CHARACTER_BASE" as const,
      required: needsCharacterBase,
      reason: needsCharacterBase ? "Scene includes human presence that needs stable character identity." : "No stable character plate required.",
      reference_tags: needsCharacterBase ? ["identity", "pose", input.continuity_group] : [],
    },
    {
      asset_code: "SCENE_BASE" as const,
      required: needsSceneBase,
      reason: needsSceneBase ? "Scene requires consistent environment or backdrop." : "Environment can be minimal or text-only.",
      reference_tags: needsSceneBase ? ["environment", input.continuity_group] : [],
    },
    {
      asset_code: "CHARACTER_SCENE_COMPOSITE" as const,
      required: needsComposite,
      reason: needsComposite ? "Scene combines person and environment in the same generated frame." : "Composite plate is optional.",
      reference_tags: needsComposite ? ["composition", "framing"] : [],
    },
    {
      asset_code: "VOICE" as const,
      required: needsVoice,
      reason: needsVoice ? "Scene needs spoken audio or synced voice." : "No dedicated voice asset required.",
      reference_tags: needsVoice ? ["voice", "tone"] : [],
    },
    {
      asset_code: "REFERENCE_IMAGE" as const,
      required: needsReferenceImages,
      reason: needsReferenceImages ? "Additional references improve consistency for wardrobe, props, or environment." : "Extra reference images not required.",
      reference_tags: needsReferenceImages ? ["wardrobe", "props", "environment"] : [],
    },
  ];

  const uploaded = new Set(input.uploaded_asset_types);
  const missingHints = requiredAssets
    .filter((asset) => asset.required && !uploaded.has(asset.asset_code))
    .map((asset) => `Missing ${asset.asset_code.toLowerCase()} for ${input.continuity_group}`);

  return {
    required_assets: requiredAssets,
    needs_character_base: needsCharacterBase,
    needs_scene_base: needsSceneBase,
    needs_character_scene_composite: needsComposite,
    needs_voice: needsVoice,
    needs_reference_images: needsReferenceImages,
    missing_asset_hints: missingHints,
    is_asset_ready: missingHints.length === 0,
  };
}

async function withRetry<T>(task: () => Promise<T>) {
  try {
    return await task();
  } catch {
    return task();
  }
}

export class AssetDependencyAnalyzerService {
  private readonly appSettingsService = new AppSettingsService();

  async analyzeAndSave(params: { projectId: string; sceneId: string }) {
    const scene = await prisma.scriptScene.findFirst({
      where: {
        id: params.sceneId,
        project_id: params.projectId,
      },
      include: {
        scene_classifications: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (!scene) {
      throw new Error("Scene not found.");
    }

    const classification = scene.scene_classifications[0];
    if (!classification) {
      throw new Error("Scene classification is required before asset analysis.");
    }

    const uploadedAssets = await prisma.uploadedAsset.findMany({
      where: {
        project_id: params.projectId,
        OR: [{ script_scene_id: scene.id }, { continuity_group: scene.continuity_group }],
      },
    });

    const ruleBased = buildAssetRuleOutput({
      rewritten_for_ai: scene.rewritten_for_ai,
      continuity_group: scene.continuity_group,
      classification: {
        human_type: classification.human_type,
        lip_sync_type: classification.lip_sync_type,
        asset_dependency_type: classification.asset_dependency_type,
        production_class: classification.production_class,
      },
      uploaded_asset_types: uploadedAssets.map((asset) => asset.asset_type),
    });

    const settings = await this.appSettingsService.getEffectiveSettings();
    const llmEnabled = canUseModelRoute("ASSET_ANALYSIS", settings);

    let llmOutput: AssetDependencyAnalyzerOutput | null = null;
    if (llmEnabled) {
      llmOutput = await withRetry(() =>
        generateStructuredJson({
          routeKey: "ASSET_ANALYSIS",
          schemaName: "asset_dependency_output",
          schema: assetDependencyAnalyzerJsonSchema,
          zodSchema: assetDependencyAnalyzerOutputSchema,
          systemPrompt:
            "You refine asset dependency decisions for AI video production. Keep booleans stable unless the rule baseline is obviously wrong.",
          userPrompt: [
            `Scene rewritten_for_ai:\n${scene.rewritten_for_ai}`,
            `Continuity group: ${scene.continuity_group}`,
            `Rule baseline:\n${JSON.stringify(ruleBased, null, 2)}`,
          ].join("\n\n"),
        }),
      );
    }

    const finalOutput = assetDependencyAnalyzerOutputSchema.parse(llmOutput ?? ruleBased);

    const saved = await prisma.requiredAsset.upsert({
      where: {
        script_scene_id_asset_version: {
          script_scene_id: scene.id,
          asset_version: "V1",
        },
      },
      update: {
        needs_character_base: finalOutput.needs_character_base,
        needs_scene_base: finalOutput.needs_scene_base,
        needs_character_scene_comp: finalOutput.needs_character_scene_composite,
        needs_voice: finalOutput.needs_voice,
        needs_reference_images: finalOutput.needs_reference_images,
        missing_asset_hints: toJson(finalOutput.missing_asset_hints),
        required_assets_json: toJson(finalOutput.required_assets),
        is_asset_ready: finalOutput.is_asset_ready,
        rule_based_output: toJson(ruleBased),
        llm_output: llmOutput ? toJson(llmOutput) : Prisma.JsonNull,
        raw_payload: toJson({
          uploaded_assets: uploadedAssets,
          rewritten_for_ai: scene.rewritten_for_ai,
        }),
      },
      create: {
        project_id: params.projectId,
        script_scene_id: scene.id,
        asset_version: "V1",
        needs_character_base: finalOutput.needs_character_base,
        needs_scene_base: finalOutput.needs_scene_base,
        needs_character_scene_comp: finalOutput.needs_character_scene_composite,
        needs_voice: finalOutput.needs_voice,
        needs_reference_images: finalOutput.needs_reference_images,
        missing_asset_hints: toJson(finalOutput.missing_asset_hints),
        required_assets_json: toJson(finalOutput.required_assets),
        is_asset_ready: finalOutput.is_asset_ready,
        rule_based_output: toJson(ruleBased),
        llm_output: llmOutput ? toJson(llmOutput) : Prisma.JsonNull,
        raw_payload: toJson({
          uploaded_assets: uploadedAssets,
          rewritten_for_ai: scene.rewritten_for_ai,
        }),
      },
    });

    return {
      required_asset: saved,
      rule_based_output: ruleBased,
      is_asset_ready: finalOutput.is_asset_ready,
    };
  }
}
