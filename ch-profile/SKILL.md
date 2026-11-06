---
name: ch-profile
description: "Build or update the Client Hunter profile: what the user sells (offer lines), to whom, prices and minimum budget, proof points, red lines, languages, outreach voice and channels. Use when Client Hunter runs for the first time, when the user says their services, rates, niche or target clients changed, wants to add or pause an offer, or asks how the hunter sees them. Part of the client-hunter suite; the profile drives every later stage."
---

# ch-profile: who are we hunting for

Every later stage depends on this profile: scout picks grounds from the offers, vet applies the red lines, qualify scores fit and budget against it, draft writes in this voice and cites only these proof points. A vague profile produces vague leads, so spend the effort here.

## Inputs

- Anything already known: the conversation, the user's memory or profile in this environment, a CV or portfolio they upload, and the existing profile in the ledger (`config/profile`, via ch-ledger).
- The user's answers at gate G1.

## Process

1. **Prefill.** Draft as much of the profile as the known context supports. Mark each prefilled field with where it came from, so the user can correct it.
2. **Interview, in at most 3 rounds of at most 3 tappable questions.** Only ask about gaps that change who gets found or how outreach sounds. Good questions:
   - Offer lines: "Which of these do you want clients for now?" (multi-select of prefilled lines, plus free text for new ones).
   - Minimum project size or rate per offer ("Under 100 USD", "100 to 500", "500 to 2,000", "2,000+").
   - Red lines (multi-select): crypto-only pay, commission-only, unpaid tests over 1 hour, equity-only, adult, gambling, political campaigns, MLM.
   - Where the user can work: remote only, travel possible, on-site in a named city.
   - Proof: "What can a draft truthfully mention?" (portfolio link, past results, years in a field). Never invent proof the user did not give.
   - Voice: "How should outreach sound?" (direct and short, warm and detailed, formal) and any banned words or punctuation.
3. **Structure each offer** with buyer vocabulary, not the user's jargon. For each offer write `keywords` per hunted language: the nouns and phrases a buyer would type ("sourcing agent", "find a manufacturer", "supplier in China"; "ищу поставщика"; "busco proveedor"). These seed ch-scout.
4. **Show the profile** as a short readable summary (not JSON), ask one confirm/adjust question, then save it through ch-ledger to `config/profile`. Keep the JSON in the run folder too.

## Profile schema

Read `references/profile-schema.md` for the exact fields and an example.

## Rules

- Do not store anything in the profile the user would not want in their own ledger; skip sensitive personal details (health, family, finances beyond their rates).
- The profile describes the user's real capabilities. If they want to stretch into adjacent work, record it as a separate offer with `stretch: true` so drafts stay honest ("I've done X; Y is adjacent").
- `languages.check_translations`: for each draft language the user reads less well, the language to translate drafts into for checking (for example `{"es": "hy"}`).
- When updating, change only what the user changed and bump `version`.

## Running this stage on its own

Say "ch-profile", "update my Client Hunter profile" or "add an offer: ...". Reads the current profile from the ledger, asks only about what changes, saves a new version.

Next: in autopilot or hunt, continue to ch-scout. On its own, suggest "Run a hunt with the new profile?"

Suite files: record formats are in `../references/contract.md` (the client-hunter folder's `references`).
