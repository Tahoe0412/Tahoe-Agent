import { SerperPlatformConnector } from "@/services/platform-connectors/serper-base";

/**
 * TikTok connector — uses Serper site-scoped Google search.
 * Searches `site:tiktok.com` for the given topic.
 */
export class TikTokConnector extends SerperPlatformConnector {
  readonly platform = "TIKTOK" as const;

  protected readonly config = {
    siteDomain: "tiktok.com",
    locale: { gl: "us", hl: "en" },
    contentType: "SHORT_VIDEO" as const,
    productionClass: "UGC" as const,
  };

  protected extractCreatorFromUrl(url: string, title: string) {
    // tiktok.com/@username/video/xxx
    const userMatch = url.match(/tiktok\.com\/@([a-zA-Z0-9._]+)/);
    if (userMatch) {
      return {
        id: userMatch[1],
        handle: `@${userMatch[1]}`,
        displayName: title.split(/[|\-–—]/)[0]?.trim() || userMatch[1],
        profileUrl: `https://www.tiktok.com/@${userMatch[1]}`,
      };
    }
    return null;
  }
}
