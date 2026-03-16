/** Strip markdown code fences that Gemini sometimes wraps around output. */
export function cleanResponse(text: string): string {
  let output = text.trim();
  if (output.startsWith("```json")) {
    output = output.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (output.startsWith("```")) {
    output = output.replace(/^```\w*\s*/, "").replace(/\s*```$/, "");
  }
  return output;
}

/**
 * Resolve an API key from explicit value or environment variables.
 * Priority: explicit > GEMINI_API_KEY > GOOGLE_CLOUD_API_KEY
 */
export function resolveApiKey(explicit?: string): string | undefined {
  return (
    explicit ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_CLOUD_API_KEY
  );
}
