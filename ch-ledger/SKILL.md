---
name: ch-ledger
description: "Create and maintain the Client Hunter Ledger, a private Claude artifact page with its own database that stores the profile, hunting grounds, phrase weights, leads with drafts and statuses, the seen-set for dedupe, run records and open decisions; with a local JSON fallback for Claude Code and Cowork. Use whenever a Client Hunter stage needs to read or save memory, when the user asks to see their leads, mark a lead contacted, replied, won or lost, check due follow-ups, export or import the ledger, or set the ledger up."
---

# ch-ledger: the hunt's memory

Without memory, every hunt re-finds the same posts, re-vets the same scams and forgets what worked. The ledger is the single place where the profile, leads, decisions and learnings live, and the page the user opens on their phone to triage, copy drafts and mark progress.

## Where the ledger lives

1. **Artifact database** (Claude app, and anywhere an `Artifact` tool with `read_db` and `write_db` exists). The page source is `assets/ledger.html`; data paths and write patterns are in `references/ledger-api.md`.
2. **Local file fallback** (Claude Code or Cowork without the Artifact tool): `scripts/local_ledger.py`, storing `~/.client-hunter/ledger.json`. Its `export` command writes a file the page can import from its Data tab, so local hunts end up on the page.
3. **None**: say so in the report, and give the user the leads inline.

## Operations

**Find or create the page.** Call `Artifact` with action `list` and look for the title "Client Hunter Ledger". If found, use its URL for every `read_db`/`write_db` call. If not found and the user is setting up, copy `assets/ledger.html` to `/mnt/user-data/outputs/client-hunter-ledger.html` and publish it with:
- `title`: "Client Hunter Ledger", `favicon`: "🎯"
- `capabilities`: `{"db": {"rules": [{"path": "", "read": "owner", "write": "owner"}]}, "user": {}, "downloads": true}`
The page stays private to the user unless they share it; the owner-only rule keeps the data private even if the page is later shared.

**Read for a run** (`read_db`): `config/profile`, `config/grounds`, `config/phrases`, `config/learned_flags`, `gates` that are open or answered (answered cards are the user's picks: run them in `decisions` mode or at the start of the next run), and the seen-set (`seen` collection: one document per month, each with an `items` map of IDs). Leads: query by status or tier as needed; for dedupe read IDs only where possible (`out_dir` saves large results to files).

**Write after a run** (`write_db`, batches of up to 50):
- `leads/<id>` for every A, B and user-kept C lead: full lead record from the client-hunter contract (section 7). Use `set` for new leads; for existing ones use `update` and never overwrite user-entered `status`, `notes`, `follow_up_at` or `outcome_value`.
- `seen/<YYYY-MM>`: `update` with `{"items": {"<id>": "<verdict or block reason>", ...}}` for every candidate that is not stored as a lead (blocked, C, out of window). If the month document does not exist yet, `set` it first.
- `runs/<run id>`: the run record.
- `gates/<id>`: decision cards (contract section 9) with options, the recommended option and why. When a run executes an answered card, set `status: done` and `done_at`.
- `config/*`: only the stage that owns it writes it (profile: ch-profile; grounds and phrases: ch-scout and ch-retro; learned_flags: ch-retro).
Pin writes to documents you read with `if_version`; on a version conflict, re-read and merge rather than overwrite (the user may have just edited the lead on their phone).

**Status changes from chat.** When the user says "I messaged the Shenzhen guy" or "lead X replied", update `status`, append to `status_history`, and set `follow_up_at` (default 4 days after `contacted`) unless they set one.

**Follow-ups.** Leads with `status` contacted and `follow_up_at` today or earlier are due. Hand them to ch-draft for follow-up drafts.

**Housekeeping** (during retro, not every run): mark `new` leads older than 14 days as `expired`; keep the seen-set to the last 4 months; warn when the database nears its document cap (25,000).

## Rules

- Store excerpts (max 280 characters), never full post bodies or account histories.
- Never store contact details; `contact_hint` only.
- The user owns the data: export on request, delete on request (confirm before deleting anything).

## Running this stage on its own

Say "ch-ledger", "show my leads", "I messaged lead 3", "export my ledger" or "set up the ledger". Reads or updates the ledger directly; no run folder needed.

Next: due follow-ups go to ch-draft; after a run, ch-retro (light) updates yields.

Suite files: `../references/contract.md`.
