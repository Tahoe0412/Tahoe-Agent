import { z } from "zod";
import { ok } from "@/lib/api-response";
import { parseOptionalJsonBody, toErrorResponse } from "@/lib/http-error";
import { allOutputTypes, type OutputType } from "@/lib/content-line";
import { ProjectOutputGeneratorService } from "@/services/project-output-generator.service";

const projectOutputGeneratorService = new ProjectOutputGeneratorService();

const requestSchema = z.object({
  outputType: z.enum(allOutputTypes as [OutputType, ...OutputType[]]).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = requestSchema.parse(await parseOptionalJsonBody(request, {}));
    const result = await projectOutputGeneratorService.generate(id, body.outputType);
    return ok(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "生成目标产物失败。");
  }
}
