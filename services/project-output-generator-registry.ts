import type { OutputType } from "@/lib/content-line";

export type SupportedProjectOutputType =
  | "PLATFORM_COPY"
  | "VIDEO_TITLE"
  | "PUBLISH_COPY"
  | "AD_CREATIVE"
  | "AD_STORYBOARD";

export const supportedProjectOutputTypes: SupportedProjectOutputType[] = [
  "PLATFORM_COPY",
  "VIDEO_TITLE",
  "PUBLISH_COPY",
  "AD_CREATIVE",
  "AD_STORYBOARD",
];

export function isSupportedProjectOutputType(outputType: OutputType): outputType is SupportedProjectOutputType {
  return supportedProjectOutputTypes.includes(outputType as SupportedProjectOutputType);
}

export function assertSupportedProjectOutputType(outputType: OutputType) {
  if (!isSupportedProjectOutputType(outputType)) {
    throw new Error(`Output type ${outputType} is not supported by the project output generator yet.`);
  }

  return outputType;
}

export interface ProjectOutputGenerationResult {
  outputType: SupportedProjectOutputType;
  artifactKind: "strategy_task" | "storyboard";
  artifactId: string;
  title: string;
  summary?: string | null;
}

