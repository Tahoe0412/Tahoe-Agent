export type SupportedPlatform = "YOUTUBE" | "X" | "TIKTOK" | "XHS" | "DOUYIN";

export type ConnectorMode = "mock" | "live";

export type ContentType = "SHORT_VIDEO" | "LONG_VIDEO" | "THREAD" | "POST" | "ARTICLE" | "LIVE_STREAM";

export type ProductionClass = "UGC" | "STUDIO" | "SCREEN_CAPTURE" | "HYBRID" | "ANIMATION";

export type ConnectorErrorCode =
  | "CONFIG_MISSING"
  | "REQUEST_FAILED"
  | "RATE_LIMITED"
  | "TRANSFORM_FAILED"
  | "NOT_IMPLEMENTED";

export interface Creator {
  platform: SupportedPlatform;
  external_creator_id: string;
  handle: string;
  display_name: string;
  profile_url?: string;
  follower_count?: number;
  average_view_count?: number;
  creator_tier: "HEAD" | "GROWTH" | "EMERGING";
  raw_payload?: unknown;
}

export interface ContentItem {
  platform: SupportedPlatform;
  external_content_id: string;
  creator_external_id?: string;
  creator_handle?: string;
  content_type: ContentType;
  production_class: ProductionClass;
  title: string;
  normalized_title: string;
  url: string;
  published_at: string;
  duration_seconds?: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  keyword_set: string[];
  topic_hints: string[];
  ai_producibility_hints: string[];
  raw_payload?: unknown;
}

export interface ConnectorError {
  platform: SupportedPlatform;
  code: ConnectorErrorCode;
  message: string;
  retryable: boolean;
}

export interface PlatformCollectInput {
  topic: string;
  limit?: number;
  mock?: boolean;
}

export interface PlatformCollectResult {
  platform: SupportedPlatform;
  mode: ConnectorMode;
  success: boolean;
  creators: Creator[];
  content_items: ContentItem[];
  errors: ConnectorError[];
  fetched_at: string;
}
