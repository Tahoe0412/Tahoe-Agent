import type { OutputType } from "@/lib/content-line";
import {
  assessAdCreative,
  assessPublishCopy,
  assessVideoTitlePack,
  type QualityAlert,
} from "@/lib/artifact-quality";

export type ArtifactReview = {
  status: "READY" | "NEEDS_REVISION";
  summary: string;
  strengths: string[];
  issues: string[];
  nextSteps: string[];
};

type OutputKnowledgePack = {
  knowledgeNotes: string[];
  reviewChecklist: string[];
};

function summarizeAlerts(params: {
  okSummary: string;
  warnSummary: string;
  alerts: QualityAlert[];
  nextSteps: string[];
}): ArtifactReview {
  const strengths = params.alerts.filter((item) => item.tone === "ok").map((item) => item.detail);
  const issues = params.alerts.filter((item) => item.tone === "warn").map((item) => `${item.label}：${item.detail}`);

  return {
    status: issues.length > 0 ? "NEEDS_REVISION" : "READY",
    summary: issues.length > 0 ? params.warnSummary : params.okSummary,
    strengths,
    issues,
    nextSteps: issues.length > 0 ? params.nextSteps : ["当前版本可以继续进入下游工作，优先做轻微微调而不是整体重写。"],
  };
}

export function getOutputKnowledgePack(outputType: Extract<OutputType, "VIDEO_TITLE" | "PUBLISH_COPY" | "AD_CREATIVE">): OutputKnowledgePack {
  switch (outputType) {
    case "VIDEO_TITLE":
      return {
        knowledgeNotes: [
          "标题不是摘要，而是第一道分发入口；优先写能阻止用户继续滑走的钩子。",
          "至少保留 2 条不同传播角度，方便在“问题感 / 反差感 / 结果感”之间快速比较。",
          "避免空泛大词、陈词滥调和纯结论句；标题要让人感觉里面真的有信息增量。",
        ],
        reviewChecklist: [
          "推荐标题是否足够具体，并且带问题、反差或结果感。",
          "标题包是否至少提供 3 条可比较备选，而不是同一句话换皮。",
          "是否避开“揭秘 / 震撼 / 最新 / 未来已来”这类泛化措辞。",
        ],
      };
    case "PUBLISH_COPY":
      return {
        knowledgeNotes: [
          "发布文案要补的是‘为什么值得看 / 为什么值得信 / 为什么值得行动’，不是重复脚本。",
          "正文里优先放事实、结果、对比、数据、案例，减少空泛总结句。",
          "导语和 CTA 都要短、硬、直接，能立刻把用户带进内容或带向下一步动作。",
        ],
        reviewChecklist: [
          "导语是否像真实开场第一句，而不是背景介绍。",
          "正文和亮点里是否有足够的事实密度、证据点或可感知结果。",
          "CTA 是否明确告诉用户接下来要收藏、评论、关注还是继续查看。",
        ],
      };
    case "AD_CREATIVE":
      return {
        knowledgeNotes: [
          "广告创意 brief 要能直接支撑脚本和分镜，不要写成顾问汇报或抽象品牌感受。",
          "卖点必须尽量可视化、可对比、可验证，这样后续镜头才有真实抓手。",
          "视觉方向和镜头语气要尽量具体到主体、动作、节奏、机位或结果画面，而不是只给气质词。",
        ],
        reviewChecklist: [
          "核心钩子是否像一句能立刻抓住人的广告开场。",
          "卖点是否具备画面抓手和证据感，而不只是口号。",
          "视觉方向和镜头语气是否已经具体到足以拆成 storyboard prompt。",
        ],
      };
  }
}

export function reviewOutputArtifact(outputType: Extract<OutputType, "VIDEO_TITLE" | "PUBLISH_COPY" | "AD_CREATIVE">, payload: Record<string, unknown>): ArtifactReview {
  switch (outputType) {
    case "VIDEO_TITLE": {
      const alerts = assessVideoTitlePack({
        recommendedTitle: typeof payload.recommended_title === "string" ? payload.recommended_title : "",
        titleOptions: Array.isArray(payload.title_options) ? payload.title_options.filter((item): item is string => typeof item === "string") : [],
      });
      return summarizeAlerts({
        alerts,
        okSummary: "标题包已经具备基本传播钩子和备选比较空间，可以继续用于包装与发布测试。",
        warnSummary: "标题包还有明显短板，建议先补强钩子和区分度，再拿去做发布包装。",
        nextSteps: [
          "先把推荐标题改成更强的钩子句，再保留 3-5 条差异化备选。",
          "优先补“问题感 / 反差感 / 结果感”，不要只写主题总结。",
        ],
      });
    }
    case "PUBLISH_COPY": {
      const alerts = assessPublishCopy({
        leadIn: typeof payload.lead_in === "string" ? payload.lead_in : "",
        description: typeof payload.video_description === "string" ? payload.video_description : "",
        highlights: Array.isArray(payload.highlights) ? payload.highlights.filter((item): item is string => typeof item === "string") : [],
        cta: typeof payload.publish_cta === "string" ? payload.publish_cta : "",
      });
      return summarizeAlerts({
        alerts,
        okSummary: "发布文案已经有开场、信息密度和动作引导，可以进入平台发布或轻量微调。",
        warnSummary: "发布文案的信息密度或转化引导还不够，建议先补强再直接发布。",
        nextSteps: [
          "先补最能让人相信的事实、结果或对比，再去润色句式。",
          "把导语和 CTA 压得更短更直接，确保第一眼就知道内容值不值得看。",
        ],
      });
    }
    case "AD_CREATIVE": {
      const alerts = assessAdCreative({
        hook: typeof payload.core_hook === "string" ? payload.core_hook : "",
        sellingPoints: Array.isArray(payload.selling_points) ? payload.selling_points.filter((item): item is string => typeof item === "string") : [],
        visualDirection: typeof payload.visual_direction === "string" ? payload.visual_direction : "",
        shotTone: typeof payload.shot_tone === "string" ? payload.shot_tone : "",
      });
      return summarizeAlerts({
        alerts,
        okSummary: "广告创意 brief 已经足够支撑广告脚本和广告分镜继续展开。",
        warnSummary: "广告创意 brief 仍偏虚，建议先补强画面抓手和卖点证据，再往分镜推进。",
        nextSteps: [
          "优先把卖点写成看得见、能对比、能验证的画面结果。",
          "把视觉方向和镜头语气改成更具体的主体、动作、节奏与机位说明。",
        ],
      });
    }
  }
}
