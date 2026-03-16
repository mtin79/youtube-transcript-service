/**
 * Extract a YouTube video ID from various URL formats or a bare 11-character ID.
 *
 * Supports:
 *   - Standard: https://www.youtube.com/watch?v=ID
 *   - Short:    https://youtu.be/ID
 *   - Embed:    https://www.youtube.com/embed/ID
 *   - Shorts:   https://www.youtube.com/shorts/ID
 *   - Bare ID:  dQw4w9WgXcQ
 */
export function extractVideoId(input: string): string | null {
  if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0];
    if (url.searchParams.has("v")) return url.searchParams.get("v");
    const m = url.pathname.match(/\/(embed|shorts|v)\/([\w-]{11})/);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

/** Convert a video ID to the canonical YouTube watch URL. */
export function toCanonicalUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
