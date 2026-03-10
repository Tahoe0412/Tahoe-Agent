import type { ResearchOutput } from "@/schemas/project";

export class ScriptRewriteService {
  getNarrative(output: ResearchOutput) {
    return output.rewrittenScript;
  }
}
