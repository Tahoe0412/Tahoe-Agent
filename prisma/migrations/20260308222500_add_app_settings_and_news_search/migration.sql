-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('OPENAI', 'GEMINI');

-- CreateEnum
CREATE TYPE "SearchProvider" AS ENUM ('MOCK', 'TAVILY');

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "llm_provider" "LlmProvider" NOT NULL DEFAULT 'OPENAI',
    "llm_model" TEXT NOT NULL DEFAULT 'gpt-4.1-mini',
    "llm_mock_mode" BOOLEAN NOT NULL DEFAULT true,
    "openai_api_key" TEXT,
    "gemini_api_key" TEXT,
    "news_search_provider" "SearchProvider" NOT NULL DEFAULT 'MOCK',
    "news_search_mock_mode" BOOLEAN NOT NULL DEFAULT true,
    "tavily_api_key" TEXT,
    "app_base_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
