import type { ResearchOutput } from "@/schemas/project";
import type { ProjectCreateInput } from "@/schemas/project";

export function buildMockResearch(input: ProjectCreateInput): ResearchOutput {
  return {
    trendResearch: [
      {
        title: `${input.topic} 的反差开场`,
        summary: "高表现内容普遍在前 3 秒制造强冲突或强结果预告，适合广告型 AI 视频。",
        momentumScore: 91,
        keywords: ["反差", "前三秒", "结果前置"],
      },
      {
        title: `${input.topic} 的教程混剪`,
        summary: "热点内容倾向把案例、步骤和结果证明压缩进 30-60 秒，强调可复制方法。",
        momentumScore: 84,
        keywords: ["教程", "混剪", "案例"],
      },
      {
        title: `${input.topic} 的拟人叙事`,
        summary: "在 TikTok 和 YouTube Shorts 中，拟人化口播与镜头反打的完成率更高。",
        momentumScore: 79,
        keywords: ["拟人", "口播", "反打"],
      },
    ],
    creators: [
      {
        handle: "@creator_alpha",
        platform: "YOUTUBE",
        displayName: "Creator Alpha",
        followerCount: 420000,
        averageViews: 180000,
        niche: "AI Ads",
        angle: "擅长强 Hook + 快节奏案例拆解",
      },
      {
        handle: "@creator_beta",
        platform: "X",
        displayName: "Creator Beta",
        followerCount: 185000,
        averageViews: 95000,
        niche: "Trend Commentary",
        angle: "擅长把新闻热点翻译成可执行选题",
      },
      {
        handle: "@creator_gamma",
        platform: "TIKTOK",
        displayName: "Creator Gamma",
        followerCount: 510000,
        averageViews: 220000,
        niche: "UGC Style AI Video",
        angle: "擅长拟人化演绎与高转化字幕节奏",
      },
    ],
    contentPatterns: [
      {
        title: "结果先行",
        patternType: "HOOK",
        summary: "先展示最终效果，再回溯过程，适合提高停留和完播。",
        evidence: ["前 3 秒出现成果画面", "字幕含明确收益"],
      },
      {
        title: "三段式脚本",
        patternType: "NARRATIVE",
        summary: "痛点、方案、结果三段式稳定适配广告型短视频。",
        evidence: ["痛点一句话", "方案两步拆解", "结果附社会证明"],
      },
      {
        title: "信息密度剪辑",
        patternType: "EDITING",
        summary: "每 2-3 秒切换画面或文案焦点，降低跳失。",
        evidence: ["快切 B-roll", "字幕大词强调"],
      },
    ],
    rewrittenScript: {
      hook: `如果你想把“${input.topic}”做成能转化的 AI 视频，先别急着生成，先看这套结构。`,
      beats: [
        {
          title: "痛点拉起",
          objective: "让观众意识到原始脚本不具备传播钩子",
          script: `大多数关于“${input.topic}”的脚本，信息是对的，但开头 3 秒不够狠，所以没人停下来。`,
        },
        {
          title: "趋势证明",
          objective: "把趋势研究转成创作依据",
          script: "现在最有效的做法，是结果前置、人物反应插入、再用案例证明这个方法可复制。",
        },
        {
          title: "重构方案",
          objective: "给出清晰的新脚本结构",
          script: `把你的原始内容拆成 Hook、案例、结果、CTA 四个镜头层级，再针对每个镜头补素材。`,
        },
      ],
      cta: "下一步，把镜头和素材表直接喂给视频生成链路。",
    },
    shotPlans: [
      {
        shotNumber: 1,
        title: "反差式 Hook",
        description: "人物正面口播，直接抛出结果与反问。",
        durationSeconds: 6,
        characterType: "HUMAN",
        motionType: "ACTION",
        dialogueType: "DIALOGUE",
        requiredAssets: [
          {
            type: "CHARACTER_SCENE_COMPOSITE",
            name: "人物+工作台场景",
            promptHint: "可信创作者工作室环境，镜头近景，夸张手势",
          },
          {
            type: "VOICE",
            name: "开场口播",
            promptHint: "语速快，强调结果和反差",
          },
        ],
      },
      {
        shotNumber: 2,
        title: "趋势证据插入",
        description: "用平台截图、曲线图和标题卡说明趋势变化。",
        durationSeconds: 8,
        characterType: "NONE",
        motionType: "STATIC",
        dialogueType: "SILENT",
        requiredAssets: [
          {
            type: "SCENE_BASE",
            name: "数据趋势面板",
            promptHint: "清晰数据卡片与上涨趋势图，科技信息流样式",
          },
          {
            type: "BROLL",
            name: "平台热点截图",
            promptHint: "YouTube、X、TikTok 的热点内容示意",
          },
        ],
      },
      {
        shotNumber: 3,
        title: "结构化拆解",
        description: "字幕分层展示新脚本结构，同时人物或光标进行讲解。",
        durationSeconds: 10,
        characterType: "HUMAN",
        motionType: "ACTION",
        dialogueType: "DIALOGUE",
        requiredAssets: [
          {
            type: "CHARACTER_BASE",
            name: "讲解人物底图",
            promptHint: "半身讲解姿态，适合叠加 UI 面板",
          },
          {
            type: "SCENE_BASE",
            name: "脚本结构背景",
            promptHint: "简洁分栏信息板，适合展示 Hook/Case/CTA",
          },
          {
            type: "SFX",
            name: "转场音效",
            promptHint: "清脆科技感 UI 音效",
          },
        ],
      },
    ],
  };
}
