# Environments and tool adapters

Client Hunter runs in the Claude app (chat), Cowork (including scheduled tasks) and Claude Code. Tool names differ per surface, so detect capabilities by what tools are present, never by assumption. Deferred tools may need loading first (for example with a tool search tool) before they can be called.

## Capability map (write this at the top of every plan)

```
surface: claude-app | cowork | claude-code | unknown
reddit: mcp-full | mcp-partial | script | none
browser: chrome-connected | chrome-not-connected | none
web: search+fetch | search-only | none
ledger: artifact-db | local-file | none
questions: tool | text-only | none (scheduled)
filesystem: yes | no
```

## Reddit

Prefer, in order:

1. **Reddit MCP tools** (names seen in practice; match by function, not exact name):
   - live search with Reddit syntax (OR, quotes), slow, no scores: `rss_search`
   - fast archive keyword search with scores and comment counts, about 36 h lag, needs subreddit list, every word must match: `archive_search_posts`
   - subreddit listing (new/hot): `browse_subreddit` or `rss_browse`
   - post with comments: `get_post_details`, `rss_post_comments` (fresh posts), `archive_thread` (older posts, full tree)
   - account history: archive search by `author` (post history, no age or karma); `user_analysis` only if Reddit MCP Buddy has approved Reddit API credentials (without them it fails, so do not spend a call on it)
   - comment search: `archive_search_comments` (use short date ranges)
2. **Script fallback** (Claude Code or Cowork with shell and open network): `ch-sweep/scripts/reddit_fetch.py`, which reads Reddit's public JSON and RSS endpoints at a gentle rate.
3. **Web search fallback**: `site:reddit.com/r/<sub> "<phrase>"` plus fetch; weakest freshness, verify dates on the page.

Setup details for each connector: `docs/reddit-connection.md` in the repo.

Known behaviour to plan around:
- The Reddit MCP servers may be local servers run by Claude Desktop (observed during testing). They answer only while the desktop app is open and the computer is awake, and some calls wait for an approval click in the desktop app. If a call times out, retry at most once, then mark Reddit as `none` for this run, use the web fallback, and tell the user why coverage was partial. Cloud-scheduled runs usually cannot reach local servers.
- Archive search fails on some subreddits (HTTP 422). Fall back to live search or listing for that subreddit only.
- Keyword archive search needs every word to match, so use 1 or 2 word queries and filter afterwards.
- Live search is throttled (roughly 1 request per 10 to 40 seconds); spend it on the freshest, highest-yield grounds.
- If `user_analysis` is refused by permissions, record `account.checked: false` and tell the user once per run that the Reddit connector's account-history tool needs to be allowed.

## Browser (LinkedIn, X, and pages that need a session)

Use Claude in Chrome tools only when a browser is connected (`list_connected_browsers` or the tab context call succeeds). Read-only protocol:
- Navigate by URL (search URLs are in ch-sweep `references/source-recipes.md`); never type into post, comment or message boxes.
- Read with page text or accessibility tree tools; scroll at most 3 times per search page.
- Pause a few seconds between page loads and cap at 12 page loads per platform per run.
- Never click like, comment, repost, connect, follow, message, apply or any button that changes state. If a login wall or checkpoint appears, stop that platform and report it.
- In scheduled cloud runs there is usually no connected browser; mark LinkedIn and X as skipped.

## Web

Use web search for forums, Q&A sites, public Telegram channel previews (`t.me/s/<channel>`) and tender boards, then fetch each candidate page to read the real text and date. Search snippets are not evidence; a candidate needs a fetched page or an API record.

## Ledger

- **artifact-db**: an `Artifact` tool with `read_db` and `write_db` exists. Find the ledger with `Artifact` action `list` and the title "Client Hunter Ledger". If none exists, ch-ledger creates it.
- **local-file**: no Artifact tool but a filesystem. Use `ch-ledger/scripts/local_ledger.py` (or plain JSON files) under `~/.client-hunter/`. The ledger page can import the export file later.
- **none**: keep results in the report only and say so.

## Questions

- Claude app: `ask_user_input_v0` (max 3 questions, 2 to 4 options each).
- Claude Code and Cowork: `AskUserQuestion` when present.
- Otherwise ask in one short plain-text message with numbered options.
- Scheduled: never ask; write gate records.

## Surface hints

- Claude app: container network is restricted, so scripts cannot reach Reddit; use MCP tools. Files go to `/home/claude/` and deliverables to `/mnt/user-data/outputs/`.
- Cowork scheduled tasks run with connectors and installed skills, usually in the cloud; anything needing local apps (Chrome) only runs when the computer is on.
- Claude Code: connectors from the Claude app are not automatically present; check for MCP tools, otherwise use the script fallback.
