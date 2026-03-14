import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATA_INTEGRITY_ERROR"
  | "DB_NOT_READY"
  | "INTERNAL_ERROR"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED";

export type ApiErrorPayload = {
  message: string;
  detail?: unknown;
  code?: ApiErrorCode | string;
  trace_id?: string;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  message: string,
  status = 400,
  detail?: unknown,
  options?: {
    code?: ApiErrorCode | string;
    traceId?: string;
  },
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        detail,
        code: options?.code,
        trace_id: options?.traceId,
      },
    },
    { status },
  );
}
