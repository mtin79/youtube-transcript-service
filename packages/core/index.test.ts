import { describe, expect, test } from "bun:test";
import { extractVideoId, toCanonicalUrl } from "./url-parser.js";
import { buildPrompt, buildVideoPart } from "./prompt-builder.js";
import { cleanResponse, resolveApiKey } from "./response-parser.js";

describe("url-parser", () => {
  describe("extractVideoId", () => {
    test("extracts from standard watch URL", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    test("extracts from short URL", () => {
      expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    test("extracts from embed URL", () => {
      expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    test("extracts from shorts URL", () => {
      expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    test("accepts bare 11-character ID", () => {
      expect(extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    test("returns null for invalid input", () => {
      expect(extractVideoId("not-a-url")).toBeNull();
      expect(extractVideoId("https://example.com")).toBeNull();
    });
  });

  describe("toCanonicalUrl", () => {
    test("builds canonical URL from video ID", () => {
      expect(toCanonicalUrl("dQw4w9WgXcQ")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    });
  });
});

describe("prompt-builder", () => {
  test("builds default prompt with timestamps", () => {
    const prompt = buildPrompt();
    expect(prompt).toContain("timestamps in [MM:SS] format");
    expect(prompt).toContain("Transcribe the audio in en");
  });

  test("builds prompt without timestamps", () => {
    const prompt = buildPrompt({ timestamps: false });
    expect(prompt).toContain("Do NOT include timestamps");
  });

  test("builds prompt with speakers", () => {
    const prompt = buildPrompt({ speakers: true });
    expect(prompt).toContain("Identify different speakers");
  });

  test("builds prompt for original language", () => {
    const prompt = buildPrompt({ lang: "original" });
    expect(prompt).toContain("original language spoken in the video");
  });

  test("builds JSON output prompt", () => {
    const prompt = buildPrompt({ json: true });
    expect(prompt).toContain("JSON array");
  });

  describe("buildVideoPart", () => {
    test("creates basic video part", () => {
      const part = buildVideoPart("https://www.youtube.com/watch?v=abc");
      expect(part.fileData).toEqual({
        fileUri: "https://www.youtube.com/watch?v=abc",
        mimeType: "video/*",
      });
      expect(part.videoMetadata).toBeUndefined();
    });

    test("adds clipping metadata", () => {
      const part = buildVideoPart("https://www.youtube.com/watch?v=abc", {
        startOffset: 40,
        endOffset: 120,
      });
      expect(part.videoMetadata).toEqual({
        startOffset: "40s",
        endOffset: "120s",
      });
    });
  });
});

describe("response-parser", () => {
  test("strips json code fences", () => {
    expect(cleanResponse("```json\n[{\"text\":\"hello\"}]\n```")).toBe('[{"text":"hello"}]');
  });

  test("strips generic code fences", () => {
    expect(cleanResponse("```\nhello world\n```")).toBe("hello world");
  });

  test("passes through clean text", () => {
    expect(cleanResponse("  hello world  ")).toBe("hello world");
  });
});
