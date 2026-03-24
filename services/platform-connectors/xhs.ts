import { SerperPlatformConnector } from "@/services/platform-connectors/serper-base";

/**
 * XHS (Xiaohongshu / 小红书) connector — uses Serper site-scoped Google search.
 * Searches `site:xiaohongshu.com` for the given topic.
 */
export class XhsConnector extends SerperPlatformConnector {
  readonly platform = "XHS" as const;

  protected readonly config = {
    siteDomain: "xiaohongshu.com",
    locale: { gl: "cn", hl: "zh-cn" },
    contentType: "POST" as const,
    productionClass: "UGC" as const,
  };

  protected extractCreatorFromUrl(url: string, title: string) {
    // xiaohongshu.com/user/profile/xxx or xiaohongshu.com/explore/xxx
    const userMatch = url.match(/xiaohongshu\.com\/user\/profile\/([a-zA-Z0-9]+)/);
    if (userMatch) {
      return {
        id: userMatch[1],
        handle: `@xhs_${userMatch[1].slice(0, 8)}`,
        displayName: title.split(/[|\-–—]/)[0]?.trim() || `XHS用户`,
        profileUrl: `https://www.xiaohongshu.com/user/profile/${userMatch[1]}`,
      };
    }
    return null;
  }
}
