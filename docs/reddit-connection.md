# Connecting Reddit

Client Hunter reads Reddit through two local MCP connectors when they exist, and falls back to a script (Claude Code) or web search when they don't. This is the exact setup on the author's Windows machine with Claude Desktop.

## Connector 1: "reddit-research" (included in this repo)

A small read-only server in `connectors/reddit-research-mcp/`: archive search through the public Arctic Shift API plus Reddit's official RSS feeds. No Reddit account or API keys. Tools: `archive_search_posts`, `archive_search_comments`, `archive_thread`, `archive_find_subreddits`, `rss_search`, `rss_browse`, `rss_post_comments`. This connector does most of Client Hunter's Reddit work: keyword search with scores and comment counts, live search, full threads, and author post history (a partial account check).

Install (Windows, needs Node.js):

```
cd %USERPROFILE%\.claude\skills\client-hunter\connectors\reddit-research-mcp
npm install
```

Claude Desktop config entry (Settings, Developer, Edit config):

```json
"reddit-research": {
  "command": "C:\\Program Files\\nodejs\\node.exe",
  "args": ["C:\\Users\\<you>\\.claude\\skills\\client-hunter\\connectors\\reddit-research-mcp\\server.mjs"]
}
```

Claude Code: `claude mcp add reddit-research -s user -- node "<full path>\server.mjs"`

## Connector 2: "reddit" (Reddit MCP Buddy)

Open-source server by karanb192, npm package `reddit-mcp-buddy`. Tools: `browse_subreddit`, `search_reddit`, `get_post_details`, `user_analysis`, `reddit_explain`. Read-only.

Install: `npm install -g reddit-mcp-buddy`, then in the Claude Desktop config:

```json
"reddit": {
  "command": "C:\\Program Files\\nodejs\\node.exe",
  "args": ["C:\\Users\\<you>\\AppData\\Roaming\\npm\\node_modules\\reddit-mcp-buddy\\dist\\cli.js"]
}
```

(or `"command": "npx", "args": ["-y", "reddit-mcp-buddy"]`). Claude Code: `claude mcp add --transport stdio reddit-mcp-buddy -s user -- npx -y reddit-mcp-buddy`.

Limit: without Reddit API credentials (the setup above has none), Reddit blocks logged-out JSON access, so only `browse_subreddit` (served from RSS, no scores) and `reddit_explain` work. Search, post details and `user_analysis` need credentials for an app Reddit has approved, added as environment variables (`REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`; see the package README). Client Hunter does not need them: it uses Connector 1 for search, threads and author history. Never commit credentials to this repo.

## Both connectors run on your computer

Claude Desktop starts them. They answer only while Claude Desktop is open and the computer is awake, including when you chat from your phone. If a call waits several minutes and fails, open Claude Desktop, approve any pending tool prompt, and try again. Cloud-scheduled runs cannot reach them; use a local scheduled run.

## Without connectors (Claude Code)

`ch-sweep/scripts/reddit_fetch.py` tries Reddit's public JSON, then RSS, then the Arctic Shift archive, and stops politely when blocked:

```
python ch-sweep/scripts/reddit_fetch.py new forhire --limit 100
python ch-sweep/scripts/reddit_fetch.py search "sourcing agent" --sub smallbusiness --t week
python ch-sweep/scripts/reddit_fetch.py user some_username
```

## How Client Hunter uses them

| Need | First choice | Fallback |
|---|---|---|
| New posts in a subreddit | `rss_browse` or `browse_subreddit` | script `new` |
| Keyword search with scores | `archive_search_posts` | script `search --sub` (Arctic Shift) |
| Freshest posts | `rss_search` | script `search` (RSS) |
| Full thread | `rss_post_comments` (fresh) or `archive_thread` | script `post` |
| Account history | `archive_search_posts` with `author` (posts, no karma or age) | `user_analysis` if you add credentials |
