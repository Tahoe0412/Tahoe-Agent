"use client";

/**
 * Inline script that catches chunk-load errors (caused by stale HTML
 * referencing deleted JS chunks after a deploy) and auto-reloads the page once.
 *
 * Uses sessionStorage to prevent infinite reload loops.
 */
export function ChunkReloadScript() {
  const code = `
(function() {
  var KEY = '__tahoe_chunk_reload';
  window.addEventListener('error', function(e) {
    var msg = (e.message || '') + ' ' + ((e.error && e.error.message) || '');
    if (
      /ChunkLoadError|Loading chunk .+ failed|Failed to fetch dynamically imported module/i.test(msg)
    ) {
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
    }
  });
  // Clear the flag on successful load so future deploys can trigger a reload
  window.addEventListener('load', function() {
    sessionStorage.removeItem(KEY);
  });
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
