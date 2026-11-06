---
name: client-hunter
description: "Find real paying clients and freelance work across Reddit, forums, Telegram channels, LinkedIn and X, with scam, spam and fake-demand filtering, then draft honest outreach. Use this whenever the user wants to find clients, leads, buyers, customers, gigs, freelance jobs or projects in any field (B2B, B2C or freelance); says \"Client Hunter\", \"hunt\", \"autopilot\", \"find me work\", \"who needs X\"; wants to run, schedule, continue, upgrade or review a client hunt; names a stage such as ch-vet, ch-scout or ch-draft; or pastes a job post, client message, DM or marketplace invite and asks whether it is legit or worth pursuing. Runs the whole pipeline on its own (profile, scout, sweep, vet, qualify, draft, ledger, retro) or any single stage on request."
---

# Client Hunter (orchestrator)

Client Hunter is a pipeline of specialist stages that work like a small sales team:

```
ch-profile -> ch-scout -> ch-sweep -> ch-vet -> ch-qualify -> ch-draft -> ch-ledger -> ch-retro
  (who)       (where)     (collect)   (trust)    (worth it)    (reach)    (remember)   (learn)
```

This skill is the conductor. It can run the whole line by itself from zero (autopilot), run it with a few check-ins (hunt), or run any one stage on its own when the user asks. Each stage writes a file the next stage reads, so stages can be rerun independently ("re-vet these", "redraft lead 3").

## 1. Finding and loading a stage

The stages live inside this skill's own folder, one subfolder each: `ch-profile`, `ch-scout`, `ch-sweep`, `ch-vet`, `ch-qualify`, `ch-draft`, `ch-ledger`, `ch-retro`. To run a stage, read its instructions and follow them:

1. `./<stage>/SKILL.md` relative to this file (repo and Claude Code installs), or
2. `./<stage>/STAGE.md` relative to this file (single-file bundle used in the Claude app), or
3. a sibling skill folder named `<stage>` (`../<stage>/SKILL.md`, `/mnt/skills/user/<stage>/`, `~/.claude/skills/<stage>/`), or
4. the environment's Skill tool, if it can invoke skills by name.

Shared files are in `./references/`: `contract.md` (record formats every stage uses), `environments.md` (tool detection per surface), `scheduling.md`. Read a stage's instructions only when that stage starts.

If a stage cannot be found, name it, do that stage's minimum from `references/contract.md` section 11, and continue.

## 2. Modes

Pick the mode from the user's words. When in doubt between autopilot and hunt, use the user's saved `autonomy` setting from the profile.

| Mode | Say | What happens |
|---|---|---|
| `autopilot` | "Client Hunter", "autopilot", "run it" | From zero: setup if needed, then the main line (plan, sweep, vet, qualify, save, learn). It never stops midway and never takes a branching decision for you: it ends with a menu of next moves, one marked as recommended, ready to run with one tap. |
| `hunt` | "hunt", "Client Hunter, hunt" | Full pipeline that pauses at the key gates G2 to G4 (section 5), each with a recommended option. |
| `decisions` | "run my decisions", "do the recommended", taps an option | Runs the options the user picked (in chat or on the ledger page) and nothing else. |
| `stage` | "ch-vet this", "run scout", "/ch-draft lead 2" | Runs only the named stage, using the latest run files or the ledger as input, then suggests the next stage. |
| `check` | pastes a post, DM, email or invite | ch-vet, ch-qualify, ch-draft for that one item. Works without a profile. |
| `setup` | "set up Client Hunter", first use | ch-profile interview, then ch-ledger creates the ledger page. |
| `followup` | "follow-ups", "who should I chase" | ch-ledger finds due leads, ch-draft writes follow-ups. |
| `retro` | "what's working", "tune it" | ch-retro full mode. |
| `scheduled` | the prompt contains `mode: scheduled` | Like autopilot with no human present: never asks (section 6). |
| `schedule` | "schedule it", "every morning" | Read `references/scheduling.md`. |
| `upgrade` | "upgrade Client Hunter" | Section 8. |

Any mode except `check` and `upgrade` starts with `setup` if no profile exists.

## 3. Probe the environment first

Read `references/environments.md` and build the capability map (Reddit tools, browser, web, ledger, questions, filesystem). Plan only with sources this run can reach; list the rest under "skipped this run" with the reason, so partial coverage is never mistaken for a quiet market.

## 4. Autoplan

The user should never have to design searches.

1. **Load memory** via ch-ledger: profile, grounds with yields, phrase weights, learned red flags, open and newly answered gates, seen-set.
2. **Pick offers**: all active offer lines; more budget to higher value lines and recent winners. Flag lines with no A lead in 3 runs.
3. **Grounds and phrases**: run ch-scout. About 20% of budget goes to exploration.
4. **Budget**: 40 sweep calls and 25 vetting checks by default; freshness 7 days for Reddit, LinkedIn and X, 5 days for Telegram, 14 days for forums. "Quick" halves it, "deep" doubles it.
5. **Write** `plan.md` in the run folder (contract section 2).

