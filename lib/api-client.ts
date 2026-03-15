/**
 * Unified API client — all frontend components use this to call backend APIs.
 * Handles: error parsing, timeout, response validation.
 * No token/auth needed for now (server-side APIs are internal).
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Timeout in ms (default: 15000) */
  timeout?: number;
}

async function request<T>(
  url: string,
  init: RequestInit,
  options?: RequestOptions,
): Promise<T> {
  const timeoutMs = options?.timeout ?? 15_000;

  // Compose abort: user signal + timeout signal
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    const body = await response.json();

    if (!response.ok) {
      throw new ApiError(
        body?.error ?? `Request failed with ${response.status}`,
        response.status,
        body?.code,
      );
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out", 408, "TIMEOUT");
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown request error",
      0,
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  post<T>(url: string, data: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(url, { method: "POST", body: JSON.stringify(data) }, options);
  },

  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return request<T>(url, { method: "GET" }, options);
  },
};
