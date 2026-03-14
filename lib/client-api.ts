import type { ApiErrorPayload } from "@/lib/api-response";
import type { Locale } from "@/lib/locale-copy";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  error?: ApiErrorPayload;
};

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail?: unknown;
  readonly traceId?: string;

  constructor(params: {
    message: string;
    status: number;
    code?: string;
    detail?: unknown;
    traceId?: string;
  }) {
    super(params.message);
    this.name = "ApiClientError";
    this.status = params.status;
    this.code = params.code;
    this.detail = params.detail;
    this.traceId = params.traceId;
  }
}

function detailToText(detail: unknown): string | null {
  if (!detail) {
    return null;
  }

  if (typeof detail === "string") {
    return detail.trim() || null;
  }

  if (typeof detail === "number" || typeof detail === "boolean") {
    return String(detail);
  }

  if (Array.isArray(detail)) {
    const lines = detail.map((item) => detailToText(item)).filter(Boolean);
    return lines.length > 0 ? lines.join("；") : null;
  }

  if (typeof detail === "object") {
    return JSON.stringify(detail, null, 2);
  }

  return null;
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as ApiEnvelope<T>;
}

export async function apiRequest<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = await parseEnvelope<T>(response);

  if (!response.ok || !payload?.success) {
    const error = payload && !payload.success ? payload.error : undefined;
    throw new ApiClientError({
      message: error?.message || `服务器返回错误 (${response.status})`,
      status: response.status,
      code: error?.code,
      detail: error?.detail,
      traceId: error?.trace_id,
    });
  }

  return payload.data;
}

export function explainClientError(error: unknown, locale: Locale = "zh") {
  const fallback =
    locale === "en"
      ? {
          title: "Something went wrong",
          suggestion: "Please retry. If the issue persists, copy the trace id and check the server logs.",
        }
      : {
          title: "操作没有完成",
          suggestion: "请先重试一次；如果仍然失败，可以复制 trace id 去服务器日志里定位。",
        };

  if (error instanceof ApiClientError) {
    const detail = detailToText(error.detail);
    const suggestion =
      locale === "en"
        ? error.code === "INVALID_JSON"
          ? "Check whether the submitted content is valid JSON."
          : error.code === "VALIDATION_ERROR"
            ? "Review the required fields and input format, then submit again."
            : error.code === "DB_NOT_READY"
              ? "Database initialization looks incomplete. Run the latest Prisma steps first."
              : error.code === "TIMEOUT"
                ? "The request timed out. Try a smaller input or retry later."
                : error.status >= 500
                  ? "This is likely a server-side issue. Retry later or inspect logs with the trace id."
                  : fallback.suggestion
        : error.code === "INVALID_JSON"
          ? "请检查提交内容是不是合法 JSON。"
          : error.code === "VALIDATION_ERROR"
            ? "请检查必填项、字段格式和输入长度后再试一次。"
            : error.code === "DB_NOT_READY"
              ? "数据库初始化可能还不完整，请先执行最新 Prisma 步骤。"
              : error.code === "TIMEOUT"
                ? "请求超时了，建议缩短输入内容或稍后重试。"
                : error.status >= 500
                  ? "这更像是服务端问题，建议稍后重试，或根据 trace id 去日志里定位。"
                  : fallback.suggestion;

    return {
      title: error.message || fallback.title,
      detail,
      suggestion,
      traceId: error.traceId,
      code: error.code,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      title: error.message || fallback.title,
      detail: null,
      suggestion: fallback.suggestion,
      traceId: undefined,
      code: undefined,
      status: undefined,
    };
  }

  return {
    title: fallback.title,
    detail: null,
    suggestion: fallback.suggestion,
    traceId: undefined,
    code: undefined,
    status: undefined,
  };
}
