# reddit-research-mcp

Local, read-only Reddit research MCP server for Client Hunter: Reddit's official RSS feeds plus the public Arctic Shift archive. No Reddit account, no API keys.

Install: `npm install` in this folder (Node.js 18+), then register `node server.mjs` (full path) as an MCP server in Claude Desktop or Claude Code. Details: `../../docs/reddit-connection.md`.

Be gentle: Reddit RSS is rate-limited (the server paces requests), and Arctic Shift is a free community archive.
