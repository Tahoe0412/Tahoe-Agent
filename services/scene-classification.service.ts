import { Prisma, type AssetDependencyType, type HumanType, type LipSyncType, type MotionType, type SceneProductionClass } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canUseModelRoute } from "@/lib/model-routing";
import { generateStructuredJson } from "@/lib/openai-json";
import { AppSettingsService } from "@/services/app-settings.service";
import { sceneClassificationSchema, type SceneClassificationOutput } from "@/schemas/script-production";
import { sceneClassificationJsonSchema } from "@/services/scene-classification/json-schema";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

interface RuleBasedClassification extends SceneClassificationOutput {
  rationale: string[];
}

const productionClassLogic: Record<SceneProductionClass, string> = {
  A: "单人出镜、轻动作、可直接 talking-head 生成，背景和镜头要求最低。",
  B: "单人出镜但存在明显动作或表演，需要更强姿态和镜头连续性控制。",
  C: "无人嘴型同步，主要依赖旁白、B-roll、图文叠层，适合解释类镜头。",
  D: "屏幕录制、产品 UI 或操作演示为主，核心是界面可读性和流程一致性。",
  E: "图形、产品合成或轻动画镜头，主体不是纯人像，依赖元素组合。",
  F: "多人、多人互动或复杂场面调度，角色关系和构图复杂度较高。",
  G: "强风格化、电影感、复杂运镜或高一致性要求的高级镜头。",
  T: "以文字卡、标题卡、数据卡为主，几乎不依赖人物和复杂素材。",
};

function containsAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

export function classifyByRules(rewrittenForAi: string): RuleBasedClassification {
  const text = rewrittenForAi.toLowerCase();
  const rationale: string[] = [];

  const humanType: HumanType = containsAny(text, ["人物", "human", "speaker", "口播", "host", "creator", "face"]) ? "H1" : "H0";
  if (humanType === "H1") {
    rationale.push("Detected person-centric language, so human_type = H1.");
  }

  const motionType: MotionType = containsAny(text, ["奔跑", "run", "跳", "tracking", "快速", "剧烈", "切换"])
    ? "M2"
    : containsAny(text, ["手势", "walk", "move", "转头", "展示", "操作"])
      ? "M1"
      : "M0";
  rationale.push(`Motion inferred from action density, so motion_type = ${motionType}.`);

  const lipSyncType: LipSyncType = containsAny(text, ["口播", "台词", "说", "讲", "dialogue", "speak"]) ? "L1" : "L0";
  rationale.push(`Lip sync inferred from spoken-text cues, so lip_sync_type = ${lipSyncType}.`);

  const assetDependencyType: AssetDependencyType = containsAny(text, ["字幕", "title card", "text", "数据卡"]) ? "S1" : containsAny(
    text,
    ["screen", "ui", "界面", "dashboard", "截图"],
  )
    ? "S2"
    : containsAny(text, ["人物", "角色", "host", "speaker"])
      ? "S3"
      : containsAny(text, ["场景", "环境", "cinematic", "城市", "studio"])
        ? "S4"
        : "S0";
  rationale.push(`Asset dependency inferred from scene ingredients, so asset_dependency_type = ${assetDependencyType}.`);

  let productionClass: SceneProductionClass = "C";
  if (containsAny(text, ["title card", "文字卡", "字幕大字", "bullet text", "headline"])) {
    productionClass = "T";
  } else if (containsAny(text, ["screen", "ui", "录屏", "dashboard", "cursor"])) {
    productionClass = "D";
  } else if (humanType === "H1" && motionType === "M0" && lipSyncType === "L1") {
    productionClass = "A";
  } else if (humanType === "H1" && motionType !== "M0") {
    productionClass = "B";
  } else if (containsAny(text, ["motion graphic", "动画", "icon", "packshot", "product composite"])) {
    productionClass = "E";
  } else if (containsAny(text, ["two people", "多人", "crowd", "group", "对手戏"])) {
    productionClass = "F";
  } else if (containsAny(text, ["cinematic", "电影感", "dramatic lighting", "slow motion", "复杂运镜"])) {
    productionClass = "G";
  } else {
    productionClass = "C";
  }
  rationale.push(`Production class logic: ${productionClassLogic[productionClass]}`);

  const riskFlags = [
    ...(motionType === "M2" ? ["high_motion_consistency"] : []),
    ...(productionClass === "G" ? ["cinematic_style_drift"] : []),
    ...(humanType === "H1" && lipSyncType === "L1" ? ["lip_sync_quality"] : []),
    ...(productionClass === "D" ? ["ui_readability"] : []),
  ];

  const difficultyBase =
    { A: 28, B: 45, C: 32, D: 40, E: 52, F: 68, G: 82, T: 18 }[productionClass] +
    { M0: 0, M1: 8, M2: 16 }[motionType] +
    { S0: 0, S1: 4, S2: 8, S3: 10, S4: 12 }[assetDependencyType] +
    (lipSyncType === "L1" ? 12 : 0);

  return {
    human_type: humanType,
    motion_type: motionType,
    lip_sync_type: lipSyncType,
    asset_dependency_type: assetDependencyType,
    production_class: productionClass,
    difficulty_score: Math.min(100, difficultyBase),
    risk_flags: riskFlags,
    rationale,
  };
}

