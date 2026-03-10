import type { ResearchOutput } from "@/schemas/project";
import { AssetDependencyService } from "@/services/asset-dependency.service";
import { ScriptRewriteService } from "@/services/script-rewrite.service";
import { ShotClassificationService } from "@/services/shot-classification.service";
import { TrendAnalysisService } from "@/services/trend-analysis.service";

export class ReportGeneratorService {
  private readonly trendAnalysisService = new TrendAnalysisService();
  private readonly scriptRewriteService = new ScriptRewriteService();
  private readonly shotClassificationService = new ShotClassificationService();
  private readonly assetDependencyService = new AssetDependencyService();

  build(output: ResearchOutput) {
    return {
      trendSummary: this.trendAnalysisService.summarize(output),
      creators: output.creators,
      contentPatterns: output.contentPatterns,
      rewrittenScript: this.scriptRewriteService.getNarrative(output),
      shotClassification: this.shotClassificationService.classify(output),
      assetDependencies: this.assetDependencyService.map(output),
    };
  }
}
