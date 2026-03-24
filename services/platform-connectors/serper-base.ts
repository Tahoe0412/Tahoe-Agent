import { BasePlatformConnector } from "@/services/platform-connectors/base";
import type { ContentItem, Creator, PlatformCollectInput, SupportedPlatform } from "@/types/platform-data";

/**
 * Serper search response shape (uses /search endpoint, not /news).
 */
interface SerperOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  sitelinks?: unknown;
}

interface SerperSearchResponse {
  organic?: SerperOrganicItem[];
  searchParameters?: Record<string, string>;
}

interface SerperPlatformConfig {
  siteDomain: string;
  locale: { gl: string; hl: string };
  contentType: ContentItem["content_type"];
  productionClass: ContentItem["production_class"];
}

/**
 * Base class for platform connectors that use Serper site-scoped Google search
 * (site:xiaohongshu.com, site:douyin.com, site:tiktok.com).
 *
 * The API key used is SERPER_API_KEY, not a platform-specific key.
 */
export abstract class SerperPlatformConnector extends BasePlatformConnector {
  protected abstract readonly config: SerperPlatformConfig;

  protected async fetchLive(input: PlatformCollectInput, apiKey: string): Promise<SerperSearchResponse> {
    const limit = Math.min(input.limit ?? 6, 10);
    const query = `site:${this.config.siteDomain} ${input.topic}`;

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: this.config.locale.gl,
        hl: this.config.locale.hl,
        num: limit,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Serper search for ${this.platform} failed (${response.status}): ${errorText.slice(0, 200)}`);
    }

    return (await response.json()) as SerperSearchResponse;
  }

  protected transformCreators(payload: SerperSearchResponse): Creator[] {
    const creatorMap = new Map<string, Creator>();

    for (const item of payload.organic ?? []) {
      const creatorInfo = this.extractCreatorFromUrl(item.link ?? "", item.title ?? "");
      if (!creatorInfo || creatorMap.has(creatorInfo.id)) continue;

      creatorMap.set(creatorInfo.id, {
        platform: this.platform,
        external_creator_id: creatorInfo.id,
        handle: creatorInfo.handle,
        display_name: creatorInfo.displayName,
        profile_url: creatorInfo.profileUrl,
        follower_count: undefined, // not available via search
        average_view_count: undefined,
        creator_tier: "EMERGING",
        raw_payload: { source: "serper_search" },
      });
    }

    return [...creatorMap.values()];
  }

  protected transformContentItems(payload: SerperSearchResponse): ContentItem[] {
    return (payload.organic ?? [])
      .filter((item) => item.title && item.link)
      .map((item, index) => {
        const title = item.title ?? "Untitled";
        const normalizedTitle = title
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "_")
          .replace(/^_+|_+$/g, "");

        const creatorInfo = this.extractCreatorFromUrl(item.link ?? "", title);
        const keywordTokens = normalizedTitle
          .split("_")
          .filter(Boolean)
          .filter((t) => t.length >= 2)
          .slice(0, 8);

        return {
          platform: this.platform,
          external_content_id: `serper-${this.platform.toLowerCase()}-${index}`,
          creator_external_id: creatorInfo?.id,
          creator_handle: creatorInfo?.handle,
          content_type: this.config.contentType,
          production_class: this.config.productionClass,
          title,
          normalized_title: normalizedTitle,
          url: item.link ?? "",
          published_at: item.date ?? new Date().toISOString(),
          duration_seconds: undefined,
          view_count: 0,
          like_count: 0,
          comment_count: 0,
          share_count: 0,
          keyword_set: keywordTokens,
          topic_hints: keywordTokens.slice(0, 4),
          ai_producibility_hints: [],
          raw_payload: {
            source: "serper_search",
            snippet: item.snippet ?? "",
            organic_item: item,
          },
        } satisfies ContentItem;
      });
  }

  /**
   * Override in subclass to extract creator info from URL patterns.
   * e.g. xiaohongshu.com/user/profile/xxx
   */
  protected abstract extractCreatorFromUrl(
    url: string,
    title: string,
  ): { id: string; handle: string; displayName: string; profileUrl?: string } | null;
}
