#!/usr/bin/env python3
"""Local Client Hunter ledger (standard library only).

Stores everything in one JSON file (default ~/.client-hunter/ledger.json, or
$CLIENT_HUNTER_HOME/ledger.json) with atomic writes. The export format is the
same one the Client Hunter Ledger page imports from its Data tab.
"""
import json
import os
import sys
import tempfile
import time

USER_FIELDS = ("status", "status_history", "notes", "follow_up_at", "outcome_value")
OPEN = {"new", "shortlisted", "drafted"}


def _home():
    return os.environ.get("CLIENT_HUNTER_HOME") or os.path.join(os.path.expanduser("~"), ".client-hunter")


def _path():
    return os.path.join(_home(), "ledger.json")


def _now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _empty():
    return {"format": "client-hunter-ledger", "version": 1, "leads": {}, "runs": {}, "gates": {}, "config": {}, "seen": {}}


def load():
    try:
        with open(_path(), encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return _empty()


def save(data):
    os.makedirs(_home(), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=_home(), prefix=".ledger-", suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, _path())


def _stdin_json():
    raw = sys.stdin.read()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        sys.exit(f"Invalid JSON on stdin: {e}")


def cmd_init(_):
    if os.path.exists(_path()):
        print(f"Ledger already exists at {_path()}")
        return
    save(_empty())
    print(f"Created {_path()}")


def cmd_put(args):
    kind = args[0] if args else ""
    table = {"lead": "leads", "run": "runs", "gate": "gates"}.get(kind)
    if not table:
        sys.exit("usage: put lead|run|gate < record.json")
    rec = _stdin_json()
    if not rec.get("id"):
        sys.exit("record needs an id")
    data = load()
    old = data[table].get(rec["id"])
    if table == "leads" and old:
        merged = dict(old)
        merged.update(rec)
        for k in USER_FIELDS:  # never overwrite what the user set
            if k in old and old.get(k) not in (None, "", []):
                merged[k] = old[k]
        rec = merged
    rec["updated_at"] = _now()
    data[table][rec["id"]] = rec
    save(data)
    print(f"saved {kind} {rec['id']}")


def cmd_put_config(args):
    if not args:
        sys.exit("usage: put-config <name> < body.json")
    data = load()
    data["config"][args[0]] = _stdin_json()
    save(data)
    print(f"saved config {args[0]}")


def cmd_get_config(args):
    if not args:
        sys.exit("usage: get-config <name>")
    print(json.dumps(load()["config"].get(args[0]), ensure_ascii=False, indent=1))


def cmd_seen_add(args):
    if len(args) < 3:
        sys.exit("usage: seen-add <YYYY-MM> <id> <verdict>")
    data = load()
    data["seen"].setdefault(args[0], {"items": {}})["items"][args[1]] = args[2]
    save(data)


def cmd_seen_has(args):
    if not args:
        sys.exit("usage: seen-has <id>")
    data = load()
    if args[0] in data["leads"]:
        print("lead")
        return
    for month in data["seen"].values():
        if args[0] in month.get("items", {}):
            print(month["items"][args[0]])
            return
    sys.exit(1)


def cmd_list(args):
    status = tier = None
    for i, a in enumerate(args):
        if a == "--status" and i + 1 < len(args):
            status = set(args[i + 1].split(","))
        if a == "--tier" and i + 1 < len(args):
            tier = set(args[i + 1].split(","))
    for lead in sorted(load()["leads"].values(), key=lambda l: (l.get("tier", "C"), -(l.get("total") or 0))):
        if status and lead.get("status") not in status:
            continue
        if tier and lead.get("tier") not in tier:
            continue
        print(json.dumps({k: lead.get(k) for k in ("id", "tier", "total", "status", "title", "url", "follow_up_at")}, ensure_ascii=False))


def cmd_status(args):
    if len(args) < 2:
        sys.exit("usage: status <id> <new status>")
    data = load()
    lead = data["leads"].get(args[0])
    if not lead:
        sys.exit("no such lead")
    lead["status"] = args[1]
    lead.setdefault("status_history", []).append({"status": args[1], "at": _now()})
    if args[1] == "contacted" and not lead.get("follow_up_at"):
        lead["follow_up_at"] = time.strftime("%Y-%m-%d", time.gmtime(time.time() + 4 * 86400))
    lead["updated_at"] = _now()
    save(data)
    print(f"{args[0]} -> {args[1]}")


def cmd_due(_):
    today = time.strftime("%Y-%m-%d", time.gmtime())
    for lead in load()["leads"].values():
        if lead.get("status") in ("contacted", "replied") and lead.get("follow_up_at") and lead["follow_up_at"][:10] <= today:
            print(json.dumps({k: lead.get(k) for k in ("id", "title", "url", "status", "follow_up_at")}, ensure_ascii=False))


def cmd_export(_):
    data = load()
    out = {"format": "client-hunter-ledger", "version": 1, "exported_at": _now(),
           "leads": list(data["leads"].values()), "runs": list(data["runs"].values()),
           "gates": list(data["gates"].values()), "config": data["config"], "seen": data["seen"]}
    print(json.dumps(out, ensure_ascii=False, indent=1))


def cmd_import(_):
    inc = _stdin_json()
    if inc.get("format") != "client-hunter-ledger":
        sys.exit("not a Client Hunter export")
    data = load()
    for table in ("leads", "runs", "gates"):
        for rec in inc.get(table, []):
            if rec.get("id"):
                data[table][rec["id"]] = rec
    data["config"].update(inc.get("config", {}))
    for month, body in inc.get("seen", {}).items():
        data["seen"].setdefault(month, {"items": {}})["items"].update(body.get("items", {}))
    save(data)
    print("imported")


COMMANDS = {"init": cmd_init, "put": cmd_put, "put-config": cmd_put_config, "get-config": cmd_get_config,
            "seen-add": cmd_seen_add, "seen-has": cmd_seen_has, "list": cmd_list, "status": cmd_status,
            "due": cmd_due, "export": cmd_export, "import": cmd_import}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        sys.exit("commands: " + ", ".join(COMMANDS))
    COMMANDS[sys.argv[1]](sys.argv[2:])
