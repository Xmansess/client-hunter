# Client Hunter contract

Every ch-* skill reads and writes these shapes. Keep field names exact; the ledger page and the retro stage depend on them.

## Contents
1. IDs
2. Run folder and handoff files
3. Candidate record (sweep output)
4. Vet result (added by ch-vet)
5. Qualification (added by ch-qualify)
6. Drafts (added by ch-draft)
7. Lead record (what the ledger stores)
8. Statuses
9. Gate record
10. Run record
11. Minimum fallback per stage

## 1. IDs

`<platform>-<native id>`, lowercase, only letters, digits and `- _ . ~ : @ +`.

- Reddit post: `reddit-1abc234`
- X post: `x-1938518376588206494`
- LinkedIn post: `li-<activity number from the URL>`
- Telegram public channel post: `tg-<channel>-<post number>`
- Forum or other page: `web-<first 12 hex chars of sha1(canonical URL)>`; without a hash tool, use a short slug of host plus path, max 80 chars.

The ID is the dedupe key everywhere.

## 2. Run folder and handoff files

Run ID: `YYYYMMDD-HHMM-<mode>`. Folder: `./client-hunter-runs/<run id>/` in Claude Code or Cowork, `/home/claude/client-hunter-runs/<run id>/` in the Claude app. Without a filesystem, keep the same structures inline in context.

```
plan.md            orchestrator: capability map, offers, grounds, phrases, budget
candidates.jsonl   ch-sweep: one candidate per line
vetted.jsonl       ch-vet: candidate + vet
qualified.jsonl    ch-qualify: vetted + qualification (all tiers, blocked excluded)
drafts.md          ch-draft: human-readable drafts per lead
report.md          orchestrator: the final report
```

## 3. Candidate record

```json
{
  "id": "reddit-1abc234",
  "platform": "reddit",
  "url": "https://www.reddit.com/r/smallbusiness/comments/1abc234/",
  "community": "r/smallbusiness",
  "author": "example_user",
  "title": "Looking for a reliable sourcing agent in Shenzhen",
  "body": "full text as fetched (kept in the run folder only, never in the ledger)",
  "language": "en",
  "posted_at": "2026-11-04T14:05:00Z",
  "found_at": "2026-11-05T09:12:00Z",
  "comment_count": 7,
  "score": null,
  "matched": {"offer": "sourcing", "phrase": "looking for", "ground": "r/smallbusiness"},
  "kind_guess": "b2b"
}
```

`kind_guess`: `b2b` (a business buying a service or product), `b2c` (a person buying for themselves), `job` (an explicit hiring post or job listing). `score` stays null when the source gives none; never invent numbers.

## 4. Vet result

```json
"vet": {
  "verdict": "pass | caution | block",
  "post_type": "buyer_request | hiring_post | seller_disguised | discussion | promo | unclear",
  "flags": ["offplatform_pivot", "account_new"],
  "evidence": ["short quote or fact for each flag, max 20 words each"],
  "account": {"checked": true, "age_days": 1400, "karma": 5200, "notes": "regular in r/AmazonFBA"},
  "safety_checklist": ["Only accept milestone or escrow payment"],
  "reason": "one sentence"
}
```

Block reasons start with `block:` in `flags` (for example `block:scam_task`, `block:seller_disguised`, `block:unethical`). Flag vocabulary lives in ch-vet `references/fraud-patterns.md`.

## 5. Qualification

```json
"q": {
  "offer": "sourcing",
  "fit": 2, "intent": 3, "budget": 1, "fresh": 2, "competition": 1, "reach": 1, "value": 2,
  "total": 12,
  "tier": "A",
  "why": "Wants a long-term sourcing partner for a smart ring launch; 7 replies, 3 are 'DM me' agents.",
  "angle": "Lead with the commission-conflict question and a paid trial scope",
  "questions_for_user": ["Can you run supplier vetting remotely without visiting Shenzhen factories?"],
  "channels": {"public_reply": true, "dm": "invited", "email": false}
}
```

Scales and tier rules live in ch-qualify `references/scoring.md`.

## 6. Drafts

