import { ok, fail } from "@/lib/api-response";
import { runHotTopicsResearch, type HotTopicsRequest } from "@/services/hot-topics/hot-topics.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HotTopicsRequest;

    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return fail("Missing or empty 'query' field.", 400);
    }

    return ok(await runHotTopicsResearch(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return fail(message, 500);
  }
}
