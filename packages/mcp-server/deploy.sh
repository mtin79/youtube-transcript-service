#!/bin/bash
# Deploy the MCP server to the local mcp-servers directory.
# Claude Desktop references this path in its config.
#
# Creates a mini-workspace with both core and mcp-server packages
# so that the workspace:* dependency resolves correctly.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONOREPO="$(cd "$SCRIPT_DIR/../.." && pwd)"
TARGET=~/Development/ai/mcp-servers/youtube-transcript

rm -rf "$TARGET"
mkdir -p "$TARGET/packages/core" "$TARGET/packages/mcp-server"

# Workspace root
cat > "$TARGET/package.json" << 'EOF'
{
  "name": "youtube-transcript-deploy",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"]
}
EOF

# Copy core package
cp "$MONOREPO/packages/core/"*.ts "$TARGET/packages/core/"
cp "$MONOREPO/packages/core/package.json" "$TARGET/packages/core/"

# Copy MCP server package
cp "$MONOREPO/packages/mcp-server/mcp-server.ts" "$TARGET/packages/mcp-server/"
cp "$MONOREPO/packages/mcp-server/package.json" "$TARGET/packages/mcp-server/"

# Install dependencies
cd "$TARGET" && bun install

echo ""
echo "Deployed to $TARGET"
echo ""
echo "Add to ~/Library/Application Support/Claude/claude_desktop_config.json:"
echo '  "youtube-transcript": {'
echo '    "command": "bun",'
echo "    \"args\": [\"$TARGET/packages/mcp-server/mcp-server.ts\"],"
echo '    "env": { "GEMINI_API_KEY": "YOUR_KEY_HERE" }'
echo '  }'
