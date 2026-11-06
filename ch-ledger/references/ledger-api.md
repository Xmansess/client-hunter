# Ledger data layout and calls

## Paths (document paths have an even number of segments)

| Path | Body |
|---|---|
| `config/profile` | profile (ch-profile schema) |
| `config/grounds` | `{"items": [ground objects], "updated_at": "..."}` |
| `config/phrases` | `{"items": [{"phrase": "looking for", "lang": "en", "offer": "sourcing", "weight": 1.4, "swept": 60, "A": 2, "B": 3}], "updated_at": "..."}` |
| `config/learned_flags` | `{"items": [{"flag": "learned:fake_restaurant_consultant", "pattern": "...", "source_lead": "reddit-...", "added_at": "..."}]}` |
| `leads/<id>` | lead record (client-hunter contract section 7) |
| `seen/<YYYY-MM>` | `{"items": {"reddit-1abc": "block:seller_disguised", "reddit-1abd": "C"}}` |
| `runs/<run id>` | run record |
| `gates/<id>` | gate record |

Document bodies are JSON objects up to 256 KiB. The page reads `leads` ordered by `found_at`, `gates` where `status == "open"`, `runs` ordered by `started_at`, and the three `config` documents above. Keep those fields present.

## Artifact tool calls (Claude app)

Find the page:
```
Artifact action=list            -> find title "Client Hunter Ledger", keep its url
```

Read:
```
Artifact action=read_db url=<ledger> db_op=get   collection=config doc_id=profile
Artifact action=read_db url=<ledger> db_op=query collection=leads query={"where": [["status", "in", ["new","shortlisted","drafted","contacted","replied"]]], "limit": 500}
Artifact action=read_db url=<ledger> db_op=list  collection=seen out_dir=/home/claude/ch-seen
```

Write a batch (max 50 per call, atomic):
```
Artifact action=write_db url=<ledger> db_op=batch writes=[
  {"op": "set", "collection": "leads", "doc_id": "reddit-1abc234", "data": {...}},
  {"op": "update", "collection": "seen", "doc_id": "2026-11", "data": {"items": {"reddit-1xo2hz9": "block:exploitative_volume"}}, "if_version": 7},
  {"op": "set", "collection": "runs", "doc_id": "20261105-1015-hunt", "data": {...}}
]
```

Large documents can be written from a file with `file_path` instead of `data`. Pin with `if_version` whenever you read the document first; on conflict, re-read, merge, retry once.

## Local fallback (Claude Code, Cowork)

```
python3 local_ledger.py init
python3 local_ledger.py put lead < lead.json         # set or merge a lead (keeps user fields)
python3 local_ledger.py put run < run.json
python3 local_ledger.py put gate < gate.json
python3 local_ledger.py put-config profile < profile.json
python3 local_ledger.py seen-add 2026-11 reddit-1abc "block:seller_disguised"
python3 local_ledger.py seen-has reddit-1abc         # prints the stored verdict or nothing, exit 1 if unseen
python3 local_ledger.py get-config profile
python3 local_ledger.py list --status new,shortlisted --tier A,B
python3 local_ledger.py status reddit-1abc contacted
python3 local_ledger.py due                          # follow-ups due today
python3 local_ledger.py export > export.json         # import this file on the ledger page (Data tab)
python3 local_ledger.py import < export.json         # bring page exports into the local ledger
```

Default location `~/.client-hunter/ledger.json`; override with `CLIENT_HUNTER_HOME`.
