import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/http-error";
import { ProjectOutputGeneratorService } from "@/services/project-output-generator.service";
import { StoryboardGeneratorService } from "@/services/storyboard-generator.service";

const requestSchema = z.object({
  projectId: z.string().min(1),
  scriptId: z.string().min(1).optional(),
});

const storyboardGeneratorService = new StoryboardGeneratorService();
const projectOutputGeneratorService = new ProjectOutputGeneratorService();

type QuickStep = {
  step: "IMAGE_BRIEF" | "TITLE_PACK" | "PUBLISH_COPY";
  ok: boolean;
  message?: string;
};

async function runStep(step: QuickStep["step"], action: () => Promise<unknown>): Promise<QuickStep> {
  try {
    await action();
    return { step, ok: true };
  } catch (error) {
    return {
      step,
      ok: false,
      message: error instanceof Error ? error.message : "Unknown quick-package failure.",
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await parseJsonBody(request));
    const steps: QuickStep[] = [];

    // Run sequentially. Local 35B models should not receive concurrent generation requests.
    steps.push(
      await runStep("IMAGE_BRIEF", () =>
        storyboardGeneratorService.generate({
          projectId: body.projectId,
          scriptId: body.scriptId,
        }),
      ),
    );
    steps.push(await runStep("TITLE_PACK", () => projectOutputGeneratorService.generate(body.projectId, "VIDEO_TITLE")));
    steps.push(await runStep("PUBLISH_COPY", () => projectOutputGeneratorService.generate(body.projectId, "PUBLISH_COPY")));

    return ok({
      projectId: body.projectId,
      completed: steps.filter((step) => step.ok).length,
      failed: steps.filter((step) => !step.ok).length,
      steps,
    });
  } catch (error) {
    return fail("快速生成发布包失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