Then run the main line in order: ch-sweep, ch-vet, ch-qualify, ch-ledger (save), ch-retro (light). Each stage's output file is the next stage's input. ch-draft runs when the user picks a drafting option (section 5), or directly in `check`, `followup` and `stage` modes.

## 5. Decisions: options with a recommendation

The main line (autoplan, sweep, vet, qualify, save, light retro) always runs. Anything that branches is a decision, and decisions belong to the user: the pipeline lays out the options, marks one as recommended with a one-line reason, and lets the user run it. It never picks a branch silently, and in autopilot it never stops midway to ask.

**Decision points**

| ID | Decision | Typical options (recommended rule in brackets) |
|---|---|---|
| D1 | Profile (first run only) | The setup interview. The only blocking step, because nothing works without it. |
| D2 | Plan changes | Use the plan as is, go deeper, add the new grounds scout found, focus one offer [as is, unless the last 2 runs found no A leads: then deeper or new grounds] |
| D3 | What to draft | Draft the A leads, draft A and B, pick in the ledger, not now [A leads when there is at least one] |
| D4 | Lead questions from ch-qualify | Yes or no per question, for example "partner with an on-site QC firm?" [the answer that fits the profile; say why] |
| D5 | Follow-ups due | Draft follow-ups now, snooze 2 days [draft now] |
| D6 | Retro proposals | Retire a ground, add a red line, pause an offer [whatever the evidence supports most] |
| D7 | Coverage gaps | Rerun when Claude Desktop or Chrome is on, continue without that source [rerun when the skipped source holds most of the offer's buyers] |

**How decisions are shown**

- **Autopilot**: finish the main line first, then show the report, then a "Next moves" menu as the very last thing: at most 3 questions with the question tool, 2 to 4 options each, the recommended option first with "(recommended)" in its label, and one short line per question saying why. Remaining decisions are listed in the report and saved to the ledger's Decisions tab. Nothing in the menu runs until the user taps or types it.
- **Hunt**: show each decision where it arises (G2 plan before sweeping, G3 shortlist after qualifying, G4 after drafting), with the same recommended-first format.
- **Scheduled**: no questions; every decision becomes a decision card in the ledger (contract section 9) with options, the recommendation and its reason.
- **Without a question tool**: a numbered list, recommended first, each option followed by the exact words that run it (for example "say: Client Hunter, draft the A leads").

Every option must be runnable later by its words alone, so the user can come back hours later, on another device, and say it. When the user picks options (in chat or on the ledger page), switch to `decisions` mode and run exactly those.

Never ask what the profile, ledger or conversation already answers.

## 6. Scheduled mode (no human present)

Never ask. Use the profile and the last approved plan, run the main line, and save every decision as a decision card in the ledger with its options and recommendation. Do not draft and do not shortlist CAUTION leads unless the user already picked that option on the ledger page before this run (answered cards are honoured, then marked done). Nobody is ever contacted. Browser sources run only if a browser is connected right now. Finish with the report and a run record.

## 7. Hard rules (every stage)

- **Read-only outward.** Never post, comment, vote, DM, email, connect, follow, apply or click state-changing buttons. Drafts are text for the user to send. In a browser, only navigate and read.
- **No contact harvesting.** A contact the poster publicly offered for this request may be used in that one draft; the ledger stores only "contact listed in post".
- **Honest outreach.** No fake experience, scarcity, reviews or sockpuppets; disclose being a vendor when pitching in public.
- **Respect community rules.** If self-promotion or DMs are banned, obey.
- **Refuse harmful jobs.** Tracking or locating people, doxing, harassment, fake reviews, account farming or rental, bypassing restrictions, exam cheating, anything illegal: ch-vet blocks these as `block:unethical`.
- **Gentle on platforms.** Stay in budget, pace browser loads, stop on rate limits instead of looping.

## 8. Upgrade

- Claude Code or Cowork with a terminal: `cd` into the installed suite folder (usually `~/.claude/skills/client-hunter`), run `git pull`, then `python3 setup.py` (or `./setup`).
- Claude app: run the install prompt from the README again and save the new `client-hunter.skill`; it replaces the old one.
Data in the ledger is never touched by an upgrade.

## 9. Final report

Scannable on a phone:
1. One line: "Swept N posts across M grounds; X real asks; A: a, B: b."
2. Funnel: swept, new after dedupe, passed vet, blocked (top 3 reasons), A/B/C.
3. Leads, A then B: title with link, where and age, verdict, score, why, drafts or "draft on request".
4. Skipped sources and why; open decisions.
5. What the hunt learned (one or two lines).
6. Next moves: the decision menu from section 5, recommended option first.

Hand everything to ch-ledger so the page matches the report.
