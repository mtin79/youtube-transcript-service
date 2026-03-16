# YouTube Transcript Service

Extract full transcripts from YouTube videos using the Google Gemini API (multimodal video understanding).

A Bun workspace monorepo with 3 distribution options sharing a core library.

## Architecture

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/core` | Shared Gemini transcript logic (zero deps) | Ready |
| `packages/mcp-server` | MCP server for Claude Desktop (stdio) | Ready |
| `packages/webapp` | React Router v7 web UI | Ready |
| Claude Code skill | Already installed at `~/.claude/skills/youtube-transcript` | Done |

## Quick Start

```bash
# Install dependencies
bun install

# Run core tests
bun test packages/core/

# Start webapp dev server
cd packages/webapp && npm run dev

# Deploy MCP server to Claude Desktop
cd packages/mcp-server && bash deploy.sh
```

## Core API

```typescript
import { transcribeVideo } from "@youtube-transcript/core";

const result = await transcribeVideo("https://www.youtube.com/watch?v=...", {
  lang: "en",           // Language code or "original"
  model: "gemini-3-flash-preview",
  timestamps: true,     // [MM:SS] timestamps
  speakers: false,      // Speaker diarization
  json: false,          // JSON array output
  startOffset: 40,      // Video clipping (seconds)
  endOffset: 120,
});

console.log(result.transcript);
console.log(result.usage);  // { promptTokens, outputTokens, totalTokens }
```

## Supported Models

| Model | Notes |
|-------|-------|
| `gemini-3-flash-preview` | Default. Next-gen, most token-efficient. |
| `gemini-2.5-pro` | Stable, most accurate. Best for long videos. |
| `gemini-3.1-pro-preview` | Most advanced preview. |
| `gemini-3.1-flash-lite-preview` | Cheapest and fastest. |

## Environment

Set `GEMINI_API_KEY` in your environment. Get a free key at https://aistudio.google.com/apikey.
