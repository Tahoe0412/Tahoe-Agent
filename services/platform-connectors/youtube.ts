import { BasePlatformConnector } from "@/services/platform-connectors/base";
import type { ContentItem, Creator, PlatformCollectInput } from "@/types/platform-data";

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelId?: string;
      channelTitle?: string;
      publishedAt?: string;
    };
  }>;
}

interface YouTubeVideosResponse {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      channelId?: string;
      channelTitle?: string;
      publishedAt?: string;
      description?: string;
      tags?: string[];
    };
    contentDetails?: {
      duration?: string;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
}

interface YouTubeChannelsResponse {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      customUrl?: string;
    };
    statistics?: {
      subscriberCount?: string;
      videoCount?: string;
      viewCount?: string;
    };
  }>;
}

interface YouTubeLivePayload {
  search: YouTubeSearchResponse;
  videos: YouTubeVideosResponse;
  channels: YouTubeChannelsResponse;
}

function parseCount(value?: string) {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "");
}

export function parseYouTubeDurationToSeconds(duration?: string) {
  if (!duration) {
    return 0;
  }

  const match = duration.match(/^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)$/i);
  if (!match) {
    return 0;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function resolveContentType(durationSeconds: number) {
  return durationSeconds > 180 ? "LONG_VIDEO" : "SHORT_VIDEO";
}

function resolveCreatorTier(followerCount: number) {
  if (followerCount >= 1_000_000) {
    return "HEAD";
  }
  if (followerCount >= 100_000) {
    return "GROWTH";
  }
  return "EMERGING";
}

function resolveAiProducibilityHints(title: string, description?: string) {
  const corpus = `${title} ${description ?? ""}`.toLowerCase();
  const hints = ["subtitle", "broll_support"];

  if (/\b(ai|workflow|tutorial|guide|how to|demo)\b/.test(corpus)) {
    hints.push("screen_overlay");
  }

  if (/\b(interview|founder|story|talk|podcast)\b/.test(corpus)) {
    hints.push("voiceover");
  }

  return [...new Set(hints)];
}

export class YouTubeConnector extends BasePlatformConnector {
  readonly platform = "YOUTUBE" as const;

  protected async fetchLive(input: PlatformCollectInput, apiKey: string) {
    const searchParams = new URLSearchParams({
      part: "snippet",
      maxResults: String(Math.min(input.limit ?? 6, 12)),
      q: input.topic,
      type: "video",
      order: "relevance",
      key: apiKey,
    });

    const search = await this.fetchJson<YouTubeSearchResponse>(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`, {
      method: "GET",
    });

    const videoIds = [...new Set((search.items ?? []).map((item) => item.id?.videoId).filter((value): value is string => Boolean(value)))];
    const channelIds = [
      ...new Set((search.items ?? []).map((item) => item.snippet?.channelId).filter((value): value is string => Boolean(value))),
    ];

    const [videos, channels] = await Promise.all([
      videoIds.length > 0
        ? this.fetchJson<YouTubeVideosResponse>(
            `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({
              part: "snippet,contentDetails,statistics",
              id: videoIds.join(","),
              key: apiKey,
            }).toString()}`,
            { method: "GET" },
          )
        : Promise.resolve<YouTubeVideosResponse>({ items: [] }),
      channelIds.length > 0
        ? this.fetchJson<YouTubeChannelsResponse>(
            `https://www.googleapis.com/youtube/v3/channels?${new URLSearchParams({
              part: "snippet,statistics",
              id: channelIds.join(","),
              key: apiKey,
            }).toString()}`,
            { method: "GET" },
          )
        : Promise.resolve<YouTubeChannelsResponse>({ items: [] }),
    ]);

    return { search, videos, channels } satisfies YouTubeLivePayload;
  }

  protected transformCreators(payload: YouTubeLivePayload): Creator[] {
    const creatorMap = new Map<string, Creator>();
    const channelMap = new Map((payload.channels.items ?? []).flatMap((item) => (item.id ? [[item.id, item]] : [])));

    for (const item of payload.search.items ?? []) {
      const channelId = item.snippet?.channelId;
      const channelTitle = item.snippet?.channelTitle;
      if (!channelId || !channelTitle || creatorMap.has(channelId)) {
        continue;
      }

      const channel = channelMap.get(channelId);
      const followerCount = parseCount(channel?.statistics?.subscriberCount);
      const customUrl = channel?.snippet?.customUrl?.replace(/^@?/, "");

      creatorMap.set(channelId, {
        platform: this.platform,
        external_creator_id: channelId,
        handle: customUrl ? `@${customUrl}` : `@${channelTitle.replace(/\s+/g, "").toLowerCase()}`,
        display_name: channel?.snippet?.title ?? channelTitle,
        profile_url: customUrl ? `https://www.youtube.com/@${customUrl}` : `https://www.youtube.com/channel/${channelId}`,
        follower_count: followerCount || undefined,
        average_view_count: undefined,
        creator_tier: resolveCreatorTier(followerCount),
        raw_payload: {
          search_item: item,
          channel,
        },
      });
    }

    return [...creatorMap.values()];
  }

  protected transformContentItems(payload: YouTubeLivePayload): ContentItem[] {
    const videoMap = new Map((payload.videos.items ?? []).flatMap((item) => (item.id ? [[item.id, item]] : [])));

    return (payload.search.items ?? []).flatMap((item) => {
      const videoId = item.id?.videoId;
      const video = videoId ? videoMap.get(videoId) : undefined;
      const title = video?.snippet?.title ?? item.snippet?.title;
      const publishedAt = video?.snippet?.publishedAt ?? item.snippet?.publishedAt;

      if (!videoId || !title || !publishedAt) {
        return [];
      }

      const normalizedTitle = normalizeTitle(title);
      const durationSeconds = parseYouTubeDurationToSeconds(video?.contentDetails?.duration);
      const keywordSet = [...new Set([...(video?.snippet?.tags ?? []), ...normalizedTitle.split("_").filter(Boolean)])].slice(0, 12);
      const topicHints = normalizedTitle.split("_").filter(Boolean).slice(0, 4);
      const viewCount = parseCount(video?.statistics?.viewCount);
      const likeCount = parseCount(video?.statistics?.likeCount);
      const commentCount = parseCount(video?.statistics?.commentCount);

      return [
        {
          platform: this.platform,
          external_content_id: videoId,
          creator_external_id: video?.snippet?.channelId ?? item.snippet?.channelId,
          creator_handle: (video?.snippet?.channelTitle ?? item.snippet?.channelTitle)
            ? `@${(video?.snippet?.channelTitle ?? item.snippet?.channelTitle ?? "").replace(/\s+/g, "").toLowerCase()}`
            : undefined,
          content_type: resolveContentType(durationSeconds),
          production_class: "HYBRID",
          title,
          normalized_title: normalizedTitle,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          published_at: publishedAt,
          duration_seconds: durationSeconds || undefined,
          view_count: viewCount,
          like_count: likeCount,
          comment_count: commentCount,
          share_count: 0,
          keyword_set: keywordSet,
          topic_hints: topicHints,
          ai_producibility_hints: resolveAiProducibilityHints(title, video?.snippet?.description),
          raw_payload: {
            search_item: item,
            video,
          },
        },
      ];
    });
  }
}
