---
name: ch-sweep
description: "Collect fresh candidate posts for a Client Hunter run from Reddit, forums, public Telegram channels, tender boards, LinkedIn and X, using the scout's grounds and search recipes; dedupe against the ledger, enforce real post dates, fetch full text and replies, and normalize everything into candidate records. Use as the collection stage of a Client Hunter run or when the user asks to pull new posts from specific communities. Part of the client-hunter suite."
---

# ch-sweep: collect, date, dedupe

Sweep turns the scout's recipes into a clean list of candidates. It does not judge trust or value (that is vet and qualify); it makes sure every candidate is real, fresh, unseen, and complete enough to judge.

## Inputs

- `plan.md`: capability map, grounds, queries, budget, freshness windows, languages.
- Dedupe set: IDs from ledger `leads/` and `seen/` (via ch-ledger).
- Source mechanics: `references/source-recipes.md`. Read the section for each source you will use.

## Process

1. **Run the searches**, cheapest and freshest first: Reddit archive and listings, then live Reddit search for the top grounds, then web (forums, Telegram previews, tenders), then browser sources (LinkedIn, X) if a browser is connected. Issue independent calls together when the environment allows parallel tool calls. Count every call against the budget and stop a source when its share is spent.
2. **Normalize** each hit into the candidate record from the client-hunter contract (`../references/contract.md`, section 3; that is the `references` folder of the client-hunter suite). Give it the ID from the contract's ID rules.
3. **Pre-filter cheaply** (before spending calls on full text):
   - Drop IDs already in the dedupe set.
   - Drop posts whose real date is outside the freshness window. The date must come from the record or page, never from the query's time filter (search filters return old posts regularly).
   - Drop removed or deleted posts and posts outside the profile's hunt languages.
   - Drop titles that are plainly sellers (`[For Hire]`, "I will build", "my services") unless they also contain a buyer ask.
   - Keep items that show an intent phrase or a hiring tag, plus an offer noun or an offer-relevant topic. When unsure, keep it: vet is the real filter.
4. **Fetch full text and replies** for survivors: post body, reply count, and the replies themselves when cheap (needed later to judge competition and spot "this is a scam" warnings from other users). For posts under a day old prefer live fetch tools; archive tools may lag.
5. **Detect language**: Cyrillic script means `ru` unless clearly another Cyrillic language; Spanish markers (ñ, ¿, ¡, common words like "busco", "necesito", "para") mean `es`; otherwise `en` or the visible language.
6. **Write** `candidates.jsonl` and a per-ground, per-phrase count table (swept, kept) for the run record. Record every source that failed, was rate-limited or was skipped, with the reason.

## Rules

- Read-only everywhere. In a browser, navigate by URL and read; never click state-changing buttons, never type into post or message boxes.
- Never infer a post date from "found today". Unknown date means not fresh; exclude it and count it as `undated`.
- Keep full bodies in the run folder only. The ledger later stores a 280-character excerpt, so personal data in long posts does not pile up in the ledger.
- Do not collect contact details. If a post publicly lists an email for this request, set `contact_hint: "email listed in post"` and leave the address in the post.
- Stop a source on rate limits, login walls, checkpoints or repeated errors; report it, do not loop.

## Running this stage on its own

Say "ch-sweep" or "pull new posts from r/<name>". Input: the newest `plan.md` in the run folder; if none, the last approved plan saved in the ledger; if none, run ch-scout first. Output: `candidates.jsonl` and counts.

Next: ch-vet.

Suite files: `../references/contract.md`, `../references/environments.md`.
