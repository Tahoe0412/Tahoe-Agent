import type { ResearchOutput } from "@/schemas/project";

export class TrendAnalysisService {
  summarize(output: ResearchOutput) {
    return output.trendResearch.map((item) => ({
      title: item.title,
      score: item.momentumScore,
      keywords: item.keywords,
    }));
  }
}
