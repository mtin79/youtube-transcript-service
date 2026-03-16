import type { TranscriptOptions, TranscriptResult, GeminiErrorDetail } from "./types.js";
import { extractVideoId, toCanonicalUrl } from "./url-parser.js";
import { buildPrompt, buildVideoPart } from "./prompt-builder.js";
import { cleanResponse, resolveApiKey } from "./response-parser.js";

const DEFAULT_MODEL = "gemini-3-flash-preview";

/**
 * Transcribe a YouTube video using the Gemini REST API.
 *
 * This is the main entry point for the core library. It:
 *   1. Parses the video URL/ID
 *   2. Builds the prompt and video part
 *   3. Calls the Gemini generateContent API
 *   4. Parses and returns the transcript
 *
 * @throws {Error} If no API key is found, video ID is invalid, or API call fails.
 */
export async function transcribeVideo(
  videoInput: string,
  options: TranscriptOptions = {}
): Promise<TranscriptResult> {
  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey) {
    throw new Error(
      "No API key found. Provide one via the apiKey option, " +
        "or set GEMINI_API_KEY or GOOGLE_CLOUD_API_KEY environment variable. " +
        "Get a free key at https://aistudio.google.com/apikey"
    );
  }

  const videoId = extractVideoId(videoInput);
  if (!videoId) {
    throw new Error(`Could not extract a video ID from "${videoInput}"`);
  }

  const videoUrl = toCanonicalUrl(videoId);
  const model = options.model || DEFAULT_MODEL;
  const prompt = buildPrompt(options);
  const videoPart = buildVideoPart(videoUrl, options);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [videoPart, { text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 65536,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || res.statusText;

    const detail: GeminiErrorDetail = {
      status: res.status,
      message: msg,
      isRateLimit: res.status === 429,
      isVideoTooLong:
        msg.includes("resource") || msg.includes("Resource"),
      isPermissionError:
        msg.includes("permission") || msg.includes("Permission"),
    };

    const error = new Error(`Gemini API error (${res.status}): ${msg}`);
    (error as any).detail = detail;
    throw error;
  }

  const data = await res.json();

  const text =
    (data as any)?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join("") || "";

  if (!text) {
    const finishReason = (data as any)?.candidates?.[0]?.finishReason;
    throw new Error(
      `Gemini returned an empty response${finishReason ? ` (finish reason: ${finishReason})` : ""}`
    );
  }

  const usage = (data as any)?.usageMetadata;

  return {
    transcript: cleanResponse(text),
    videoUrl,
    videoId,
    usage: usage
      ? {
          promptTokens: usage.promptTokenCount ?? 0,
          outputTokens: usage.candidatesTokenCount ?? 0,
          totalTokens: usage.totalTokenCount ?? 0,
        }
      : undefined,
  };
}
