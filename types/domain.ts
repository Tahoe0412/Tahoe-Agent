export type SupportedPlatform = "YOUTUBE" | "X" | "TIKTOK" | "XHS" | "DOUYIN";

export type ShotCharacterType = "HUMAN" | "NON_HUMAN" | "NONE";
export type ShotMotionType = "ACTION" | "STATIC";
export type ShotDialogueType = "DIALOGUE" | "SILENT";

export type AssetType =
  | "CHARACTER_BASE"
  | "SCENE_BASE"
  | "CHARACTER_SCENE_COMPOSITE"
  | "PROP"
  | "VOICE"
  | "MUSIC"
  | "SFX"
  | "BROLL";

export interface TrendSignal {
  title: string;
  summary: string;
  momentumScore: number;
  keywords: string[];
}

export interface CreatorInsight {
  handle: string;
  platform: SupportedPlatform;
  displayName: string;
  followerCount?: number;
  averageViews?: number;
  niche?: string;
  angle: string;
}

export interface ContentPatternInsight {
  title: string;
  patternType: string;
  summary: string;
  evidence: string[];
}

export interface ShotPlan {
  shotNumber: number;
  title: string;
  description: string;
  durationSeconds: number;
  characterType: ShotCharacterType;
  motionType: ShotMotionType;
  dialogueType: ShotDialogueType;
  requiredAssets: {
    type: AssetType;
    name: string;
    promptHint: string;
  }[];
}
