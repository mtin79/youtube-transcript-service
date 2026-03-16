#!/usr/bin/env bun
/**
 * YouTube Transcript MCP Server
 *
 * Exposes youtube_transcribe and youtube_list_models tools via the
 * Model Context Protocol (stdio transport).
 *
 * Reads GEMINI_API_KEY from environment (provided via Claude Desktop config).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { transcribeVideo } from "@youtube-transcript/core";

// ── Helpers ──────────────────────────────────────────────

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function error(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true as const };
}

// ── MCP Server ──────────────────────────────────────────

const server = new McpServer({
  name: "youtube-transcript-mcp-server",
  version: "1.0.0",
});

// ── Tool: youtube_transcribe ────────────────────────────

server.registerTool(
  "youtube_transcribe",
  {
    title: "Transcribe YouTube Video",
    description: `Extract a full transcript from a YouTube video using the Gemini API.

Supports any public YouTube video URL or video ID. Options include language selection,
speaker diarization, timestamps, JSON output, and video clipping.

Args:
  - url (string): YouTube video URL or 11-character video ID.
  - lang (string): Language code for transcription (default: "en"). Use "original" for source language.
  - model (string): Gemini model to use (default: "gemini-3-flash-preview").
  - timestamps (boolean): Include [MM:SS] timestamps (default: true).
  - json (boolean): Output as JSON array (default: false).
  - speakers (boolean): Include speaker identification (default: false).
  - start_offset (number): Start offset in seconds for video clipping.
  - end_offset (number): End offset in seconds for video clipping.`,
    inputSchema: {
      url: z.string().min(1).describe("YouTube video URL or 11-character video ID"),
      lang: z.string().default("en").describe('Language code (default: "en", use "original" for source language)'),
      model: z.string().default("gemini-3-flash-preview").describe("Gemini model to use"),
      timestamps: z.boolean().default(true).describe("Include [MM:SS] timestamps"),
      json: z.boolean().default(false).describe("Output as JSON array"),
      speakers: z.boolean().default(false).describe("Include speaker identification"),
      start_offset: z.number().optional().describe("Start offset in seconds for video clipping"),
      end_offset: z.number().optional().describe("End offset in seconds for video clipping"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ url, lang, model, timestamps, json: jsonOutput, speakers, start_offset, end_offset }) => {
    try {
      const result = await transcribeVideo(url, {
        lang,
        model,
        timestamps,
        json: jsonOutput,
        speakers,
        startOffset: start_offset,
        endOffset: end_offset,
      });

      return json({
        transcript: result.transcript,
        videoUrl: result.videoUrl,
        videoId: result.videoId,
        usage: result.usage,
      });
    } catch (err: any) {
      return error(err.message);
    }
  }
);

// ── Tool: youtube_list_models ───────────────────────────

server.registerTool(
  "youtube_list_models",
  {
    title: "List Available Gemini Models",
    description: "Returns a table of Gemini models suitable for YouTube video transcription, with their characteristics.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    return json({
      models: [
        {
          id: "gemini-3-flash-preview",
          tier: "default",
          notes: "Next-gen, most token-efficient. Default choice.",
        },
        {
          id: "gemini-2.5-pro",
          tier: "stable",
          notes: "Stable, most accurate. Best for long videos (64k output tokens).",
        },
        {
          id: "gemini-3.1-pro-preview",
          tier: "preview",
          notes: "Most advanced preview model.",
        },
        {
          id: "gemini-3.1-flash-lite-preview",
          tier: "preview",
          notes: "Cheapest and fastest preview model.",
        },
      ],
      notes: [
        "Free tier: max 8h of YouTube video/day; paid: no length limit.",
        "~300 tokens/second of video at default resolution.",
        "Up to 10 video URLs per request (Gemini 2.5+).",
        "Gemini 2.0 Flash is deprecated and retires June 2026.",
      ],
    });
  }
);

// ── Start ───────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
