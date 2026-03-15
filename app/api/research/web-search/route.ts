import { NextResponse } from "next/server";
import { AppSettingsService } from "@/services/app-settings.service";
import { GoogleSearchService } from "@/services/web-search/google-search.service";

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

    if (!settings.googleSearchApiKey || !settings.googleSearchCx) {
      return NextResponse.json(
        {
          success: false,
          error: "GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX is not configured. Please add them in Settings.",
          provider: "GOOGLE",
        },
        { status: 422 },
      );
    }

    const googleService = new GoogleSearchService(settings.googleSearchApiKey, settings.googleSearchCx);

    const result = body.siteDomain
      ? await googleService.searchPlatformContent({
          query: body.query.trim(),
          siteDomain: body.siteDomain,
          limit: body.limit,
        })
      : await googleService.searchGeneral({
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
