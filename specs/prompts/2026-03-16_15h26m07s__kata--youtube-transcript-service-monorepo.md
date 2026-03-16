# Improvement Kata: YouTube Transcript Service Monorepo

## Meta Information

- **Date**: 2026-03-16T15:26:07+01:00
- **Duration**: ~45 minutes
- **Complexity**: Complex
- **Related Kata**: `2026-03-16_14h31m49s__kata--install-youtube-transcript-skill.md` (skill installation, same day)

## 1. Challenge (Direction)

Make the YouTube transcript functionality (previously a Claude Code skill only) available across all Claude surfaces and as a standalone webapp. Create a Bun workspace monorepo with 3 distribution options sharing a core library.

## 2. Target Condition

- Monorepo at `~/Development/Repositories/mtin79/youtube-transcript-service/`
- `packages/core`: Reusable library extracted from the standalone script (17 tests passing)
- `packages/mcp-server`: MCP server deployed to `~/Development/ai/mcp-servers/youtube-transcript/` and registered in Claude Desktop config
- `packages/webapp`: React Router v7 app with Vercel preset, flat-routes, and transcript UI
- All pushed to `github.com/mtin79/youtube-transcript-service`

## 3. Current Condition (Starting Point)

- YouTube transcript skill already installed at `~/.claude/skills/youtube-transcript`
- Existing pattern to follow: `~/Development/ai/mcp-servers/icloud-mail/` (MCP server)
- Existing webapp template: `INIT.md` from arcafind project
- All logic in a single 280-line script (`gemini-transcript.ts`) with zero npm deps
- No monorepo infrastructure

## 4. Obstacles Encountered

1. **Obstacle**: `workspace:*` dependency fails outside monorepo context
   - **Impact**: MCP server deploy script couldn't `bun install` when just copying the mcp-server package alone
   - **Resolution**: Updated deploy script to create a mini-workspace at the deploy target with both `core` and `mcp-server` packages, preserving the workspace dependency resolution

2. **Obstacle**: Package version mismatches for webapp dependencies
   - **Impact**: `@vercel/react-router@^0.1.0`, `@react-router/remix-routes-option-adapter@^1.0.0`, and `react-router-devtools@^1.0.0` didn't exist
   - **Resolution**: Checked npm registry for actual versions: `@vercel/react-router@^1.2.0`, `@react-router/remix-routes-option-adapter@^7.12.0`, `react-router-devtools@^6.2.0`

3. **Obstacle**: macOS lacks `timeout` command
   - **Impact**: Couldn't use `timeout 5 bun mcp-server.ts` for testing
   - **Resolution**: Used a Bun child process script with `setTimeout` to test MCP server's JSON-RPC initialize response

4. **Obstacle**: `create-react-router@latest` failed to install deps in workspace context
   - **Impact**: Template was copied but `npm install` failed
   - **Resolution**: Template files were scaffolded correctly; ran `bun install` from workspace root after fixing version numbers

## 5. PDCA Cycles (Implementation Journey)

### Cycle 1: Repository + Workspace Root

**Plan**: Create GitHub repo, set up Bun workspace with root config files.

**Do**:
- `gh repo create mtin79/youtube-transcript-service --public --clone`
- Created root `package.json` with `"workspaces": ["packages/*"]`
- Created `tsconfig.json`, `.gitignore`, `.env.example`

**Check**: Repo cloned, workspace root files in place.

**Act**: Proceeded to core package extraction.

### Cycle 2: Core Library Extraction

**Plan**: Extract pure functions from `gemini-transcript.ts` into separate modules with types.

**Do**:
- `types.ts`: `TranscriptOptions`, `TranscriptResult`, `GeminiErrorDetail` interfaces
- `url-parser.ts`: `extractVideoId()`, `toCanonicalUrl()` — pure functions from lines 84-99
- `prompt-builder.ts`: `buildPrompt()`, `buildVideoPart()` — prompt construction from lines 127-181
- `response-parser.ts`: `cleanResponse()`, `resolveApiKey()` — output cleaning from lines 258-263
- `gemini-client.ts`: `transcribeVideo()` — main orchestrator, refactored from procedural script to async function returning `TranscriptResult`
- `index.ts`: barrel export
- `index.test.ts`: 17 tests covering URL parsing (6 tests), prompt building (6 tests), response parsing (3 tests), video part building (2 tests)

**Check**: `bun test` — 17 pass, 0 fail, 20 expect() calls in 11ms.

**Act**: Core library is solid. Key refactor: converted procedural script (process.exit, console.error) into library code (throw errors, return values).

### Cycle 3: MCP Server

**Plan**: Follow icloud-mail MCP server pattern with `McpServer` + `StdioServerTransport`.

**Do**:
- Created `mcp-server.ts` with two tools: `youtube_transcribe` and `youtube_list_models`
- Used zod schemas for input validation (matching icloud-mail pattern)
- Added MCP annotations (`readOnlyHint`, `idempotentHint`, etc.)
- Created `deploy.sh` that builds a mini-workspace at the deploy target
- Deployed to `~/Development/ai/mcp-servers/youtube-transcript/`
- Registered in `~/Library/Application Support/Claude/claude_desktop_config.json`

