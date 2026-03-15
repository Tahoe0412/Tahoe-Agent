import { NextResponse } from "next/server";
import { AppSettingsService } from "@/services/app-settings.service";
import { BingSearchService } from "@/services/web-search/bing-search.service";

const appSettingsService = new AppSettingsService();

interface WebSearchRequest {
  query: string;
  limit?: number;
  market?: string;
  siteDomain?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebSearchRequest;

    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or empty 'query' field." },
        { status: 400 }
      );
    }

    const settings = await appSettingsService.getEffectiveSettings();

    if (!settings.bingApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "BING_API_KEY is not configured. Please add it in Settings.",
          provider: "BING",
        },
        { status: 422 }
      );
    }

    const bingService = new BingSearchService(settings.bingApiKey);

    const result = body.siteDomain
      ? await bingService.searchPlatformContent({
          query: body.query.trim(),
          siteDomain: body.siteDomain,
          limit: body.limit,
        })
      : await bingService.searchGeneral({
          query: body.query.trim(),
          limit: body.limit,
          market: body.market,
        });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
