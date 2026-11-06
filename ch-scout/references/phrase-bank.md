# Phrase bank and query recipes

Buyers rarely use the textbook phrase. A real Nov 2026 ask read "Looking for a reliable sourcing agent in Shenzhen", with no "recommendations" anywhere. Combine intent phrases with the offer's buyer nouns, and keep harvesting new phrasings from real A-leads.

## Contents
1. Intent stages
2. Intent phrases by language
3. Negative terms (remove sellers and noise)
4. Query recipes per tool

## 1. Intent stages

| Stage | Meaning | Example |
|---|---|---|
| 3 hire | wants a provider now | "looking for a sourcing agent", "[Hiring] video editor $25-40 per video" |
| 2 evaluate | choosing how or whom | "how do I find a reliable manufacturer", "agency vs freelancer for X?" |
| 1 pain | describes a problem the offer solves, no ask yet | "Google business tools are a nightmare, spent thousands on my site" |
| 0 chatter | discussion, curiosity | "what tools do you use" from a non-buyer |

Hunt stage 3 first, stage 2 second. Stage 1 posts are only worth a helpful public answer, never a pitch.

## 2. Intent phrases by language

**English**
- hire: "looking for a", "looking for someone", "need someone to", "need a", "hiring", "[Hiring]", "want to hire", "who can build", "budget is", "willing to pay", "paid gig", "quote for"
- recommend: "can anyone recommend", "anyone recommend", "recommendations for", "who do you use for", "any good", "trustworthy", "reliable", "vetted", "referral for"
- evaluate: "how do I find a", "where can I find a", "how to choose a", "worth hiring", "alternatives to", "vs"
- pain: "struggling with", "nightmare", "can't figure out", "wasted money on", "previous developer/agency"

**Russian**
- hire: "ищу", "ищем", "нужен", "нужна", "нужно сделать", "требуется", "кто может сделать", "возьмется", "ищу подрядчика", "ищу исполнителя", "заказ", "бюджет", "оплата", "ТЗ"
- recommend: "посоветуйте", "порекомендуйте", "подскажите", "кто работал с", "надежного", "проверенного"
- evaluate: "где найти", "как найти", "как выбрать", "сколько стоит"
- pain: "не могу разобраться", "намучился", "слили бюджет", "прошлый подрядчик"

**Spanish**
- hire: "busco", "buscamos", "necesito", "necesitamos", "se busca", "contratar", "alguien que", "presupuesto", "pago", "cotización"
- recommend: "me recomiendan", "recomendaciones", "alguien conoce", "alguien recomienda", "de confianza", "confiable"
- evaluate: "dónde encontrar", "cómo encontrar", "cómo elegir", "cuánto cuesta"
- pain: "no sé cómo", "me estafaron", "perdí dinero", "el anterior desarrollador"

## 3. Negative terms (remove sellers and noise)

Apply as query exclusions where the tool supports them, and as post-filters always.

- EN: "[For Hire]", "for hire", "I will", "I offer", "my services", "DM me for", "free website", "portfolio:", "testers", "beta testers", "feedback on my", "rate my", "co-founder", "equity", "rev share", "commission only", "volunteer", "unpaid", "exposure"
- RU: "предлагаю услуги", "выполню", "сделаю за", "портфолио", "ищу работу", "резюме", "бесплатно", "за процент", "по бартеру", "партнерство"
- ES: "ofrezco", "mis servicios", "busco trabajo", "busco empleo", "portafolio", "testers", "formar un equipo", "sin pago", "por comisión", "socio"

A post hit by a negative term is not automatically dropped (a buyer might write "no free trials please"), but it moves to the vet stage with a `seller_disguised` or `unpaid` suspicion.

## 4. Query recipes per tool

**Reddit live search (supports OR and quotes):**
```
("looking for" OR "need someone" OR "recommend") ("sourcing agent" OR manufacturer OR supplier) -"for hire"
```
Use `sort: new`, `time: week`, optionally restrict to one subreddit. Each call is slow; prefer one rich query per ground over many thin ones.

**Reddit archive search (every word must match, no OR):** one or two words, several subreddits per call, `after: 7days`, then post-filter for intent:
```
query: "manufacturer"      subreddits: "smallbusiness,Entrepreneur,manufacturing,ecommerce"
query: "sourcing agent"    subreddits: "AmazonFBA,FulfillmentByAmazon,smallbusiness"
```

**Reddit listing:** for hiring boards, list `new` (50 to 100 posts) and keep only titles starting with `[Hiring]` or containing "hiring", then intent-filter.

**Web search (forums, Telegram previews, tender boards):**
```
"looking for a sourcing agent" -"I am a" -"we are a"
"ищу подрядчика" сайт OR разработка
"busco proveedor" fabricante
site:t.me/s "заказ" дизайн
```
Add a recency word or the current month and year when the engine supports it; always confirm the date on the fetched page.

**LinkedIn (browser):**
```
https://www.linkedin.com/search/results/content/?keywords=<url-encoded phrase>&sortBy=%22date_posted%22&datePosted=%22past-week%22
```
Use buyer phrases such as "looking for a vendor", "looking for an agency", "can anyone recommend a", "RFP".

**X (browser):**
```
https://x.com/search?q=<url-encoded query>&src=typed_query&f=live
```
Query example: `("looking for" OR "anyone recommend") (sourcing agent OR manufacturer) lang:en -filter:replies since:2026-10-29`. Replace the date with 7 days ago.
