import type { ResearchOutput } from "@/schemas/project";

export class ShotClassificationService {
  classify(output: ResearchOutput) {
    return output.shotPlans.map((shot) => ({
      shotNumber: shot.shotNumber,
      title: shot.title,
      characterType: shot.characterType,
      motionType: shot.motionType,
      dialogueType: shot.dialogueType,
    }));
  }
}
