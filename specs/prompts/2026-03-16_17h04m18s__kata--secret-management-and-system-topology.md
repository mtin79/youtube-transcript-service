# Improvement Kata: Secret Management Analysis & System Topology

## Meta Information

- **Date**: 2026-03-16T17:04:18+01:00
- **Duration**: ~60 minutes
- **Complexity**: Moderate
- **Related Katas**:
  - `2026-03-16_14h31m49s__kata--install-youtube-transcript-skill.md`
  - `2026-03-16_15h26m07s__kata--youtube-transcript-service-monorepo.md`

## 1. Challenge (Direction)

Understand how API keys and secrets flow through the Claude ecosystem on this Mac — across Claude Code skills, MCP servers, Claude Desktop, and webapps — and evaluate whether the current plaintext approach should be improved with 1Password or Varlock.

## 2. Target Condition

- Clear understanding of where secrets are stored and exposed
- Comparison of plaintext vs `op read` vs Varlock approaches
- Documented limitations of each approach per Claude surface
- Actionable TODO list for future implementation
- System topology map documenting all Claude-related locations

## 3. Current Condition (Starting Point)

- Gemini API key hardcoded in `claude_desktop_config.json` (`env` block)
- Same key exported in `~/.zshrc` (line 145) alongside 3 other plaintext API keys
- MCP server pattern copied from icloud-mail (no secrets management)
- No understanding of whether `op read` works in all contexts
- No documentation of the full Claude ecosystem topology on this machine

## 4. Obstacles Encountered

1. **Obstacle**: `op read` fails inside Claude Code's Bash tool
   - **Impact**: Cannot use 1Password as a universal fallback in skill scripts when called by Claude Code
   - **Resolution**: Identified that `op read` requires interactive auth (Touch ID). Works in Claude Desktop (GUI can show prompt) and terminal, but not in Claude Code's non-interactive Bash subprocess. Cascading resolver pattern handles this gracefully.

2. **Obstacle**: Varlock can't wrap processes it doesn't control
   - **Impact**: MCP servers are spawned by Claude Desktop, skills by Claude Code — Varlock's `bunx varlock run --` wrapper is useless for both
   - **Resolution**: Documented that Varlock is only viable for webapp/CI where you control the launch. For AI agent surfaces, `op read` in the spawn command is the only option.

3. **Obstacle**: Incorrectly assumed the Gemini key was free-tier
   - **Impact**: Downplayed security concern
   - **Resolution**: Acknowledged that API key tier can't be determined from format (`AIzaSy...` is universal). Updated recommendations to not assume risk level.

## 5. PDCA Cycles (Implementation Journey)

### Cycle 1: How Does the MCP Server Get Its Key?

**Plan**: Trace the API key flow from config file to Gemini API call.

**Do**: Read `claude_desktop_config.json` — found key hardcoded in `env` block. Traced through MCP server code: `process.env.GEMINI_API_KEY` → `resolveApiKey()` → `fetch()` URL query parameter.

**Check**: Key is plaintext at rest (config file) and at runtime (`process.env`). Standard MCP pattern, but not best practice for valuable keys.

**Act**: Identified three alternatives: macOS Keychain, `op read`, Varlock.

### Cycle 2: Varlock Video Analysis

**Plan**: Transcribe YouTube video about Varlock to understand its approach.

**Do**: Transcribed `youtube.com/watch?v=nxH-BrsCPTo` using gemini-2.5-pro (149,760 prompt tokens, ~8 min video). First attempt with gemini-3-flash-preview timed out — Claude Code Bash tool's 2-minute default, not the code's fault.

**Check**: Varlock is a layer above 1Password — adds `.env.schema` with types, validation, and `@sensitive` decorators. Uses same `op://Vault/Item/Field` URI scheme. "AI-safe" means the schema file is safe to share, not that the runtime is safe.

**Act**: Varlock is ideal for webapps and CI/CD (you control the launch), but can't help with MCP servers or skills (spawned by Claude Desktop/Code).

### Cycle 3: `op read` Feasibility Test

**Plan**: Test whether `op read` works from Claude Code's Bash tool.

**Do**: Ran `op read 'op://Private/Gemini API Key/credential'` — failed with "authorization timeout".

**Check**: Confirmed the limitation: `op` CLI needs the 1Password desktop agent to present Touch ID or password prompt. Claude Code's Bash tool is non-interactive — no prompt possible.