**Check**: MCP server responds to JSON-RPC initialize with correct capabilities. Deploy creates working workspace with 182 packages installed.

**Act**: Initial deploy.sh had to be rewritten — single-package copy can't resolve `workspace:*`. Mini-workspace pattern solves this cleanly.

### Cycle 4: React Router v7 Webapp

**Plan**: Scaffold with create-react-router, add Vercel preset, flat-routes, and transcript UI.

**Do**:
- `npx create-react-router@latest webapp --yes` (template copied, deps failed)
- Fixed package.json: added `@youtube-transcript/core`, `@vercel/react-router`, flat-routes deps
- Configured `react-router.config.ts` with `vercelPreset()`
- Added `react-router-devtools` to `vite.config.ts`
- Configured `app/routes.ts` with flat-routes adapter
- Created `app/routes/_index/_route.tsx`: URL input, options panel (language, model, timestamps, speakers, clipping), transcript display with copy button and token usage badge
- Created `app/routes/resources+/transcribe/_route.server.ts`: POST handler calling core `transcribeVideo()`
- Used `useFetcher` for async form submission (no page navigation)

**Check**: `react-router build` succeeds — client bundle (41 modules, 333KB total) and SSR bundle built in 687ms.

**Act**: Removed unused welcome component. Build clean.

## 6. Key Decisions & Trade-offs

- **Decision**: Bun workspace monorepo (not turborepo, not separate repos)
  - **Options**: Turborepo, Nx, separate repos, Bun workspaces
  - **Rationale**: Bun workspaces are lightweight, zero config, and consistent with CLAUDE.md preference for Bun
  - **Trade-offs**: No build caching (turborepo advantage), but with only 3 small packages this doesn't matter

- **Decision**: Mini-workspace deploy pattern for MCP server
  - **Options**: Bundle/inline core into MCP server, symlink to monorepo, mini-workspace copy
  - **Rationale**: Keeps packages separate and the deploy self-contained; mirrors the icloud-mail pattern of absolute-path references
  - **Trade-offs**: Duplicates core code at deploy target; must re-deploy after core changes

- **Decision**: No shadcn/ui for webapp (Tailwind-only)
  - **Options**: Full shadcn/ui setup, Tailwind-only, headless UI
  - **Rationale**: The UI is simple (one form, one output area) — shadcn/ui would be overengineering for the current scope
  - **Trade-offs**: Less polished components, but faster to build and fewer dependencies

- **Decision**: Server-side API route (`resources+/transcribe/_route.server.ts`) instead of client-side API call
  - **Options**: Client-side fetch to Gemini directly, server-side resource route
  - **Rationale**: Keeps API key server-side, follows React Router conventions, enables future auth/rate-limiting
  - **Trade-offs**: Requires SSR deployment (Vercel handles this)

## 7. Implementation Specification

### Files Created

| File | Purpose |
|------|---------|
| `package.json` | Bun workspace root |
| `tsconfig.json` | Base TypeScript config |
| `.gitignore` | Standard ignores + `.react-router/`, `build/` |
| `.env.example` | `GEMINI_API_KEY=` template |
| `README.md` | Project overview with API examples |
| `packages/core/types.ts` | TypeScript interfaces |
| `packages/core/url-parser.ts` | YouTube URL parsing |
| `packages/core/prompt-builder.ts` | Gemini prompt construction |
| `packages/core/gemini-client.ts` | Main `transcribeVideo()` function |
| `packages/core/response-parser.ts` | Response cleaning + API key resolution |
| `packages/core/index.ts` | Barrel export |
| `packages/core/index.test.ts` | 17 unit tests |
| `packages/mcp-server/mcp-server.ts` | MCP server with 2 tools |
| `packages/mcp-server/deploy.sh` | Deploy to local mcp-servers dir |
| `packages/webapp/app/routes/_index/_route.tsx` | Transcript UI |
| `packages/webapp/app/routes/resources+/transcribe/_route.server.ts` | Server-side API |
| `docs/option-a-skill.md` | Reference to existing Claude Code skill |

### External Files Modified

| File | Change |
|------|--------|
| `~/Library/Application Support/Claude/claude_desktop_config.json` | Added `youtube-transcript` MCP server entry |
| `~/Development/ai/mcp-servers/youtube-transcript/` | Created deploy target with mini-workspace |

## 8. Lessons Learned

- **What worked well**: Extracting a monolithic script into clean modules is straightforward when the original code already has clear sections (URL parsing, prompt building, API call, response parsing)
- **What could improve**: Should have checked npm registry versions upfront instead of guessing — wasted a failed `bun install` cycle
- **Patterns discovered**:
  - Bun workspace `workspace:*` dependencies are workspace-scoped — deploy targets need their own workspace root to resolve them
  - MCP `StdioServerTransport` uses newline-delimited JSON-RPC (not LSP Content-Length framing)
  - `create-react-router@latest` v7.13.1 now uses `@tailwindcss/vite` plugin (Tailwind v4), not the old PostCSS approach
  - React Router v7.12+ publishes `@react-router/remix-routes-option-adapter` with matching versions (7.12.x), not independent semver

