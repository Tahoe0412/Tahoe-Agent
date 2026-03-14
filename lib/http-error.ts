import { Prisma } from "@prisma/client";
import { fail, type ApiErrorCode } from "@/lib/api-response";
import { ZodError } from "zod";

class RouteHttpError extends Error {
  constructor(
    readonly status: number,
    readonly detail?: unknown,
    readonly code?: ApiErrorCode | string,
  ) {
    super(typeof detail === "string" ? detail : `HTTP ${status}`);
    this.name = "RouteHttpError";
  }
}

function createTraceId() {
  try {
    return globalThis.crypto?.randomUUID?.() ?? `trace_${Date.now().toString(36)}`;
  } catch {
    return `trace_${Date.now().toString(36)}`;
  }
}

function isNotFoundMessage(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("not found") || message.includes("不存在") || message.includes("未找到");
}

function classifyPrismaKnownError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case "P2002":
      return { status: 409, detail: error.message, code: "CONFLICT" as const };
    case "P2003":
    case "P2005":
    case "P2006":
    case "P2007":
    case "P2011":
    case "P2012":
    case "P2013":
      return { status: 400, detail: error.message, code: "DATA_INTEGRITY_ERROR" as const };
    case "P2025":
      return { status: 404, detail: error.message, code: "NOT_FOUND" as const };
    default:
      return { status: 500, detail: error.message, code: "INTERNAL_ERROR" as const };
  }
}

export function classifyRouteError(error: unknown, defaultStatus = 500) {
  if (error instanceof RouteHttpError) {
    return { status: error.status, detail: error.detail, code: error.code };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      detail: error.flatten(),
      code: "VALIDATION_ERROR" as const,
    };
  }

  if (error instanceof SyntaxError) {
    return {
      status: 400,
      detail: "请求体不是合法 JSON。",
      code: "INVALID_JSON" as const,
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { status: 500, detail: error.message, code: "DB_NOT_READY" as const };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return classifyPrismaKnownError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, detail: error.message, code: "VALIDATION_ERROR" as const };
  }

  if (error instanceof Error) {
    if (isNotFoundMessage(error.message)) {
      return { status: 404, detail: error.message, code: "NOT_FOUND" as const };
    }

    return {
      status: defaultStatus,
      detail: error.message,
      code: defaultStatus >= 500 ? ("INTERNAL_ERROR" as const) : undefined,
    };
  }

  return { status: defaultStatus, detail: undefined, code: defaultStatus >= 500 ? ("INTERNAL_ERROR" as const) : undefined };
}

export function toErrorResponse(error: unknown, message: string, defaultStatus = 500) {
  const { status, detail, code } = classifyRouteError(error, defaultStatus);
  const traceId = createTraceId();

  console.error(`[${traceId}] ${message}`, {
    status,
    code,
    detail,
    error,
  });

  return fail(message, status, detail, { code, traceId });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new RouteHttpError(400, "请求体不是合法 JSON。", "INVALID_JSON");
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
    throw new RouteHttpError(400, "请求体不是合法 JSON。", "INVALID_JSON");
  }
}