**Act**: `op read` is viable for Claude Desktop MCP spawn (GUI app can trigger Touch ID) but unreliable as a fallback in skill scripts. Cascading resolver: env var first, `op read` second (works if session cached), error third.

### Cycle 4: System Topology Mapping

**Plan**: Map every location on this Mac that participates in the Claude ecosystem.

**Do**: Enumerated:
- `~/.claude/` — git-synced settings (skills, hooks, CLAUDE.md, settings.json)
- `~/.claude/skill-sources/anthropic/` — read-only upstream skills (16 skills)
- `~/.claude/skill-sources/mtin79/` — read-write custom skills (16 skills)
- `~/.claude/skills/` — 32 symlinks to skill-sources
- `~/.claude/plugins/` — installed plugins with config
- `~/Library/Application Support/Claude/claude_desktop_config.json` — MCP server registry
- `~/Development/ai/mcp-servers/` — deployed MCP servers (icloud-mail, youtube-transcript)
- `~/Development/Repositories/mtin79/youtube-transcript-service/` — monorepo source
- `~/.zshrc` lines 142-145 — 4 plaintext API key exports
- 10+ project `.claude/` dirs with CLAUDE.md
- 10+ project `.mcp.json` files

**Check**: Secrets exist in 3 locations: `.zshrc`, `claude_desktop_config.json`, and project `.mcp.json` files. None are encrypted.

**Act**: Created Obsidian article documenting the full topology and secret flow.

## 6. Key Decisions & Trade-offs

- **Decision**: Don't implement `op read` yet — document and defer
  - **Rationale**: User wants to review the analysis first and come back to implementation
  - **Trade-offs**: Keys remain plaintext until implemented

- **Decision**: Varlock is not suitable for MCP/skills surfaces
  - **Options**: Varlock for everything, `op read` for everything, hybrid
  - **Rationale**: Varlock requires wrapping the process launch (`bunx varlock run --`), which is impossible when Claude Desktop/Code controls the spawn
  - **Trade-offs**: No single tool covers all surfaces

- **Decision**: Accept dual-source-of-truth for skill script vs monorepo core
  - **Rationale**: Fork-and-reconcile pattern — same author, low change frequency, same underlying API
  - **Trade-offs**: Must manually sync changes between locations

## 7. Implementation Specification

### Files Created

| File | Location | Purpose |
|------|----------|---------|
| `Secret Management for AI Agents — The Unsolved Problem.md` | Obsidian `2 - Articles/` | Full analysis with threat model, comparisons, TODOs |
| This kata | Monorepo `specs/prompts/` | Process documentation |

### Files Modified

| File | Change |
|------|--------|
| Obsidian daily note `2026-03-16.md` | Added article references |
| Monorepo kata (iteration 2) | Added documentation/workflow analysis iteration |

## 8. Lessons Learned

- **What worked well**: Using the YouTube transcript skill to analyze the Varlock video — dogfooding the tool we just built to inform a security decision
- **What could improve**: Should have tested `op read` from Claude Code *before* recommending it as a skill fallback — would have discovered the non-interactive limitation earlier
- **Patterns discovered**:
  - "AI-safe" in secret management marketing means "the config file is safe to share," not "the runtime is protected from AI access" — important distinction
  - The principal-agent problem in AI tooling is fundamentally different from traditional secret management: the agent IS the authorized user
  - macOS Touch ID gating creates a natural boundary: interactive contexts (terminal, Desktop GUI) can use `op read`, non-interactive contexts (Claude Code Bash) cannot

## 9. Future Considerations

- **Next steps**: Implementation of `op read` for Claude Desktop MCP config (see TODO list in Obsidian article)
- **Alternative approaches**: A local proxy that injects API keys (agent never sees key, only proxy URL)
- **Scalability notes**: As more MCP servers and skills need API keys, a centralized resolver library could reduce per-project configuration

## 10. Reproducibility Notes

**Prerequisites**: 1Password CLI (`op`) installed and configured

**Validation**:
```bash
# Test op CLI is working
op account list
# Should show: my.1password.com, mtin79@icloud.com

# Test op read (interactive — will prompt Touch ID)
op read 'op://Private/Gemini API Key/credential'

# Verify current plaintext locations
grep GEMINI_API_KEY ~/.zshrc
grep -A2 GEMINI ~/Library/Application\ Support/Claude/claude_desktop_config.json
```
