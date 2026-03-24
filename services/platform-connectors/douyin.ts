import { SerperPlatformConnector } from "@/services/platform-connectors/serper-base";

/**
 * Douyin (抖音) connector — uses Serper site-scoped Google search.
 * Searches `site:douyin.com` for the given topic.
 */
export class DouyinConnector extends SerperPlatformConnector {
  readonly platform = "DOUYIN" as const;

  protected readonly config = {
    siteDomain: "douyin.com",
    locale: { gl: "cn", hl: "zh-cn" },
    contentType: "SHORT_VIDEO" as const,
    productionClass: "UGC" as const,
  };

  protected extractCreatorFromUrl(url: string, title: string) {
    // douyin.com/user/xxx or douyin.com/video/xxx
    const userMatch = url.match(/douyin\.com\/user\/([a-zA-Z0-9_-]+)/);
    if (userMatch) {
      return {
        id: userMatch[1],
        handle: `@dy_${userMatch[1].slice(0, 8)}`,
        displayName: title.split(/[|\-–—]/)[0]?.trim() || `抖音用户`,
        profileUrl: `https://www.douyin.com/user/${userMatch[1]}`,
      };
    }
    return null;
  }
}
