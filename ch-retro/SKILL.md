---
name: ch-retro
description: "Learn from Client Hunter results: compute yield per hunting ground and phrase (swept, A and B leads, replies, wins), reweight phrases, retire dead grounds, harvest new buyer phrasings from real leads, turn confirmed scams into learned red flags, and report what is and is not working with concrete changes. Use at the end of every hunt (light mode), weekly, or when the user asks what's working, why leads are poor, or to tune the hunt."
---

# ch-retro: make the next hunt better than this one

A hunter that never learns keeps searching dead communities with the wrong words. Retro closes the loop between what the pipeline predicted (tiers) and what actually happened (the statuses the user set: contacted, replied, won, scam).

## Modes

- **Light** (end of every run, no questions): update yield counters for grounds and phrases used in this run, and add one or two lines to the report ("Best ground today: r/manufacturing, 2 A-leads from 18 posts").
- **Full** (weekly, or on request): everything below, then a short report with proposed changes. Changes to grounds and phrase weights apply automatically; changes to the profile or scoring rules are proposals the user approves.

## Inputs (via ch-ledger)

Runs since the last full retro, all leads with their status history, `config/grounds`, `config/phrases`, `config/learned_flags`, the profile.

## Full retro process

1. **Yield per ground and phrase**: swept, A, B, contacted, replied, won. Weight for ranking, smoothed so small samples don't swing wildly:
   `weight = (3*A + B + 4*replied + 8*won + 1) / (swept/10 + 2)`
   Store the counters and weight; ch-scout orders by weight next run.
2. **Retire and promote**: retire grounds with 4 validated runs and zero A or B (unless pinned); promote probation grounds with any A lead to active. Propose 1 to 3 new grounds to explore, based on where recent real asks came from (communities mentioned in A-lead threads, cross-posts).
3. **Harvest phrases**: from A and B lead titles and first lines, extract the buyer's own 2 to 4 word phrasings that are not yet in the phrase set (per language), and add them with weight 1.0. Drop phrases with 0 A or B after 60 swept posts.
4. **Learn red flags**: for each lead the user marked `scam`, write a learned flag describing the pattern (what was asked, the trick, cue phrases) to `config/learned_flags`. ch-vet applies these alongside its library. If the user skipped several leads for the same reason (notes), propose a new profile red line.
5. **Check calibration**: compare reply and win rates by tier. If B leads get replies as often as A, or A leads never get replies, say which factor seems off (for example "competition scores were high but threads were already crowded") and propose a scale change. Do not change scoring silently.
6. **Offer health**: for each offer line, leads found, replies, wins. Flag offers with no A leads in 3 runs and suggest sharper buyer keywords, a different ground type, or pausing the line.
7. **Report** in under 15 lines: what's working, what's not, changes applied, changes proposed (as one gate question with options), and housekeeping done.

## Rules

- Use only real statuses the user set; never infer "won" from silence.
- Small numbers are noisy: below 20 swept posts for a ground, describe it as "early signal".
- Learned flags must quote the scam's mechanics, not the poster's identity, so they generalize and don't become a blacklist of people.

## Running this stage on its own

Say "ch-retro", "what's working?" or "tune my hunt". Runs the full retro on everything in the ledger since the last full retro.

Next: the next hunt uses the new weights automatically.

Suite files: `../references/contract.md`.
