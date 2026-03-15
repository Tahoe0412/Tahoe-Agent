import type { Creator, PlatformCollectInput, SupportedPlatform, ContentItem } from "@/types/platform-data";

function toTopicKey(topic: string) {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join("_");
}

export function buildMockCreators(platform: SupportedPlatform, topic: string): Creator[] {
  const topicKey = toTopicKey(topic);

  return [
    {
      platform,
      external_creator_id: `${platform.toLowerCase()}_${topicKey}_alpha`,
      handle: `@${topicKey}_alpha`,
      display_name: `${platform} Alpha`,
      profile_url: `https://example.com/${platform.toLowerCase()}/${topicKey}_alpha`,
      follower_count: 420000,
      average_view_count: 180000,
      creator_tier: "HEAD",
    },
    {
      platform,
      external_creator_id: `${platform.toLowerCase()}_${topicKey}_beta`,
      handle: `@${topicKey}_beta`,
      display_name: `${platform} Beta`,
      profile_url: `https://example.com/${platform.toLowerCase()}/${topicKey}_beta`,
      follower_count: 160000,
      average_view_count: 82000,
      creator_tier: "GROWTH",
    },
  ];
}

export function buildMockContentItems(
  platform: SupportedPlatform,
  topic: string,
  input: PlatformCollectInput,
): ContentItem[] {
  const topicKey = toTopicKey(topic);
  const limit = Math.max(1, Math.min(input.limit ?? 6, 10));
  const publishedBase = new Date("2026-03-08T10:00:00.000Z").getTime();

  return Array.from({ length: limit }, (_, index) => {
    const viewBase = platform === "YOUTUBE" ? 220000 : platform === "TIKTOK" ? 280000 : 95000;
    const contentType = platform === "X" ? "POST" : "SHORT_VIDEO";
    const productionClass = platform === "X" ? "SCREEN_CAPTURE" : index % 2 === 0 ? "UGC" : "HYBRID";
    const views = Math.max(viewBase - index * 14000, platform === "X" ? 6000 : 18000);
    const likes = Math.max(Math.round(views * 0.07), 0);
    const comments = Math.max(Math.round(views * 0.008), 0);
    const shares = Math.max(Math.round(views * 0.012), 0);

    return {
      platform,
      external_content_id: `${platform.toLowerCase()}_${topicKey}_${index + 1}`,
      creator_external_id: `${platform.toLowerCase()}_${topicKey}_${index % 2 === 0 ? "alpha" : "beta"}`,
      creator_handle: `@${topicKey}_${index % 2 === 0 ? "alpha" : "beta"}`,
      content_type: contentType,
      production_class: productionClass,
      title:
        index % 2 === 0
          ? `${topic} result-first hook breakdown ${index + 1}`
          : `${topic} UGC workflow case study ${index + 1}`,
      normalized_title:
        index % 2 === 0
          ? `${topicKey}_result_first_hook_breakdown_${index + 1}`
          : `${topicKey}_ugc_workflow_case_study_${index + 1}`,
      url: `https://example.com/${platform.toLowerCase()}/${topicKey}/${index + 1}`,
      published_at: new Date(publishedBase - index * 1000 * 60 * 60 * 4).toISOString(),
      duration_seconds: contentType === "SHORT_VIDEO" ? 32 + index * 4 : undefined,
      view_count: views,
      like_count: likes,
      comment_count: comments,
      share_count: shares,
      keyword_set: [topicKey, "result_first_hook", "ugc", platform.toLowerCase()],
      topic_hints: [topicKey, "result_first_hook", "ugc_workflow"],
      ai_producibility_hints:
        productionClass === "SCREEN_CAPTURE"
          ? ["screen_proof", "text_overlay"]
          : ["talking_head", "broll_support", "subtitle"],
      raw_payload: {
        mock: true,
        platform,
        rank: index + 1,
      },
    };
  });
}
