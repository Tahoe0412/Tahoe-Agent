import { NextResponse } from "next/server";
import { AppSettingsService } from "@/services/app-settings.service";
import { TavilySearchService } from "@/services/web-search/tavily-search.service";

const appSettingsService = new AppSettingsService();

interface WebSearchRequest {
  query: string;
  limit?: number;
  searchDepth?: "basic" | "advanced";
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

    if (!settings.tavilyApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "TAVILY_API_KEY is not configured. Please add it in Settings.",
          provider: "TAVILY",
        },
        { status: 422 }
      );
    }

    const tavilyService = new TavilySearchService(settings.tavilyApiKey);

    const result = body.siteDomain
      ? await tavilyService.searchPlatformContent({
          query: body.query.trim(),
          siteDomain: body.siteDomain,
          limit: body.limit,
        })
      : await tavilyService.searchGeneral({
          query: body.query.trim(),
          limit: body.limit,
          searchDepth: body.searchDepth,
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
