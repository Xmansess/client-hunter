# Client Hunter

A team of Claude skills that finds people who are actually asking for what you sell, throws out the scams, spam and disguised sellers, scores what's left, and drafts honest outreach. It runs the whole pipeline on its own, or any single stage when you call it. It never posts, sends or messages anything by itself.

```
ch-profile -> ch-scout -> ch-sweep -> ch-vet -> ch-qualify -> ch-draft -> ch-ledger -> ch-retro
  (who)       (where)     (collect)   (trust)    (worth it)    (reach)    (remember)   (learn)
```

`ch` stands for Client Hunter. The orchestrator skill `client-hunter` conducts; the eight `ch-*` stages are the specialists.

## Install with one prompt

**Claude Code** (paste into a session; Claude does the rest):

> Install Client Hunter: run `git clone --depth 1 https://github.com/Xmansess/client-hunter.git ~/.claude/skills/client-hunter && cd ~/.claude/skills/client-hunter && ./setup` (on Windows without Git Bash use `python setup.py`), then run `python3 ~/.claude/skills/client-hunter/setup.py --claude-md ~/.claude/CLAUDE.md` and tell me what was installed.

**Claude app and Cowork** (paste into a chat; you tap Save once):

> Install Client Hunter from https://github.com/Xmansess/client-hunter: download the repo (git clone, or the zip from codeload.github.com), run `python3 setup.py --bundle`, and present `dist/client-hunter.skill` so I can save it.

The Claude app cannot add skills to your account by itself, so it builds one file and shows a Save button. Requirements: Code execution and file creation turned on (Settings, Capabilities), and GitHub reachable from the code sandbox. Cowork uses the skills saved to your account. After saving, open a new chat and say "Client Hunter".

**Add to one project only** (Claude Code): `python3 ~/.claude/skills/client-hunter/setup.py --project`

**Upgrade**: Claude Code: `cd ~/.claude/skills/client-hunter && git pull && ./setup`. Claude app: paste the install prompt again and save the new file.

**Uninstall**: `python3 setup.py --uninstall` (your ledger is never touched).

## Run it

| You say | What happens |
|---|---|
| "Client Hunter" | Autopilot from zero: sets up once, then runs every stage and reports. |
| "Client Hunter, hunt" | Same pipeline, but pauses at key gates: plan, shortlist, drafts. |
| Paste a post, DM, email or invite | Vets it, scores it, drafts a reply. |
| "Client Hunter follow-ups" | Drafts follow-ups for leads that are due. |
| "Schedule my hunt" | Sets up a recurring run (Cowork scheduled tasks or the OS scheduler). |
| `/ch-profile` ... `/ch-retro` (Claude Code) or "ch-vet this", "run scout" (Claude app) | Runs one stage by itself on the latest run files or the ledger. |

## The stages

| Stage | Job |
|---|---|
| client-hunter | Conductor: picks the mode, checks which tools exist, plans the run, calls the stages, asks at gates, writes the report |
| ch-profile | Interviews you once: offers, prices, red lines, languages, voice |
| ch-scout | Finds where buyers ask, checks each community's rules, builds buyer phrases and exact searches |
| ch-sweep | Collects fresh posts from Reddit, forums, public Telegram channels, tender boards, LinkedIn and X; dedupes; checks real dates |
| ch-vet | Blocks scams, spam, exploitation, unethical requests and sellers disguised as buyers; checks posters' history |
| ch-qualify | Scores fit, intent, budget, freshness, competition, reach and value; tiers A, B, C |
| ch-draft | Writes the most useful reply in the thread, plus DMs, emails, cover notes and follow-ups (English, Russian, Spanish) |
| ch-ledger | Your private ledger page (Claude artifact with a database), or a local file in Claude Code |
| ch-retro | Learns which places and phrases bring replies and wins; turns confirmed scams into new red flags |

## Repo layout

```
SKILL.md              orchestrator (client-hunter)
references/           shared contract, environment detection, scheduling
ch-*/SKILL.md         the eight stages (bundled as STAGE.md for the Claude app)
connectors/           reddit-research-mcp, the local Reddit connector Client Hunter relies on
docs/                 reddit-connection.md: connecting Reddit step by step
setup, setup.py       installer and bundle builder (Python 3, standard library)
install-windows.ps1   one-shot Windows installer
```

## Connect

Reddit: see `docs/reddit-connection.md` (two connectors, what each can do, and the no-connector fallback). Keep Claude Desktop open, since those connectors run on your computer. LinkedIn and X: Claude in Chrome (read-only). Plus web search and fetch.

**Windows shortcut:** `powershell -ExecutionPolicy Bypass -File install-windows.ps1 -Repo https://github.com/Xmansess/client-hunter.git` installs for Claude Code and builds the Claude app file in one go.

## Safety rules built in

Read-only everywhere; no contact harvesting; honest outreach with vendor disclosure; respects community rules; refuses tracking people, fake reviews, account rental or bypassing restrictions; gentle pacing; stops on rate limits.

## Known limits

Coverage depends on the tools connected in each run (skipped sources are listed in every report). LinkedIn and X need a connected browser. Marketplaces with their own bidding (Upwork, Fiverr, fl.ru, kwork, Workana) are not swept; paste listings instead. Reddit archive search lags about 36 hours. The first few hunts are partly exploration.

MIT License.
