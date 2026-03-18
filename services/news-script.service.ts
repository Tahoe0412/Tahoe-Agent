import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateStructuredJson } from "@/lib/openai-json";
import { buildNewsScriptPrompt, type NewsItemForPrompt, type TrendItemForPrompt } from "@/lib/news-script-prompt";
import type { Prisma } from "@prisma/client";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Zod schema for the LLM output */
const generatedScriptSchema = z.object({
  title: z.string(),
  opening: z.string(),
  body: z.string(),
  closing: z.string(),
  full_text: z.string(),
  estimated_duration_sec: z.number().default(90),
});

type GeneratedScript = z.infer<typeof generatedScriptSchema>;

export interface NewsItemInput {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  source_type: string;
  published_at: string;
}

export class NewsScriptService {
  /**
   * Generate a news-roundup script from selected news items.
   * 1. Creates a Project
   * 2. Calls LLM to generate a script
   * 3. Persists the script to DB
   * 4. Returns { projectId, scriptId }
   */
  async generate(input: {
    searchQuery: string;
    newsItems: NewsItemInput[];
  }): Promise<{ projectId: string; scriptId: string; title: string }> {
    const { searchQuery, newsItems } = input;

    if (newsItems.length === 0) {
      throw new Error("至少选择一条新闻。");
    }

    // 1. Create a project for this script
    const project = await prisma.project.create({
      data: {
        title: `${searchQuery} — 新闻盘点`,
        topic_query: searchQuery,
        source_language: "zh-CN",
        status: "DRAFT",
      },
    });

    // 2. Build prompt — split by role
    const factNewsItems = newsItems.filter((i) => i.source_type !== "trend_signal");
    const trendNewsItems = newsItems.filter((i) => i.source_type === "trend_signal");

    const factPromptItems: NewsItemForPrompt[] = factNewsItems.map((item) => ({
      title: item.title,
      source: item.source,
      published_at: item.published_at,
      snippet: item.snippet,
    }));

    const trendPromptItems: TrendItemForPrompt[] = trendNewsItems.map((item) => ({
      title: item.title,
      source: item.source,
      snippet: item.snippet,
    }));

    const { systemPrompt, userPrompt } = buildNewsScriptPrompt(factPromptItems, trendPromptItems, searchQuery);

    let generatedScript: GeneratedScript;
    try {
      generatedScript = await generateStructuredJson<GeneratedScript>({
        schemaName: "news_roundup_script",
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            opening: { type: "string" },
            body: { type: "string" },
            closing: { type: "string" },
            full_text: { type: "string" },
            estimated_duration_sec: { type: "number" },
          },
          required: ["title", "opening", "body", "closing", "full_text"],
        },
        zodSchema: generatedScriptSchema as never,
        systemPrompt,
        userPrompt,
        routeKey: "SCRIPT_REWRITE",
        preprocess: (raw: unknown) => {
          // Handle bare string response — wrap into expected shape
          if (typeof raw === "string") {
            return {
              title: `${searchQuery} 新闻盘点`,
              opening: "",
              body: raw,
              closing: "",
              full_text: raw,
              estimated_duration_sec: 90,
            };
          }
          return raw;
        },
      });
    } catch (error) {
      // If LLM fails, still save a draft with the raw news content
      const fallbackText = newsItems
        .map((item, i) => `${i + 1}. 【${item.source}】${item.title}\n${item.snippet}`)
        .join("\n\n");

      generatedScript = {
        title: `${searchQuery} — 新闻整合`,
        opening: `今天关于"${searchQuery}"有 ${newsItems.length} 条值得关注的消息。`,
        body: fallbackText,
        closing: "以上就是今天的新闻盘点，记得关注我们获取更多热点分析。",
        full_text: `今天关于"${searchQuery}"有 ${newsItems.length} 条值得关注的消息。\n\n${fallbackText}\n\n以上就是今天的新闻盘点，记得关注我们获取更多热点分析。`,
        estimated_duration_sec: 90,
      };
      console.warn("[news-script] LLM failed, using fallback script:", error);
    }

    // 3. Persist the script
    const scriptCount = await prisma.script.count({
      where: { project_id: project.id },
    });

    const script = await prisma.script.create({
      data: {
        project_id: project.id,
        source_type: "USER_INPUT",
        script_status: "ACTIVE",
        version_number: scriptCount + 1,
        title: generatedScript.title,
        original_text: generatedScript.full_text,
        rewritten_text: null,
        model_name: "news-roundup-llm",
        structured_output: toJson({
          title: generatedScript.title,
          opening: generatedScript.opening,
          body: generatedScript.body,
          closing: generatedScript.closing,
          estimated_duration_sec: generatedScript.estimated_duration_sec,
          scene_split_status: "pending",
        }),
        raw_payload: toJson({
          origin: "news_roundup",
          search_query: searchQuery,
          news_items: newsItems,
          generated_at: new Date().toISOString(),
        }),
      },
    });

    return {
      projectId: project.id,
      scriptId: script.id,
      title: generatedScript.title,
    };
  }
}
