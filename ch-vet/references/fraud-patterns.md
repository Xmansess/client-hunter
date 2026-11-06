# Fraud, spam and fake-demand patterns

Each pattern: flag name, severity, what it looks like, and cue phrases (EN / RU / ES). Match by meaning, not only by exact words. Patterns marked (field) were observed in real Nov 2026 Reddit posts or reports during design.

## Contents
1. Critical (block on one)
2. Major (caution on one, block on two)
3. Exploitation (block if red-lined, else caution)
4. Quality (note only)
5. Seller disguised as buyer (block)
6. Unethical requests (block)
7. Positive signals (reduce caution)

## 1. Critical

| Flag | What it looks like | Cues |
|---|---|---|
| `block:scam_task` | Pay-per-task "jobs" (reviews, likes, product boosting, order grabbing) that later require a deposit to unlock tasks or withdraw. Often via Telegram or WhatsApp groups. (field) | "simple tasks", "daily payout", "boost sales", "VIP level", "recharge"; RU "задания", "пополнить баланс"; ES "tareas sencillas", "recarga" |
| `block:upfront_fee` | You pay first: training, starter kit, certification, equipment "reimbursed later", processing fee, membership. (field) | "registration fee", "buy the equipment from our vendor", "processing fee"; RU "оплатить обучение", "взнос"; ES "pago de inscripción", "cuota" |
| `block:overpayment` | Client sends more than the price (check, transfer) and asks you to forward the rest to a "consultant", "designer", "printer" or "content writer". Classic version: restaurant or event website where the content comes from a third party who must be paid by you. (field) | "my consultant has the content", "send the balance to", "I'll send a check" |
| `block:malware_test` | First step is to run their code or software: clone a private repo, `npm install`, open an archive or executable, install a time tracker or "our app", review a crypto or blockchain project locally. (field: repos with remote-access malware) | "review our GitHub repo", "run the project", "download the project files", "install our tracking software" |
| `block:credential_phish` | Asks you to sign in through their link, "Sign in with Google" on a staging admin panel, or send back generated usernames, passwords or 2FA codes. (field) | "sign in using your Google account and send me the username", "grant access", "share the code you received" |
| `block:account_rental` | Wants to use your identity or account: your Upwork, LinkedIn, GitHub or bank account, take calls as them, act as US/EU front for someone else, bypass location locks on AI-training work. (field) | "use your account", "we pay you to keep it active", "take client calls instead of me", "US only, we need your profile"; RU "аренда аккаунта"; ES "alquilar tu cuenta" |
| `block:id_harvest` | Passport, driver's license, SSN, bank login or card details requested before any contract, often "for payroll". (field) | "for payroll enrollment send your license", "verify identity with your bank login" |
| `block:money_mule` | Receiving and forwarding money or packages, "payment processing agent", reshipping. | "receive payments on behalf", "reship packages"; RU "принимать платежи"; ES "reenviar paquetes" |
| `block:crypto_investment` | "Job" turns into trading, mining or wallet top-ups with fake dashboards. (field) | "spot trading", "investment platform", "USDT wallet" |
| `block:impersonation` | Claims to be a known brand or recruiter (Amazon, Randstad, ACX) but uses free email, Telegram, or a lookalike domain. (field) | brand name + off-domain contact |
| `block:reported` | A credible public report names this account, company or domain as a scam. | found in r/Scams or a scam database |

## 2. Major

| Flag | What it looks like |
|---|---|
| `offplatform_pivot` | Insists on Telegram, WhatsApp or Signal immediately, or contact only there. (On Telegram grounds, judge the rest of the post instead, but "move to WhatsApp to get paid" is still major.) |
| `pay_too_good` | Pay far above market for trivial work (for example 30 to 600 USD per hour for data entry, "remote assistant"). (field) |
| `account_new` | Reddit account under 30 days old or with near-zero karma posting a paid job. See account-signals. |
| `vague_identity_high_pay` | No company, no product, no scope, attractive pay. |
| `urgency_pressure` | "Start today", "only today", "first 3 replies", pressure to skip contracts. |
| `refuses_escrow` | Rejects milestones, escrow or platform payment; wants work before any agreement. |
| `crypto_only_pay` | Payment only in crypto (block when the profile red-lines `crypto_only_pay`). |
| `spray_posting` | Same post in many subreddits within hours, or the same job reposted daily for weeks without hiring. (field: a Upwork client posting the same inflated jobs daily) |
| `mismatch` | Company name, website, email domain and story do not line up. |
| `community_warning` | Replies call it a scam, a mod warns, or the author dodges basic questions. |
| `invite_without_post` | Marketplace invite or DM from a brand-new client account with no payment verification asking to move elsewhere. (field) |

## 3. Exploitation

| Flag | What it looks like | Cues |
|---|---|---|
| `commission_only` | Paid only a percentage of sales or clients you bring. (field: "% of every client you bring") | RU "за процент", ES "por comisión" |
| `equity_only` | Equity, rev share or "future pay" for service work. | "co-founder", "partner" for a service job |
| `unpaid_test` | Free test longer than about an hour, or a test that is a real deliverable. | "free sample", "test task (unpaid)" |
| `below_minimum` | Stated budget below the profile minimum for that offer. | |
| `exploitative_volume` | Pay far below the volume asked (field: 600 USD per month for 8 long and 30 short videos). | |
| `exposure_pay` | "Great for your portfolio", "exposure". | |
| `unpaid_teamup` | "Looking for people to form a team" without pay. (field, ES "formar un equipo") | RU "ищу команду", ES "busco personas para formar" |
| `seller_recruitment` | "Hiring" sellers or affiliates on commission (supplements, courses, crypto). (field, ES "busco vendedores") | |

## 4. Quality

| Flag | What it looks like |
|---|---|
| `template_unfilled` | Placeholders left in: "[date]", "[one line, e.g. ...]", "{company}". (field) When the unfilled part is the poster's own company or product, also add the major flag `vague_identity_high_pay` if pay is attractive: a real founder knows their product's name. |
| `ai_boilerplate` | Generic text with no specific product, scope or constraint. |
| `duplicate_niche_swap` | Same author, same post, only the niche word changed. (field) |
| `no_budget` | No budget or range for a paid job (normal for recommendation asks; only a note). |

## 5. Seller disguised as buyer

Block as `block:seller_disguised` when the post's purpose is to find customers or do market research, not to buy:
- Questions to owners about their pains, tools or hiring triggers from someone in the same trade. (field: "what made you finally pay someone to build your website?" from a developer)
- "Business owners, is your X actually bringing you customers?" (field)
- "Free website, I just want a testimonial", "doing 3 free audits". (field)
- Account history shows the author sells the same service.
- Agency recruiting subcontractors at the user's own rate level is a `hiring_post`, not a disguised seller; judge it normally.

## 6. Unethical requests

`block:unethical`: locate or track a person (field, ES request to find a friend through "data tracking"), doxing, stalking, harassment, fake reviews or ratings, astroturfing, buying or selling accounts, bypassing bans or regional restrictions, academic cheating on graded work, surveillance of partners or employees without consent, anything illegal.

## 7. Positive signals

Reduce a single major flag to a note when two or more of these are clearly present:
- Specific scope, deliverables, constraints and timeline.
- Realistic budget or range for the work.
- Verifiable identity: company site, matching email domain, real product.
- Reddit account older than a year with normal activity in relevant communities.
- Engages with questions in the thread.
- Offers milestones, escrow, or a paid trial.
