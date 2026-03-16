import type { TranscriptOptions } from "./types.js";

/** Build the Gemini prompt for transcript extraction. */
export function buildPrompt(options: TranscriptOptions = {}): string {
  const {
    lang = "en",
    timestamps = true,
    json = false,
    speakers = false,
  } = options;

  const speakerInstruction = speakers
    ? "Identify different speakers and prefix each segment with the speaker label (e.g., 'Speaker 1:', 'Host:', the speaker's name if identifiable)."
    : "";

  const timestampInstruction = timestamps
    ? "Include timestamps in [MM:SS] format at the start of each segment (every few seconds or at natural speech boundaries)."
    : "Do NOT include timestamps.";

  const langInstruction =
    lang === "original"
      ? "Transcribe in the original language spoken in the video."
      : `Transcribe the audio in ${lang}. If the video is in a different language, translate to ${lang}.`;

  return `You are a precise transcription assistant. Produce a complete, verbatim transcript of this YouTube video.

Instructions:
- ${langInstruction}
- ${timestampInstruction}
- ${speakerInstruction}
- Transcribe ALL spoken content from start to finish — do not summarize or skip sections.
- Preserve the natural flow of speech. Include filler words only if they are meaningful.
- For technical terms, proper nouns, and abbreviations, be as accurate as possible.
- If there are sections with no speech (music, silence), note them briefly like [Music] or [Silence].
${
  json
    ? `
- Output the transcript as a JSON array where each element is an object with:
  ${timestamps ? '- "time": timestamp string in "MM:SS" format' : ""}
  ${speakers ? '- "speaker": speaker label string' : ""}
  - "text": the transcribed text for that segment
- Output ONLY the JSON array, no other text.`
    : `
- Output the transcript as plain text, one segment per line.
${timestamps ? "- Start each line with the timestamp in [MM:SS] format." : ""}
${speakers ? "- Prefix the speaker label before the text." : ""}
- Output ONLY the transcript, no preamble or summary.`
}`;
}

/** Build the Gemini video part with optional clipping metadata. */
export function buildVideoPart(
  videoUrl: string,
  options: TranscriptOptions = {}
): Record<string, unknown> {
  const part: Record<string, unknown> = {
    fileData: {
      fileUri: videoUrl,
      mimeType: "video/*",
    },
  };

  if (options.startOffset != null || options.endOffset != null) {
    const videoMetadata: Record<string, string> = {};
    if (options.startOffset != null)
      videoMetadata.startOffset = `${options.startOffset}s`;
    if (options.endOffset != null)
      videoMetadata.endOffset = `${options.endOffset}s`;
    part.videoMetadata = videoMetadata;
  }

  return part;
}
