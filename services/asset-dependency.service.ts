import type { ResearchOutput } from "@/schemas/project";

export class AssetDependencyService {
  map(output: ResearchOutput) {
    return output.shotPlans.flatMap((shot) =>
      shot.requiredAssets.map((asset) => ({
        shotNumber: shot.shotNumber,
        shotTitle: shot.title,
        ...asset,
      })),
    );
  }
}
