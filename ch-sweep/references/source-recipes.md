# Source recipes

## Contents
1. Reddit via MCP tools
2. Reddit via script (Claude Code, Cowork with shell)
3. Forums and Q&A via web
4. Public Telegram channels
5. Hacker News threads
6. Tender boards
7. LinkedIn via browser
8. X via browser
9. Pasted items (check mode)

## 1. Reddit via MCP tools

- **Hiring boards** (r/forhire and similar): list `new`, 50 to 100 posts. Keep `[Hiring]` titles. The listing usually includes the body excerpt and the creation time.
- **Archive keyword search**: one call can cover several subreddits; 1 or 2 word query; `after: 7days`; `limit` 15 to 25 per subreddit. Results include score and comment counts but lag about 36 hours. If a subreddit returns HTTP 422, the tool may fall back automatically; otherwise list that subreddit's `new` posts instead.
- **Live search** (`rss_search`): supports `OR` and quotes, `sort: new`, `time: week`, optional `subreddit`. Slow and throttled; use it for the freshest posts on the best grounds.
- **Full post with replies**: for posts under a day old use the live post-comments tool; otherwise the archive thread tool (full tree with scores) or post-details tool.
- **Account history** belongs to ch-vet, not sweep.

## 2. Reddit via script

`scripts/reddit_fetch.py` (Python 3, standard library only) reads Reddit's public JSON endpoints with a descriptive User-Agent and a 2-second pause between requests. Commands:

```
python3 reddit_fetch.py new forhire --limit 100
python3 reddit_fetch.py search "sourcing agent" --sub smallbusiness --t week
python3 reddit_fetch.py post 1abc234
python3 reddit_fetch.py user example_user
python3 reddit_fetch.py rules smallbusiness
```

Output is JSON lines with normalized fields. On HTTP 429 or 403 it waits once, retries once, then exits with a clear message; respect that and move on. It cannot run in the Claude app (no outbound access to Reddit from that sandbox).

## 3. Forums and Q&A via web

1. Web search with an intent phrase plus offer noun, with negative terms (see ch-scout phrase bank), optionally `site:` a known forum.
2. Fetch each promising result page; read the actual post text, the posting date, and the number and content of replies.
3. Skip pages without a visible date, listicles, vendor blogs and directory pages.
4. In the Claude app, the fetch tool only opens URLs that appeared in search results or the user's message: search for a page before fetching it, never construct URLs by hand there.

## 4. Public Telegram channels

Public channels have a login-free web preview at `https://t.me/s/<channel>` showing recent posts with dates; each post links to `https://t.me/<channel>/<number>`. Discover channels by web search in the target language (for example "заказы фриланс телеграм канал дизайн", "ofertas freelance telegram canal"). Record the channel as a ground. Freelance order channels attract scammers: every Telegram candidate goes to vet with `platform: telegram`, and ch-vet applies its off-platform rules strictly.

## 5. Hacker News threads

Each month has "Ask HN: Who is hiring?" and "Ask HN: Freelancer? Seeking freelancer?". Find the current month's thread by web search, fetch it, and keep top-level comments that are SEEKING FREELANCER (for the second thread) or that mention contract or freelance roles.

## 6. Tender boards

Russian B2B and agency work often appears as tenders (b2b-center.ru, roseltorg, tender digests on ruward.ru or sostav.ru). Candidates are formal: record deadline, budget if shown, and requirements. Kind is `b2b`; outreach is via the tender process, so ch-draft prepares a short cover note and a checklist instead of a DM.

## 7. LinkedIn via browser

Only with a connected browser where the user is already logged in.
1. Navigate to the content search URL from the phrase bank with `sortBy` date and `datePosted` past week.
2. Read the page text; scroll up to 3 times; collect post text, author name and headline, relative time ("3d"), and the post URL (activity link) when visible.
3. Convert relative time to a date. Posts reshared by others: use the original post date.
4. Pause a few seconds between loads; at most 12 loads per run. Stop on any checkpoint, captcha or "unusual activity" notice.

## 8. X via browser

1. Navigate to `https://x.com/search?q=<query>&src=typed_query&f=live`.
2. Read posts; collect text, handle, timestamp and status URL; scroll up to 3 times.
3. Same pacing and stop rules as LinkedIn.

## 9. Pasted items (check mode)

When the user pastes text, screenshots or links (marketplace jobs, DMs, client emails, invites), treat each as one candidate with `platform: pasted` or the real platform if known. Fetch a link only when the environment allows; otherwise work from the pasted text.
