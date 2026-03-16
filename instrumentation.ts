/**
 * Next.js Instrumentation — runs once when the server starts.
 *
 * Sets the global undici dispatcher to an EnvHttpProxyAgent so that
 * server-side `fetch()` calls route through the proxy for external APIs,
 * while respecting NO_PROXY to skip proxying for internal requests.
 *
 * Required because the Tencent Cloud server (mainland China) cannot
 * directly reach Google, OpenAI, YouTube, etc.
 *
 * Set in .env.local on the server:
 *   HTTPS_PROXY=http://127.0.0.1:7890
 *   NO_PROXY=localhost,127.0.0.1,10.*
 */
export async function register() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) return;

  // Ensure internal requests bypass the proxy
  if (!process.env.NO_PROXY) {
    process.env.NO_PROXY = "localhost,127.0.0.1,10.*,172.16.*,192.168.*";
  }

  try {
    const undici = await import(/* webpackIgnore: true */ "undici");
    undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent());
    console.log(`[proxy] EnvHttpProxyAgent active → ${proxyUrl} (NO_PROXY: ${process.env.NO_PROXY})`);
  } catch (error) {
    console.warn("[proxy] Failed to set up proxy dispatcher:", error);
  }
}
