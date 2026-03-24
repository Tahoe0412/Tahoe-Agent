import { BasePlatformConnector } from "@/services/platform-connectors/base";
import type { ContentItem, Creator, PlatformCollectInput } from "@/types/platform-data";

interface XRecentSearchResponse {
  data?: Array<{
    id?: string;
    text?: string;
    author_id?: string;
    created_at?: string;
    public_metrics?: {
      like_count?: number;
      reply_count?: number;
      retweet_count?: number;
      impression_count?: number;
    };
  }>;
  includes?: {
    users?: Array<{
      id?: string;
      name?: string;
      username?: string;
      public_metrics?: {
        followers_count?: number;
        tweet_count?: number;
      };
    }>;
  };
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "");
}

function resolveCreatorTier(followerCount: number) {
  if (followerCount >= 500_000) {
    return "HEAD";
  }
  if (followerCount >= 50_000) {
    return "GROWTH";
  }
  return "EMERGING";
}

function summarizeTweet(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

export class XConnector extends BasePlatformConnector {
  readonly platform = "X" as const;

  protected async fetchLive(input: PlatformCollectInput, apiKey: string) {
    const params = new URLSearchParams({
      query: `${input.topic} -is:retweet`,
      // X API v2 requires max_results between 10 and 100
      max_results: String(Math.max(10, Math.min(input.limit ?? 10, 25))),
      expansions: "author_id",
      "tweet.fields": "created_at,public_metrics,author_id",
      "user.fields": "name,username,public_metrics",
    });

    return this.fetchJson<XRecentSearchResponse>(`https://api.x.com/2/tweets/search/recent?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  protected transformCreators(payload: XRecentSearchResponse): Creator[] {
    return (payload.includes?.users ?? []).flatMap((user) => {
      if (!user.id || !user.username || !user.name) {
        return [];
      }

      const followerCount = user.public_metrics?.followers_count ?? 0;

      return [
        {
          platform: this.platform,
          external_creator_id: user.id,
          handle: `@${user.username}`,
          display_name: user.name,
          profile_url: `https://x.com/${user.username}`,
          follower_count: followerCount || undefined,
          average_view_count: undefined,
          creator_tier: resolveCreatorTier(followerCount),
          raw_payload: user,
        },
      ];
    });
  }

  protected transformContentItems(payload: XRecentSearchResponse): ContentItem[] {
    const userMap = new Map((payload.includes?.users ?? []).flatMap((user) => (user.id ? [[user.id, user]] : [])));

    return (payload.data ?? []).flatMap((tweet) => {
      if (!tweet.id || !tweet.text || !tweet.created_at) {
        return [];
      }

      const author = tweet.author_id ? userMap.get(tweet.author_id) : undefined;
      const title = summarizeTweet(tweet.text);
      const normalizedTitle = normalizeTitle(title);

      return [
        {
          platform: this.platform,
          external_content_id: tweet.id,
          creator_external_id: tweet.author_id,
          creator_handle: author?.username ? `@${author.username}` : undefined,
          content_type: "POST",
          production_class: "UGC",
          title,
          normalized_title: normalizedTitle,
          url: author?.username ? `https://x.com/${author.username}/status/${tweet.id}` : `https://x.com/i/web/status/${tweet.id}`,
          published_at: tweet.created_at,
          view_count: tweet.public_metrics?.impression_count ?? 0,
          like_count: tweet.public_metrics?.like_count ?? 0,
          comment_count: tweet.public_metrics?.reply_count ?? 0,
          share_count: tweet.public_metrics?.retweet_count ?? 0,
          keyword_set: normalizedTitle.split("_").filter(Boolean).slice(0, 12),
          topic_hints: normalizedTitle.split("_").filter(Boolean).slice(0, 4),
          ai_producibility_hints: ["caption_first", "text_overlay", "comment_hook"],
          raw_payload: {
            tweet,
            author,
          },
        },
      ];
    });
  }
}
