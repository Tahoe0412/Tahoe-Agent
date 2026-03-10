import { getConnectorMode, getConnectorTimeoutMs, getPlatformApiKey } from "@/lib/env";
import { buildMockContentItems, buildMockCreators } from "@/lib/platform-mocks";
import type {
  ConnectorError,
  ContentItem,
  Creator,
  PlatformCollectInput,
  PlatformCollectResult,
  SupportedPlatform,
} from "@/types/platform-data";

export interface PlatformConnector {
  readonly platform: SupportedPlatform;
  collect(input: PlatformCollectInput): Promise<PlatformCollectResult>;
}

export abstract class BasePlatformConnector implements PlatformConnector {
  abstract readonly platform: SupportedPlatform;

  async collect(input: PlatformCollectInput): Promise<PlatformCollectResult> {
    const mode = getConnectorMode(Boolean(input.mock));

    if (mode === "mock") {
      return {
        platform: this.platform,
        mode,
        success: true,
        creators: buildMockCreators(this.platform, input.topic),
        content_items: buildMockContentItems(this.platform, input.topic, input),
        errors: [],
        fetched_at: new Date().toISOString(),
      };
    }

    const apiKey = getPlatformApiKey(this.platform);
    if (!apiKey) {
      return this.errorResult("CONFIG_MISSING", `Missing API credentials for ${this.platform}. Falling back requires mock mode.`);
    }

    try {
      const response = await this.fetchLive(input, apiKey);
      return {
        platform: this.platform,
        mode,
        success: true,
        creators: this.transformCreators(response),
        content_items: this.transformContentItems(response),
        errors: [],
        fetched_at: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unexpected ${this.platform} connector error`;
      return this.errorResult("REQUEST_FAILED", message);
    }
  }

  protected async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(getConnectorTimeoutMs()),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      const detail = bodyText.trim().slice(0, 240);
      throw new Error(detail ? `${this.platform} API returned ${response.status}: ${detail}` : `${this.platform} API returned ${response.status}`);
    }

    return (await response.json()) as T;
  }

  protected errorResult(code: ConnectorError["code"], message: string): PlatformCollectResult {
    return {
      platform: this.platform,
      mode: "live",
      success: false,
      creators: [],
      content_items: [],
      errors: [
        {
          platform: this.platform,
          code,
          message,
          retryable: code !== "CONFIG_MISSING" && code !== "NOT_IMPLEMENTED",
        },
      ],
      fetched_at: new Date().toISOString(),
    };
  }

  protected abstract fetchLive(input: PlatformCollectInput, apiKey: string): Promise<unknown>;
  protected abstract transformCreators(payload: unknown): Creator[];
  protected abstract transformContentItems(payload: unknown): ContentItem[];
}
