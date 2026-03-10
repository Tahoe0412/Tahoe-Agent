import { ok } from "@/lib/api-response";

export async function GET() {
  return ok({
    platforms: ["YOUTUBE", "X", "TIKTOK"],
    shotCharacterTypes: ["HUMAN", "NON_HUMAN", "NONE"],
    shotMotionTypes: ["ACTION", "STATIC"],
    shotDialogueTypes: ["DIALOGUE", "SILENT"],
    assetTypes: [
      "CHARACTER_BASE",
      "SCENE_BASE",
      "CHARACTER_SCENE_COMPOSITE",
      "PROP",
      "VOICE",
      "MUSIC",
      "SFX",
      "BROLL",
    ],
  });
}
