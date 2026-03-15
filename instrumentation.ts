/**
 * Next.js Instrumentation — runs once when the server starts.
 *
 * Sets the global undici dispatcher to a ProxyAgent so that ALL
 * server-side `fetch()` calls route through the proxy.
 *
 * Required because the Tencent Cloud server (mainland China) cannot
 * directly reach Google, OpenAI, YouTube, etc.
 *
 * Set HTTPS_PROXY in .env.local on the server:
 *   HTTPS_PROXY=http://127.0.0.1:7890
 */
export async function register() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) return;

  try {
    const undici = await import(/* webpackIgnore: true */ "undici");
    undici.setGlobalDispatcher(new undici.ProxyAgent(proxyUrl));
    console.log(`[proxy] undici ProxyAgent active → ${proxyUrl}`);
  } catch (error) {
    console.warn("[proxy] Failed to set up proxy dispatcher:", error);
  }
}
