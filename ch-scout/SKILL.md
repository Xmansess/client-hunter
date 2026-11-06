---
name: ch-scout
description: "Decide where and how to hunt for clients: pick and validate hunting grounds (subreddits, forums, Telegram channels, tender boards, LinkedIn and X searches) for each offer and language, check each ground's rules on self-promotion and DMs, and build buyer-vocabulary phrase sets and exact search recipes. Use as the planning stage of a Client Hunter run, or when the user asks where their clients hang out, which communities to watch, or why a hunt found nothing. Part of the client-hunter suite."
---

# ch-scout: where do buyers ask, and in what words

Most hunts fail at this stage without anyone noticing: the searches run, return sellers and noise, and the user concludes "there's no demand". Scout's job is to point the sweep at places where buyers actually ask, in the words they actually use, and to know each place's rules before anyone drafts a reply there.

## Inputs

- Profile (`config/profile`): offers, kinds, keywords, languages, geo.
- Ledger memory: `config/grounds` (known grounds with yield stats and rules), `config/phrases` (weights), via ch-ledger.
- Capability map from the plan (which sources are reachable this run).

## Process

1. **Shortlist grounds per offer and language.** Start from known grounds sorted by yield, `(A + 0.5*B + 1) / (swept + 10)`. Fill gaps from `references/grounds-seed.md`. Keep about 20% of slots for exploration: an unvalidated seed or a newly discovered ground.
2. **Discover new grounds** (when an offer has fewer than 4 active grounds in a language, or every retro): search for the offer's buyer phrases across all of Reddit or the web, note which communities the real asks came from, and add the top 2 as probation grounds. Reading where real asks already appear beats guessing which communities "should" have buyers.
3. **Validate** any ground that is new or not validated for 30 days:
   - Activity: at least a few posts in the last 7 days.
   - Ask density: sample the newest 25 posts; count buyer asks versus sellers, promos and discussion. Under 1 ask per 25 posts means probation.
   - Rules: read the sidebar or rules page. Record `self_promo` (allowed, restricted to threads or flairs, banned), `dm` (ok, discouraged, banned), `hiring_format` (for example `[Hiring]` flair with pay required), and anything like "no market research".
   - Save the ground object (schema below) through ch-ledger.
4. **Build phrase sets** per offer and language from `references/phrase-bank.md`, the profile keywords, and harvested phrases from past A-leads (ch-retro writes these with weights). Order by weight, keep the top 6 to 10 per offer and language, plus 1 or 2 exploratory phrases.
5. **Write search recipes** using the exact query syntax of each reachable tool (see `references/phrase-bank.md`, section "Query recipes"). Include negative terms that remove sellers.
6. **Split the budget** across sources and grounds in proportion to expected yield, with the exploration share on top.

## Ground object

```json
{"id": "reddit:r/smallbusiness", "platform": "reddit", "name": "r/smallbusiness", "language": "en",
 "kinds": ["b2b"], "offers": ["sourcing", "websites"],
 "rules": {"self_promo": "banned", "dm": "ok", "hiring_format": null, "notes": "Q&A only; no market research posts"},
 "ask_density": 0.06, "status": "active | probation | retired",
 "yield": {"runs": 4, "swept": 160, "A": 2, "B": 5, "contacted": 3, "replied": 1, "won": 0},
 "last_validated": "2026-11-05"}
```

## Output (added to plan.md)

For each offer and language: grounds (with rules summary), phrase set, the exact queries per tool, budget, and the exploration picks. Also list grounds retired since last run and why.

## Rules

- A ground whose rules ban both self-promotion and DMs can still be hunted, but ch-draft will only produce a genuinely helpful public answer there, or nothing.
- Marketplaces with their own bidding systems (Upwork, Fiverr, fl.ru, kwork, Workana) are not swept automatically. The user can paste listings or invites into Client Hunter `check` mode, which vets and drafts for them.
- Retire a ground after 4 validated runs with zero A or B leads, unless the user pins it.

## Running this stage on its own

Say "ch-scout", "where do my clients ask?" or "find new communities for <offer>". Input: profile and grounds from the ledger. Output: a fresh `plan.md` in a new run folder, plus validated grounds saved to the ledger. Show the user the top grounds per offer with their rules.

Next: ch-sweep (autopilot and hunt continue automatically; on its own, offer to sweep now).

Suite files: `../references/contract.md`, `../references/environments.md`.
