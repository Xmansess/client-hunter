---
name: ch-qualify
description: "Score vetted leads for a Client Hunter run on fit, buying intent, budget signal, freshness, competition in the thread, reachability under community rules, and deal value; assign tiers A, B or C with a one-line reason and the best angle; and raise questions the user must answer when a lead's fit depends on them. Use as the scoring stage of a Client Hunter run, or when the user asks which leads are worth their time or to rank a list of posts or jobs. Part of the client-hunter suite."
---

# ch-qualify: is it worth your time?

Vet answers "is it real and safe". Qualify answers "is it worth replying to, and how". Scoring is explicit so the user can disagree with a number instead of a vibe, and so ch-retro can learn which factors actually predict replies and wins.

## Inputs

- `vetted.jsonl` (blocked items are skipped).
- Profile: offers, minimum budgets, geo, work mode, channels.
- Ground rules from ch-scout (self-promo, DM rules) for reachability.
- Scales: `references/scoring.md` (read before scoring).

## Process (per lead)

1. **Match the offer.** Choose the single best offer line. If two fit, pick the higher value and mention the other in `angle`.
2. **Score each factor** with the scales in `references/scoring.md`: fit (0 to 3), intent (0 to 3), budget (0 to 2), fresh (0 to 2), competition (0 to 2), reach (0 to 1), value (0 to 2). Total out of 15.
3. **Tier.** A: total 11 or more, fit at least 2, intent at least 2, verdict pass. B: not A, total 8 or more. C: total under 8. A caution lead can never be A.
4. **Why and angle.** `why`: one sentence a busy person can read in 3 seconds, quoting the post's own key detail. `angle`: the specific way to be useful in this thread (for example "Ask about volume, target unit price and whether the agent takes factory commission; offer a paid supplier shortlist as a first step").
5. **Questions for the user.** When fit depends on something the profile does not say ("Can you do on-site visits in Shenzhen?", "Do you build Shopify themes?"), add it to `questions_for_user` and score fit as if the answer were "no" until the user answers (decision D4, with a recommended answer and the reason). That keeps the shortlist honest.
6. **Channels.** Decide allowed channels from ground rules, the post's own instructions ("DM me portfolios", "email me at ...", "comment below") and the profile: `public_reply` true or false, `dm` "invited", "allowed" or false, `email` true only when an address is publicly listed for this request.
7. **Write** `qualified.jsonl`, sorted A, B, C, then by total and freshness.

## Rules

- Score the post, not the platform: an excellent ask in a small community beats a vague one in a big community.
- Stretch offers (profile `stretch: true`) cap fit at 2.
- Never raise a score because the user would like more leads. An empty A-list with a clear reason is a useful result.

## Running this stage on its own

Say "ch-qualify", "rank these", or paste a list of posts. Input: the newest `vetted.jsonl`, or pasted items (vet them first if they have not been vetted). Output: `qualified.jsonl` and an A/B/C table with questions for the user.

Next: offer decision D3 (what to draft) with "Draft the A leads" recommended when there is at least one A lead; ch-draft runs only on the option the user picks.

Suite files: `../references/contract.md`.
