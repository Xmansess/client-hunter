---
name: ch-vet
description: "Vet a job post, client request, DM, email or marketplace invite for scams, fraud, spam, exploitation and fake demand before anyone spends time on it. Detects task scams, overpayment tricks, malware \"review our repo\" tests, credential phishing, account rental, upfront fees, commission-only and unpaid-test traps, unfilled template posts, ghost jobs, and sellers disguised as buyers; checks the poster's Reddit account history and any public scam reports; returns pass, caution or block with evidence and a safety checklist. Use in every Client Hunter run, and on its own whenever the user asks \"is this legit?\", \"is this a scam?\", \"should I trust this client?\" or pastes any offer of work."
---

# ch-vet: is this real, and is it safe?

On freelance and community boards, sellers outnumber buyers and scams target exactly the people this tool serves. In a Nov 2026 sample of r/forhire, only 11 of 60 new posts were hiring posts, and several of those were unfilled templates, commission-only offers or duplicated posts. Vetting is the stage that makes the rest of the pipeline worth trusting.

## Inputs

- Candidates (`candidates.jsonl`) or a single pasted item.
- Profile red lines and minimum budget (`config/profile`), learned red flags (`config/learned_flags`) via ch-ledger.
- Pattern library: `references/fraud-patterns.md` (read it fully at the start of each run).
- Account signal thresholds: `references/account-signals.md`.

## Process (per candidate)

1. **What kind of post is it?** Classify `post_type`: `buyer_request`, `hiring_post`, `seller_disguised`, `discussion`, `promo`, `unclear`. A seller fishing for customers ("what made you finally hire a web developer?", "is your website bringing you customers?", "free website for a testimonial") is `seller_disguised` and is blocked, however well it matches the keywords. A discussion that shows a real pain in an offer's area passes with `post_type: discussion` so qualify can score it as low intent.
2. **Ethics check.** Block with `block:unethical` anything that asks to locate or track a person, dox, harass, post fake reviews, farm, rent or sell accounts, bypass regional or platform restrictions, do someone's exam or graded work, or anything illegal.
3. **Content patterns.** Walk the library in `references/fraud-patterns.md`. Every matched pattern becomes a flag with a short evidence quote (max 20 words). Apply its severity:
   - one **critical** flag: `block`
   - **major** flags: one means `caution`, two or more mean `block`
   - **exploitation** flags: `block` if the profile red-lines them, else `caution`
   - **quality** flags: note only, unless combined with a major flag
   Also apply the user's learned flags from past confirmed scams.
4. **Thread signals.** Read the replies: other users saying "scam", "fake", "reported", a mod note, or the author refusing to answer basic questions are major flags. Count competitor replies ("DM me", "sent you a message") and record them for qualify; they are not a risk signal by themselves.
5. **Account check** (profile `account_checks: always`): for Reddit authors, get the account history (archive search by `author`, or `user_analysis` when it has Reddit API credentials; see the client-hunter `references/environments.md`) and evaluate with `references/account-signals.md` (age, karma, activity pattern, the same job posted across many subreddits, repeated reposting without hiring, history of selling the same service, prior scam reports). If the tool is refused, missing or times out (retry at most once), set `account.checked: false`, lower confidence, and say so once in the report. An archive search by `author` is a partial substitute (post history without age or karma). For LinkedIn and X, read only what the post page already shows (name, headline, company); do not open extra profiles in bulk.
6. **Outside cross-check** for candidates that would otherwise pass with real value (skip for obvious blocks to save budget): search r/Scams and the web for the username, company name or domain plus "scam"; confirm a named company has a working website whose domain matches its contact email. Record what was checked even when nothing was found.
7. **Decide and explain.** Write the vet result from the client-hunter contract (section 4): verdict, post_type, flags, evidence, account summary, one-sentence reason, and a `safety_checklist` for pass and caution items (for example "Milestones or escrow only", "Open any code they send only in a throwaway VM", "Never log in through a link they send", "Refuse overpayment; never forward funds").
8. **Write** `vetted.jsonl`. Blocked items also go to the ledger's seen-set with their top block reason, so they are never re-vetted.

## Standalone use

When someone pastes a single offer and asks if it is legit, answer in this order: verdict in one line, the 2 to 4 strongest reasons with quotes, what a legitimate version of this request would look like, and the safety checklist. Be direct; hedging helps scammers. If evidence is thin, say "not enough to call it" and list the questions that would settle it.

## Rules

- Evidence over vibes: every flag needs a quote or a checked fact. Never label a real person a scammer from a hunch; use `caution` with the reason instead.
- Non-native English, typos or a new business are not red flags by themselves.
- Do not store account histories in the ledger; store the summary and verdict only.
- Never contact the poster to "test" them; vetting is read-only.

## Running this stage on its own

Say "ch-vet", "is this legit?", or paste any offer. Input: pasted items, or the newest `candidates.jsonl`. Output: verdicts with evidence (`vetted.jsonl` when vetting a batch).

Next: ch-qualify (for a pasted item, offer to score and draft it).

Suite files: `../references/contract.md`.
