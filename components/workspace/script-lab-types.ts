export type ScriptLabRow = {
  id: string;
  sceneOrder: number;
  originalText: string;
  rewritten: string;
  shotGoal: string;
  durationSec: number;
  visualPriority: string[];
  avoid: string[];
  labels: string[];
  classification: {
    humanType: string;
    motionType: string;
    lipSyncType: string;
    assetDependencyType: string;
    productionClass: string;
    difficultyScore: number;
    riskFlags: string[];
  } | null;
  assets: string[];
  assetReady: boolean;
  missingAssets: string[];
  uploadedAssets: Array<{
    id: string;
    type: string;
    fileName: string;
    continuityGroup: string | null;
    fileUrl?: string | null;
  }>;
  continuityGroup: string;
};

export type OutputArtifact = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string | Date;
  taskJson: unknown;
};

export type MarsOutputs = {
  latestVideoTitlePack: OutputArtifact | null;
  videoTitlePacks: OutputArtifact[];
  latestPublishCopy: OutputArtifact | null;
  publishCopyPacks: OutputArtifact[];
};

export type ScriptDraftPreview = {
  id: string;
  title: string | null;
  originalText: string;
  structuredOutput: unknown;
  rawPayload: unknown;
  modelName: string | null;
  sourceType: string;
  createdAt: string | Date;
  versionNumber?: number;
};
