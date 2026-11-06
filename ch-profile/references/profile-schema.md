# Profile schema

Stored at ledger `config/profile`. Example values are illustrative; replace them with the user's answers.

```json
{
  "version": 1,
  "updated_at": "2026-11-05T10:00:00Z",
  "person": {
    "name": "First name used to sign drafts",
    "based_in": "City, Country",
    "timezone": "Europe/Berlin",
    "work_mode": "remote | remote+travel | onsite:<city>",
    "languages_spoken": ["en", "ru", "hy", "es-working"]
  },
  "offers": [
    {
      "id": "sourcing",
      "name": "Product sourcing and supplier evaluation",
      "what": "Find and vet manufacturers, run supplier calls, compare quotes and features",
      "deliverables": ["shortlist of vetted suppliers", "comparison sheet", "call notes"],
      "for_whom": ["e-commerce brands launching a product", "hardware startups"],
      "not_for": ["on-site factory audits"],
      "price": {"currency": "USD", "min_project": 300, "typical": "fixed fee per sourcing round"},
      "proof": ["Compared and vetted hardware suppliers across EU and Asia"],
      "keywords": {
        "en": ["sourcing agent", "find a manufacturer", "supplier in China", "supplier vetting"],
        "ru": ["ищу поставщика", "найти производителя", "поиск поставщиков"],
        "es": ["busco proveedor", "fabricante", "agente de compras"]
      },
      "kinds": ["b2b"],
      "active": true,
      "stretch": false
    }
  ],
  "min_budget_usd": 200,
  "red_lines": ["crypto_only_pay", "commission_only", "unpaid_test_over_1h", "equity_only", "mlm"],
  "geo": {"prefer": ["EU", "US", "CIS"], "avoid": []},
  "languages": {"hunt": ["en", "ru", "es"], "draft": ["en", "ru", "es"], "check_translations": {"es": "hy"}},
  "style": {
    "tone": "direct, warm, specific, no hype",
    "length": "short",
    "banned": ["em dash", "I hope this finds you well", "synergy"],
    "signature": "First name",
    "disclose_vendor": true
  },
  "channels": {"public_reply": true, "dm": true, "email_if_listed": true},
  "account_checks": "always",
  "autonomy": "key_gates",
  "links": {"portfolio": null, "linkedin": null, "website": null}
}
```

Field notes:
- `offers[].keywords` are buyer words per language. Short phrases (1 to 3 words) work best with archive search.
- `offers[].kinds`: which of `b2b`, `b2c`, `job` this offer hunts.
- `red_lines` values must match flag names in ch-vet `references/fraud-patterns.md` where one exists; free-text red lines are matched by meaning.
- `languages.check_translations` maps a draft language to the language its checking translation should be in (example: Spanish drafts get an Armenian translation). Languages the user reads well need no entry.
- `style.banned` is enforced by ch-draft on every draft.
- `disclose_vendor: true` means public replies that mention the user's service say so plainly.
