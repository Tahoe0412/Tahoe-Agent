import { fail, ok } from "@/lib/api-response";
import { StoryboardService } from "@/services/storyboard.service";

const storyboardService = new StoryboardService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reference = await storyboardService.addFrameReference(id, await request.json());
    return ok(reference, { status: 201 });
  } catch (error) {
    return fail("创建 frame reference 失败。", 400, error instanceof Error ? error.message : undefined);
  }
}
