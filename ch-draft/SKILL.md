---
name: ch-draft
description: "Write honest, specific outreach for qualified Client Hunter leads: a helpful public reply, a short DM, an email when the poster publicly listed one, a tender cover note, or a follow-up, in the post's language (English, Russian, Spanish) with a translation for checking, in the user's voice and within each community's rules. Never sends anything. Use in the draft stage of a Client Hunter run, or when the user asks to reply to a post, pitch a lead, answer a client request, or write a follow-up to a lead."
---

# ch-draft: be the most useful reply in the thread

In the Nov 2026 test thread (a request for a Shenzhen sourcing agent), three of seven replies were vendors saying "DM me". The replies worth reading asked about volume, target unit price and whether the agent takes factory commission. That is the bar: a draft earns attention by being the most useful thing the person reads, then makes the next step easy.

## Inputs

- The leads the user chose to draft (decision D3, a tapped option, or leads named directly), with `why`, `angle`, `channels` and any answers to `questions_for_user`. Do not draft leads the user has not chosen.
- Full post and replies from the run folder (to avoid repeating what others said).
- Profile: offer details, proof points, style (tone, length, banned words or punctuation, signature), `languages.check_translations`.
- Channel templates and examples: `references/channel-playbook.md`.
- If the user has their own outreach or email-voice skills installed (for example an email drafter or a writing-cleanup skill), read and follow them as well; they encode the user's voice better than defaults.

## Process (per lead)

1. **Pick channels** from `channels`: draft every allowed one the user selected in the profile (public reply, DM, email). Tenders get a cover note and requirement checklist instead.
2. **Find the useful core first**: answer the question asked, add 1 to 3 points a real expert would raise that nobody in the thread has, or ask the 2 or 3 questions that decide the job. This core must stand on its own even if the offer were deleted.
3. **Place the offer honestly**: once, plainly, with the reason it fits this request, and with any gap stated ("I'm remote, so for factory visits I'd pair with a local QC firm"). In public replies say you provide this service when you mention it. Only cite proof points that exist in the profile.
4. **Make the next step small**: a question to answer, a 15-minute call, or a scoped first step with a price range when the profile gives one.
5. **Language**: write in the post's language. If the profile's `languages.check_translations` maps that language to another one (for example Spanish to Armenian), add a faithful translation into it under the draft, labelled as a translation that is not to be sent.
6. **Self-check before showing** (fix, don't just flag):
   - Would this reply still be helpful with the pitch removed?
   - Does it reference a specific detail from the post?
   - Does it obey the ground's rules (no links or no promotion where banned)?
   - Is every claim true per the profile?
   - Is it within the length limit for the channel?
   - No banned words or punctuation from `style.banned` (check character by character for banned punctuation such as the em dash).
   - No filler openers ("I came across your post", "Hope you're well", "I'd love to help").
7. **Write** `drafts.md` (human-readable, grouped by lead) and attach drafts to each lead record for the ledger.

## Follow-ups

When ch-ledger reports a contacted lead with no reply after the profile's follow-up delay (default 4 days): draft one short follow-up that adds something new (a relevant fact, a quick idea, an answer to a question they raised). Never more than two follow-ups per lead; never guilt or fake urgency.

## Rules

- Draft only. Never post, send, DM, email or create scheduled sends. If an email connector exists, offer to save an email as a draft in it only after the user has seen the full text in chat and explicitly confirmed.
- No fake familiarity, fake scarcity, fake reviews, or pretending to be a neutral recommender when pitching.
- Do not draft for blocked leads, and do not draft DMs where the community bans unsolicited DMs unless the poster asked for DMs.

## Running this stage on its own

Say "ch-draft lead 2", "reply to this post", "redraft shorter" or "draft follow-ups". Input: chosen leads from the newest `qualified.jsonl` or the ledger, or a pasted post. Output: drafts in chat and on the lead in the ledger.

Next: ch-ledger saves them; after the user sends and gets answers, ch-retro learns.

Suite files: `../references/contract.md`.
