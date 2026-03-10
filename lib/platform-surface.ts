export type PlatformSurface =
  | "XIAOHONGSHU_POST"
  | "XIAOHONGSHU_VIDEO"
  | "DOUYIN_VIDEO"
  | "DOUYIN_TITLE"
  | "COMMENT_REPLY"
  | "COVER_COPY";

export type AdaptationStatus = "DRAFT" | "READY" | "APPROVED" | "ARCHIVED";

export const platformSurfaceList: PlatformSurface[] = [
  "XIAOHONGSHU_POST",
  "XIAOHONGSHU_VIDEO",
  "DOUYIN_VIDEO",
  "DOUYIN_TITLE",
  "COMMENT_REPLY",
  "COVER_COPY",
];

export function getPlatformSurfaceMeta(surface: PlatformSurface, locale: "zh" | "en" = "zh") {
  const zh = {
    XIAOHONGSHU_POST: { label: "小红书正文", description: "适合图文正文、正文节奏与话题展开。" },
    XIAOHONGSHU_VIDEO: { label: "小红书视频口播", description: "适合视频口播、简短旁白和镜头台词。" },
    DOUYIN_VIDEO: { label: "抖音视频脚本", description: "适合短视频脚本、镜头描述和口播结构。" },
    DOUYIN_TITLE: { label: "抖音标题", description: "适合标题、封面标题和开场钩子。" },
    COMMENT_REPLY: { label: "评论区互动回复", description: "适合评论区追问、答疑和互动引导。" },
    COVER_COPY: { label: "封面文案", description: "适合封面主标题、卡点文案和视觉短句。" },
  } as const;

  const en = {
    XIAOHONGSHU_POST: { label: "Xiaohongshu Post", description: "For feed copy and post-body structure." },
    XIAOHONGSHU_VIDEO: { label: "Xiaohongshu Video VO", description: "For spoken lines and short video narration." },
    DOUYIN_VIDEO: { label: "Douyin Video Script", description: "For video scripting and spoken structure." },
    DOUYIN_TITLE: { label: "Douyin Title", description: "For titles and opening hooks." },
    COMMENT_REPLY: { label: "Comment Reply", description: "For replies, Q&A, and interaction prompts." },
    COVER_COPY: { label: "Cover Copy", description: "For cover headlines and short visual copy." },
  } as const;

  return (locale === "en" ? en : zh)[surface];
}

export function getAdaptationStatusLabel(status: string, locale: "zh" | "en" = "zh") {
  const zh: Record<string, string> = {
    DRAFT: "草稿",
    READY: "已生成",
    APPROVED: "已确认",
    ARCHIVED: "已归档",
  };

  const en: Record<string, string> = {
    DRAFT: "Draft",
    READY: "Ready",
    APPROVED: "Approved",
    ARCHIVED: "Archived",
  };

  return (locale === "en" ? en : zh)[status] ?? status;
}