## 9. Future Considerations

- **Next steps**: Deploy webapp to Vercel, test with real YouTube videos end-to-end
- **Alternative approaches**: Could add a batch transcription endpoint (Gemini supports up to 10 URLs per request)
- **Scalability notes**: The webapp could add user accounts, saved transcripts, and a queue system for long videos

## 10. Reproducibility Notes

**Prerequisites**:
- Bun installed
- `GEMINI_API_KEY` set in environment
- GitHub CLI (`gh`) authenticated

**Execution time**: ~5 minutes for full setup

**Validation**:
```bash
cd ~/Development/Repositories/mtin79/youtube-transcript-service

# Core tests
bun test packages/core/
# Expected: 17 pass, 0 fail

# MCP server responds
bun -e "
import { spawn } from 'child_process';
const proc = spawn('bun', ['packages/mcp-server/mcp-server.ts']);
const msg = JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'test',version:'1.0.0'}}});
proc.stdin.write(msg + '\n');
proc.stdout.on('data', d => { console.log(d.toString()); proc.kill(); });
"
# Expected: JSON with serverInfo.name = "youtube-transcript-mcp-server"

# MCP deployed
ls ~/Development/ai/mcp-servers/youtube-transcript/packages/mcp-server/
# Expected: mcp-server.ts, package.json

# Webapp builds
cd packages/webapp && npx --package=@react-router/dev react-router build
# Expected: client + server bundles built
```

---

## ITERATION 2: Documentation Completeness & Workflow Analysis (2026-03-16_15h49m35s)

### Problem Discovered / New Requirement

After initial implementation, three gaps were identified:

1. The kata file was saved to `~/.claude/specs/prompts/` (the Claude Code settings repo) but not to the monorepo's own `specs/prompts/` directory
2. The earlier skill-installation kata wasn't included in the monorepo for full project history
3. No analysis of the **update workflow** between the three distribution surfaces (skill, MCP, webapp) and the single-source-of-truth problem

### Root Cause Analysis

- The kata-documentation skill defaults to saving in the current working directory (`~/.claude/`), not the target project
- The plan specified a `specs/prompts/` directory in the monorepo but it wasn't created during initial implementation
- The skill script (`gemini-transcript.ts`) and the core library (`packages/core/`) are independent implementations of the same logic — no shared code path

### Correction Process / New Implementation

#### PDCA Cycle: Documentation Placement

**Plan**: Copy katas into monorepo, commit and push
**Do**:
- Created `specs/prompts/` in monorepo
- Copied both katas (skill installation + monorepo creation) into `specs/prompts/`
- Committed and pushed
**Check**: Both files present, git history clean
**Act**: Future katas for this project should be saved directly to the monorepo

#### PDCA Cycle: Workflow Analysis

**Plan**: Map the code flow between all three surfaces to identify the single-source-of-truth problem
**Do**: Used an Explore agent to trace imports and file relationships across all 5 locations:
- Skill script: standalone, zero imports from monorepo
- Core library: modular extraction of the same logic
- MCP server: imports `transcribeVideo` from `@youtube-transcript/core`
- Webapp: imports from `@youtube-transcript/core`
- Deployed MCP: byte-for-byte copy of monorepo (not symlinked)

**Check**: Confirmed two independent implementations exist. The skill and core library will drift apart over time.

**Act**: User chose "fork and reconcile" pattern — edit wherever convenient, manually sync when needed. Acceptable because:
- Same author for both
- Low change frequency
- Both call the same Gemini REST API, so divergence is bounded
- Build-step unification remains a future upgrade path

### Key Changes Made

| Change | Before | After |
|--------|--------|-------|
| Monorepo specs/prompts/ | Missing | Created with 2 kata files |
| Webapp .gitignore | Missing `.vercel/` | Added `.vercel/` exclusion |
| Workflow documentation | Undocumented | Fork-and-reconcile pattern documented |

### Files Modified

- `specs/prompts/` — created directory, added both katas
- `packages/webapp/.gitignore` — added `.vercel/` exclusion

### Lessons Learned from This Iteration

- **kata-documentation skill saves to CWD** — when working across repos, explicitly target the correct `specs/prompts/` path
- **Two sources of truth are acceptable** when change frequency is low and the author controls both — this is the "fork and reconcile" pattern common in distributed systems
- The skill's zero-dependency constraint (no `node_modules/`) is the real reason it can't consume the core library directly — Bun can resolve workspace deps but skills run from `~/.claude/skills/` with no install step

### Impact Assessment

Documentation is now co-located with the code it describes. The workflow analysis provides a clear mental model for future maintenance decisions.
