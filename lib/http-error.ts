import { Prisma } from "@prisma/client";
import { fail } from "@/lib/api-response";
import { ZodError } from "zod";

class RouteHttpError extends Error {
  constructor(
    readonly status: number,
    readonly detail?: unknown,
  ) {
    super(typeof detail === "string" ? detail : `HTTP ${status}`);
    this.name = "RouteHttpError";
  }
}

function isNotFoundMessage(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("not found") || message.includes("不存在") || message.includes("未找到");
}

function classifyPrismaKnownError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case "P2002":
      return { status: 409, detail: error.message };
    case "P2003":
    case "P2005":
    case "P2006":
    case "P2007":
    case "P2011":
    case "P2012":
    case "P2013":
      return { status: 400, detail: error.message };
    case "P2025":
      return { status: 404, detail: error.message };
    default:
      return { status: 500, detail: error.message };
  }
}

export function classifyRouteError(error: unknown, defaultStatus = 500) {
  if (error instanceof RouteHttpError) {
    return { status: error.status, detail: error.detail };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      detail: error.flatten(),
    };
  }

  if (error instanceof SyntaxError) {
    return {
      status: 400,
      detail: "请求体不是合法 JSON。",
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { status: 500, detail: error.message };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return classifyPrismaKnownError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, detail: error.message };
  }

  if (error instanceof Error) {
    if (isNotFoundMessage(error.message)) {
      return { status: 404, detail: error.message };
    }

    return {
      status: defaultStatus,
      detail: error.message,
    };
  }

  return { status: defaultStatus, detail: undefined };
}

export function toErrorResponse(error: unknown, message: string, defaultStatus = 500) {
  const { status, detail } = classifyRouteError(error, defaultStatus);
  return fail(message, status, detail);
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new RouteHttpError(400, "请求体不是合法 JSON。");
    }

    throw error;
  }
}

export async function parseOptionalJsonBody<T>(request: Request, fallback: T): Promise<T> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new RouteHttpError(400, "请求体不是合法 JSON。");
  }
}
