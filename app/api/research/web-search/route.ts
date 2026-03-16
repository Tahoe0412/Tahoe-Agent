import { NextResponse } from "next/server";
import { AppSettingsService } from "@/services/app-settings.service";
import { SerperSearchService } from "@/services/web-search/serper-search.service";

const appSettingsService = new AppSettingsService();

interface WebSearchRequest {
  query: string;
  limit?: number;
  language?: string;
  siteDomain?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebSearchRequest;

    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or empty 'query' field." },
        { status: 400 },
      );
    }

    const settings = await appSettingsService.getEffectiveSettings();

    if (!settings.serperApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "SERPER_API_KEY is not configured. Get one at serper.dev and add it in Settings.",
          provider: "GOOGLE",
        },
        { status: 422 },
      );
    }

    const serperService = new SerperSearchService(settings.serperApiKey);

    const result = body.siteDomain
      ? await serperService.searchPlatformContent({
          query: body.query.trim(),
          siteDomain: body.siteDomain,
          limit: body.limit,
        })
      : await serperService.searchGeneral({
          query: body.query.trim(),
          limit: body.limit,
          language: body.language,
        });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
