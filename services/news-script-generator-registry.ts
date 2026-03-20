import type { ContentLine, OutputType } from "@/lib/content-line";
import type { NewsItemForPrompt, TrendItemForPrompt } from "@/lib/news-script-prompt";

export type SupportedNewsScriptOutputType = Extract<OutputType, "NARRATIVE_SCRIPT" | "AD_SCRIPT">;

export const supportedNewsScriptOutputTypes: SupportedNewsScriptOutputType[] = [
  "NARRATIVE_SCRIPT",
  "AD_SCRIPT",
];

export function isSupportedNewsScriptOutputType(
  outputType: OutputType,
): outputType is SupportedNewsScriptOutputType {
  return supportedNewsScriptOutputTypes.includes(outputType as SupportedNewsScriptOutputType);
}

export function assertSupportedNewsScriptOutputType(outputType: OutputType) {
  if (!isSupportedNewsScriptOutputType(outputType)) {
    throw new Error(`Output type ${outputType} is not supported by the news script entry yet.`);
  }

  return outputType;
}

export interface NewsScriptGeneratorResult {
  projectId: string;
  scriptId: string;
  title: string;
}

export interface NewsScriptProjectRef {
  id: string;
}

export interface NewsItemInputLike {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  source_type: string;
  published_at: string;
}

export interface NarrativeNewsScriptGenerationInput {
  project: NewsScriptProjectRef;
  searchQuery: string;
  newsItems: NewsItemInputLike[];
  factPromptItems: NewsItemForPrompt[];
  trendPromptItems: TrendItemForPrompt[];
  contentLine: ContentLine;
  outputType: "NARRATIVE_SCRIPT";
}

export interface AdNewsScriptGenerationInput {
  project: NewsScriptProjectRef;
  searchQuery: string;
  newsItems: NewsItemInputLike[];
  factPromptItems: NewsItemForPrompt[];
  contentLine: ContentLine;
  outputType: "AD_SCRIPT";
}

export interface NewsScriptGenerationInputByType {
  NARRATIVE_SCRIPT: NarrativeNewsScriptGenerationInput;
  AD_SCRIPT: AdNewsScriptGenerationInput;
}

export type NewsScriptGeneratorRegistry = {
  [K in SupportedNewsScriptOutputType]: (
    input: NewsScriptGenerationInputByType[K],
  ) => Promise<NewsScriptGeneratorResult>;
};

export function getNewsScriptGenerator<K extends SupportedNewsScriptOutputType>(
  registry: NewsScriptGeneratorRegistry,
  outputType: K,
) {
  return registry[outputType];
}
