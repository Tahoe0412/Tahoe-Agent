export type StyleReferenceInsight = {
  paragraphCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  rhythmLabel: string;
  toneLabels: string[];
  structureLabels: string[];
  titleStyleLines: string[];
  openingStyleLines: string[];
  bodyRhythmLines: string[];
  summaryLines: string[];
};

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitSentences(text: string) {
  return text
    .split(/[。！？!?；;\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function takeFirstSentence(text: string) {
  return splitSentences(text)[0] ?? "";
}

export function analyzeStyleReferenceSample(text: string | null | undefined): StyleReferenceInsight | null {
  const source = (text ?? "").trim();
  if (!source) {
    return null;
  }

  const paragraphs = splitParagraphs(source);
  const sentences = splitSentences(source);
  const averageSentenceLength =
    sentences.length > 0
      ? Math.round(sentences.reduce((sum, item) => sum + item.replace(/\s+/g, "").length, 0) / sentences.length)
      : 0;

  const rhythmLabel =
    averageSentenceLength <= 18
      ? "短句偏多，节奏快"
      : averageSentenceLength <= 32
        ? "长短句均衡，节奏稳定"
        : "长句偏多，解释展开感强";

  const toneLabels = [
    /(必须|立刻|马上|就是|一定|核心|关键|结果|转化)/.test(source) ? "推进感强" : null,
    /(陪伴|治愈|安心|温柔|松弛|感受|生活)/.test(source) ? "情绪感明显" : null,
    /(为什么|如何|到底|是不是|能不能|？|\?)/.test(source) ? "善用提问开场" : null,
    /(我们|我|作为|一路|亲自)/.test(source) ? "有人称视角" : null,
    /(数据|研究|验证|方法|结构|逻辑|专业)/.test(source) ? "理性解释偏强" : null,
    /(高级|质感|审美|轻盈|克制|体验)/.test(source) ? "审美表达偏强" : null,
  ].filter(Boolean) as string[];

  const structureLabels = [
    /(第一|第二|第三|1\.|2\.|3\.)/.test(source) ? "有明显分点结构" : null,
    /(因为|所以|不是|而是|先|再|最后)/.test(source) ? "偏因果推进" : null,
    paragraphs.length >= 3 ? "段落层次清楚" : null,
    /CTA|行动|现在|点击|私信|留言|收藏|转发/.test(source) ? "结尾有行动引导" : null,
  ].filter(Boolean) as string[];

  const firstParagraph = paragraphs[0] ?? "";
  const firstSentence = takeFirstSentence(source);
  const titleStyleLines = [
    /[，、：]/.test(firstSentence) ? "标题适合使用带停顿的观察式短句，不要直接喊卖点。" : "标题适合保持简洁克制，少用营销口号。",
    /(城市|自然|山林|空间|材料|光线|秩序|路径)/.test(firstSentence)
      ? "标题可优先借城市、自然、空间或材料意象切入。"
      : "标题不要先讲功能，优先建立场域和感受。",
    /(为什么|如何|到底|是不是|\?)/.test(firstSentence)
      ? "标题更适合用含蓄提问，而不是直接促销。"
      : "标题更适合陈述式观察，不要像硬广标题。",
  ];
  const openingStyleLines = [
    /(城市|街道|山林|庭院|自然|空间|门店|光线|材料)/.test(firstParagraph)
      ? "开头先写城市、空间、自然或材料观察，再慢慢引出品牌。"
      : "开头避免先讲产品卖点，先建立生活场景和观察。",
    /(我们|品牌|产品)/.test(firstSentence)
      ? "开头不要急着自我介绍，先让读者进入画面和气氛。"
      : "开头适合先给画面，再给品牌信息。",
    averageSentenceLength >= 24
      ? "开头可以用稍长句推进，但要保持节奏克制，不要像说明书。"
      : "开头句长适合长短交替，避免连续短促口号。",
  ];
  const bodyRhythmLines = [
    paragraphs.length >= 4
      ? "正文适合按“观察场域 -> 材料细节 -> 空间/理念 -> 收束落点”慢慢推进。"
      : "正文适合分成 3 到 4 层推进，不要一段里把所有价值说完。",
    averageSentenceLength >= 28
      ? "正文节奏偏长句展开，适合解释材料、工艺、路径和细微变化。"
      : "正文节奏适合长短句交替，用短句收束重点、长句铺陈细节。",
    /(树枝|石材|树脂|地板|柱|墙面|天花板|瓦片|种子|枝桠)/.test(source)
      ? "正文要多写具体物件、材质、结构和触感，少写抽象理念。"
      : "正文要增加具体物件、动作和感官细节，减少抽象价值词。",
  ];

  const summaryLines = [
    `样稿共 ${paragraphs.length} 段、约 ${sentences.length} 句，整体属于“${rhythmLabel}”。`,
    `语气特征：${(toneLabels.length > 0 ? toneLabels : ["表达克制"]).join("、")}。`,
    `结构特征：${(structureLabels.length > 0 ? structureLabels : ["自然铺陈"]).join("、")}。`,
    `标题风格：${titleStyleLines[0]}`,
    `开头风格：${openingStyleLines[0]}`,
    `正文节奏：${bodyRhythmLines[0]}`,
  ];

  return {
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    averageSentenceLength: clamp(averageSentenceLength, 0, 999),
    rhythmLabel,
    toneLabels: toneLabels.length > 0 ? toneLabels : ["表达克制"],
    structureLabels: structureLabels.length > 0 ? structureLabels : ["自然铺陈"],
    titleStyleLines,
    openingStyleLines,
    bodyRhythmLines,
    summaryLines,
  };
}

export function formatStyleReferenceInsight(insight: StyleReferenceInsight | null) {
  if (!insight) return "N/A";
  return [
    `- 标题风格学习：${insight.titleStyleLines.join(" ")}`,
    `- 开头风格学习：${insight.openingStyleLines.join(" ")}`,
    `- 正文节奏学习：${insight.bodyRhythmLines.join(" ")}`,
    `- 节奏特征：${insight.rhythmLabel}`,
    `- 语气特征：${insight.toneLabels.join("、")}`,
    `- 结构特征：${insight.structureLabels.join("、")}`,
    `- 样稿规模：${insight.paragraphCount} 段 / ${insight.sentenceCount} 句`,
  ].join("\n");
}