async function withRetry<T>(task: () => Promise<T>) {
  try {
    return await task();
  } catch {
    return task();
  }
}

export class SceneClassificationService {
  private readonly appSettingsService = new AppSettingsService();

  async classifyAndSave(params: { projectId: string; sceneId: string; rewrittenForAi?: string }) {
    const scene = await prisma.scriptScene.findFirst({
      where: {
        id: params.sceneId,
        project_id: params.projectId,
      },
    });

    if (!scene) {
      throw new Error("Scene not found.");
    }

    const rewrittenForAi = params.rewrittenForAi || scene.rewritten_for_ai;
    const ruleBased = classifyByRules(rewrittenForAi);

    const settings = await this.appSettingsService.getEffectiveSettings();
    const llmEnabled = canUseModelRoute("SCENE_CLASSIFICATION", settings);

    let llmOutput: SceneClassificationOutput | null = null;
    if (llmEnabled) {
      llmOutput = await withRetry(() =>
        generateStructuredJson({
          routeKey: "SCENE_CLASSIFICATION",
          schemaName: "scene_classification_output",
          schema: sceneClassificationJsonSchema,
          zodSchema: sceneClassificationSchema,
          systemPrompt:
            "You classify AI video scenes. Use the provided rule baseline as a strong prior and output valid JSON only.",
          userPrompt: [
            "Classify this AI video scene.",
            "Production class logic:",
            ...Object.entries(productionClassLogic).map(([key, value]) => `- ${key}: ${value}`),
            "",
            `Rule baseline:\n${JSON.stringify(ruleBased, null, 2)}`,
            "",
            `Scene:\n${rewrittenForAi}`,
          ].join("\n"),
        }),
      );
    }

    const finalClassification = sceneClassificationSchema.parse(llmOutput ?? ruleBased);

    const saved = await prisma.sceneClassification.upsert({
      where: {
        script_scene_id_classification_version: {
          script_scene_id: scene.id,
          classification_version: "V1",
        },
      },
      update: {
        human_type: finalClassification.human_type,
        motion_type: finalClassification.motion_type,
        lip_sync_type: finalClassification.lip_sync_type,
        asset_dependency_type: finalClassification.asset_dependency_type,
        production_class: finalClassification.production_class,
        difficulty_score: finalClassification.difficulty_score,
        risk_flags: toJson(finalClassification.risk_flags),
        rule_based_output: toJson(ruleBased),
        llm_output: llmOutput ? toJson(llmOutput) : Prisma.JsonNull,
        raw_payload: toJson({
          rewritten_for_ai: rewrittenForAi,
          production_class_logic: productionClassLogic,
        }),
      },
      create: {
        project_id: params.projectId,
        script_scene_id: scene.id,
        classification_version: "V1",
        human_type: finalClassification.human_type,
        motion_type: finalClassification.motion_type,
        lip_sync_type: finalClassification.lip_sync_type,
        asset_dependency_type: finalClassification.asset_dependency_type,
        production_class: finalClassification.production_class,
        difficulty_score: finalClassification.difficulty_score,
        risk_flags: toJson(finalClassification.risk_flags),
        rule_based_output: toJson(ruleBased),
        llm_output: llmOutput ? toJson(llmOutput) : Prisma.JsonNull,
        raw_payload: toJson({
          rewritten_for_ai: rewrittenForAi,
          production_class_logic: productionClassLogic,
        }),
      },
    });

    return {
      classification: saved,
      rule_based_output: ruleBased,
      production_class_logic: productionClassLogic,
    };
  }
}