```json
"drafts": {
  "public_reply": {"lang": "en", "text": "...", "translation": null},
  "dm": {"lang": "en", "text": "...", "translation": null},
  "email": null
}
```

`translation` is filled when the profile's `languages.check_translations` maps the draft language to a checking language (for example a Spanish draft with an Armenian translation).

## 7. Lead record (ledger)

Stored at `leads/<id>`. Only A, B and user-kept C leads are stored as leads; everything else goes to the seen-set.

```json
{
  "id": "reddit-1abc234", "platform": "reddit", "url": "...", "community": "r/smallbusiness",
  "author": "example_user", "title": "...", "excerpt": "max 280 chars of the post",
  "language": "en", "kind": "b2b", "offer": "sourcing",
  "posted_at": "...", "found_at": "...", "updated_at": "...", "run_id": "...",
  "verdict": "pass", "flags": [], "safety_checklist": [],
  "scores": {"fit": 2, "intent": 3, "budget": 1, "fresh": 2, "competition": 1, "reach": 1, "value": 2},
  "total": 12, "tier": "A", "why": "...", "angle": "...",
  "questions_for_user": [], "channels": {"public_reply": true, "dm": "invited", "email": false},
  "contact_hint": "none | email listed in post | dm invited",
  "drafts": {}, "status": "new", "status_history": [{"status": "new", "at": "..."}],
  "follow_up_at": null, "notes": "", "outcome_value": null
}
```

## 8. Statuses

`new` -> `shortlisted` -> `drafted` -> `contacted` -> `replied` -> `won` or `lost`. Side exits: `skipped`, `scam` (user confirms fraud; ch-retro learns from it), `expired` (no action and older than 14 days).

Only the user moves a lead to `contacted` or later (from the ledger page or by saying so), because the suite never sends anything itself.

## 9. Decision card (gate record)

Stored at `gates/<run id>-<decision id>`. Written in scheduled runs, and in autopilot for decisions that did not fit in the chat menu.

```json
{"id": "20261106-0800-scheduled-D3", "run_id": "...", "gate": "D3", "status": "open",
 "question": "What should I draft from today's 3 A leads?",
 "options": [
   {"label": "Draft the 3 A leads", "command": "Client Hunter, draft the A leads from run 20261106-0800"},
   {"label": "Draft A and B leads", "command": "Client Hunter, draft A and B leads from run 20261106-0800"},
   {"label": "Not now", "command": "none"}
 ],
 "recommended": 0, "why": "All three are fresh, pass vetting and fit your sourcing offer.",
 "created_at": "...", "answer": null, "answered_at": null, "done_at": null}
```

`status`: `open` -> `answered` (user picked an option on the page or in chat) -> `done` (a later run executed it), or `dismissed`. Older cards may have `options` as plain strings; treat each string as both label and command.

## 10. Run record

Stored at `runs/<run id>`.

```json
{"id": "...", "mode": "hunt", "surface": "claude-app", "started_at": "...", "finished_at": "...",
 "funnel": {"swept": 180, "deduped": 151, "passed": 37, "caution": 9, "blocked": 105, "A": 3, "B": 6, "C": 28},
 "block_reasons": {"seller_disguised": 41, "block:commission_only": 9},
 "grounds": [{"ground": "r/smallbusiness", "swept": 40, "A": 1, "B": 2}],
 "phrases": [{"phrase": "looking for", "lang": "en", "swept": 60, "A": 2}],
 "skipped": [{"source": "linkedin", "reason": "no browser connected"}],
 "summary": "one line"}
```

## 11. Minimum fallback per stage

If a stage skill is missing, do at least this:
- profile: ask what they sell, to whom, minimum budget, languages.
- scout: use r/forhire [Hiring], r/smallbusiness, r/Entrepreneur and web search with "looking for" + offer noun.
- sweep: fetch, normalize to the candidate record, drop items older than the freshness window.
- vet: block any post with an off-platform pivot to Telegram/WhatsApp plus pay that is too good, any upfront fee, any request to run code or log in, and any vendor fishing for customers.
- qualify: fit and intent and freshness only; tier A if all three are high.
- draft: answer the question first, mention the offer once, honest, short.
- ledger: write `client-hunter-ledger.json` in the run folder.
