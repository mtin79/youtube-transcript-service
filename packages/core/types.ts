export interface TranscriptOptions {
  /** Preferred language code (default: "en"). Use "original" for source language. */
  lang?: string;
  /** Gemini model to use (default: "gemini-3-flash-preview") */
  model?: string;
  /** Include timestamps in [MM:SS] format (default: true) */
  timestamps?: boolean;
  /** Output as JSON array instead of plain text (default: false) */
  json?: boolean;
  /** Include speaker identification (default: false) */
  speakers?: boolean;
  /** Start offset in seconds for video clipping */
  startOffset?: number;
  /** End offset in seconds for video clipping */
  endOffset?: number;
  /** Gemini API key (falls back to GEMINI_API_KEY env var) */
  apiKey?: string;
}

export interface TranscriptResult {
  /** The transcript text (or JSON string if json option was set) */
  transcript: string;
  /** The canonical YouTube URL that was transcribed */
  videoUrl: string;
  /** The video ID extracted from the input */
  videoId: string;
  /** Token usage metadata from the Gemini API */
  usage?: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface GeminiErrorDetail {
  status: number;
  message: string;
  isRateLimit: boolean;
  isVideoTooLong: boolean;
  isPermissionError: boolean;
}
