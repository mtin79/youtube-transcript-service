# Option A: Claude Code Skill (Already Installed)

The YouTube transcript functionality is already available as a Claude Code skill at:

```
~/.claude/skills/youtube-transcript
```

This skill uses the `gemini-transcript.ts` script from `~/.claude/skill-sources/mtin79/skills/youtube-transcript/scripts/` and triggers automatically when users ask to transcribe, extract text from, or get captions for YouTube videos.

## Usage

In any Claude Code session, simply ask:

> "Transcribe this YouTube video: https://www.youtube.com/watch?v=..."

The skill handles URL parsing, Gemini API calls, and output formatting automatically.

## Source

The skill source lives in the `mtin79` skill-source submodule at `skill-sources/mtin79/skills/youtube-transcript/`.
