#!/usr/bin/env python3
"""Gentle, read-only Reddit fetcher for Client Hunter (standard library only).

Used when no Reddit MCP tools are available (for example in Claude Code).
Tries Reddit's public JSON first; Reddit increasingly blocks logged-out JSON,
so it falls back to Reddit's official RSS feeds and to the Arctic Shift
archive API. Pauses between requests and stops cleanly on rate limits.
Output: one JSON object per line.

Commands:
  new <subreddit> [--limit N]
  search <query> [--sub SUBREDDIT] [--t hour|day|week|month] [--limit N]
  post <post_id>
  user <username>
  rules <subreddit>
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://www.reddit.com"
UA = "client-hunter/1.0 (personal read-only lead research; low volume)"
PAUSE_SECONDS = 2.0
_last_request = [0.0]


def _fetch(url, accept="application/json"):
    """Return the response body as text, or None if blocked or failing."""
    wait = PAUSE_SECONDS - (time.time() - _last_request[0])
    if wait > 0:
        time.sleep(wait)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    for attempt in (1, 2):
        try:
            _last_request[0] = time.time()
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt == 1:
                time.sleep(15)
                continue
            sys.stderr.write(f"note: HTTP {e.code} for {url}\n")
            return None
        except urllib.error.URLError as e:
            sys.stderr.write(f"note: network error for {url}: {e.reason}\n")
            return None
    return None


def _get(url):
    text = _fetch(url)
    if text is None:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


ATOM = "{http://www.w3.org/2005/Atom}"
ARCTIC = "https://arctic-shift.photon-reddit.com/api"


def _rss_records(url):
    """Parse a Reddit RSS/Atom feed into post records (no scores or comment counts)."""
    import html
    import re
    import xml.etree.ElementTree as ET
    text = _fetch(url, accept="application/atom+xml")
    if not text:
        return None
    try:
        root = ET.fromstring(text)
    except ET.ParseError:
        return None
    out = []
    for e in root.findall(ATOM + "entry"):
        link = e.find(ATOM + "link")
        href = link.get("href") if link is not None else ""
        m = re.search(r"/comments/([a-z0-9]+)/", href or "")
        sub = re.search(r"/r/([^/]+)/", href or "")
        author = e.find(ATOM + "author/" + ATOM + "name")
        content = e.find(ATOM + "content")
        body = re.sub(r"<[^>]+>", " ", html.unescape(content.text or "")) if content is not None else ""
        out.append({"id": f"reddit-{m.group(1)}" if m else None, "platform": "reddit", "url": href,
                    "community": f"r/{sub.group(1)}" if sub else None,
                    "author": (author.text or "").replace("/u/", "") if author is not None else None,
                    "title": (e.findtext(ATOM + "title") or "").strip(),
                    "body": " ".join(body.split())[:4000],
                    "posted_at": e.findtext(ATOM + "published") or e.findtext(ATOM + "updated"),
                    "comment_count": None, "score": None, "source": "rss"})
    return out


def _arctic_posts(params):
    data = _get(ARCTIC + "/posts/search?" + urllib.parse.urlencode(params))
    if not data:
        return None
    recs = []
    for d in data.get("data", []) or []:
        r = _post_record(d)
        r["source"] = "arctic-shift"
        recs.append(r)
    return recs


def _stop(msg):
    sys.stderr.write("STOP: " + msg + "\n")
    sys.exit(2)


def _iso(ts):
    if ts is None:
        return None
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(float(ts)))


def _post_record(d):
    return {
        "id": f"reddit-{d.get('id')}",
        "platform": "reddit",
        "url": BASE + d.get("permalink", ""),
        "community": "r/" + str(d.get("subreddit", "")),
        "author": d.get("author"),
        "title": d.get("title"),
        "body": d.get("selftext") or "",
        "posted_at": _iso(d.get("created_utc")),
        "comment_count": d.get("num_comments"),
        "score": d.get("score"),
        "flair": d.get("link_flair_text"),
        "removed": d.get("removed_by_category") is not None or d.get("selftext") in ("[removed]", "[deleted]"),
    }


def _emit(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")


def cmd_new(args):
    sub = urllib.parse.quote(args.subreddit)
    data = _get(f"{BASE}/r/{sub}/new.json?limit={min(args.limit, 100)}&raw_json=1")
    if data:
        for child in data.get("data", {}).get("children", []):
            _emit(_post_record(child.get("data", {})))
        return
    recs = _rss_records(f"{BASE}/r/{sub}/new/.rss?limit={min(args.limit, 100)}")
    if recs is None:
        _stop(f"r/{args.subreddit} is not reachable right now (JSON and RSS both blocked); skip it this run.")
    for r in recs:
        _emit(r)


def cmd_search(args):
    params = {"q": args.query, "sort": "new", "t": args.t, "limit": min(args.limit, 100), "raw_json": 1}
    if args.sub:
        params["restrict_sr"] = 1
        path = f"{BASE}/r/{urllib.parse.quote(args.sub)}/search"
    else:
        path = f"{BASE}/search"
    data = _get(path + ".json?" + urllib.parse.urlencode(params))
    if data:
        for child in data.get("data", {}).get("children", []):
            _emit(_post_record(child.get("data", {})))
        return
    if args.sub:
        days = {"hour": 1, "day": 1, "week": 7, "month": 31, "year": 365}.get(args.t, 7)
        after = time.strftime("%Y-%m-%d", time.gmtime(time.time() - days * 86400))
        recs = _arctic_posts({"subreddit": args.sub, "query": args.query, "after": after, "limit": min(args.limit, 100)})
        if recs:
            for r in recs:
                _emit(r)
            return
    rss_params = {k: v for k, v in params.items() if k != "raw_json"}
    recs = _rss_records(path + ".rss?" + urllib.parse.urlencode(rss_params))
    if recs is None:
        _stop("search is not reachable right now (JSON, archive and RSS failed); skip it this run.")
    for r in recs:
        _emit(r)


def cmd_post(args):
    data = _get(f"{BASE}/comments/{urllib.parse.quote(args.post_id)}.json?limit=200&raw_json=1")
    if not isinstance(data, list) or not data:
        recs = _rss_records(f"{BASE}/comments/{urllib.parse.quote(args.post_id)}/.rss")
        if not recs:
            _stop("post not reachable right now; skip it this run.")
        post, comments = recs[0], recs[1:]
        post["comments"] = [{"author": c["author"], "body": c["body"], "posted_at": c["posted_at"], "score": None, "depth": None} for c in comments]
        _emit(post)
        return
    post = data[0]["data"]["children"][0]["data"]
    rec = _post_record(post)
    comments = []

    def walk(children, depth=0):
        for c in children:
            if c.get("kind") != "t1":
                continue
            cd = c.get("data", {})
            comments.append({"author": cd.get("author"), "body": cd.get("body", ""),
                             "posted_at": _iso(cd.get("created_utc")), "score": cd.get("score"), "depth": depth})
            replies = cd.get("replies")
            if isinstance(replies, dict):
                walk(replies.get("data", {}).get("children", []), depth + 1)

    if len(data) > 1:
        walk(data[1].get("data", {}).get("children", []))
    rec["comments"] = comments
    _emit(rec)


def cmd_user(args):
    about = _get(f"{BASE}/user/{urllib.parse.quote(args.username)}/about.json")
    if not about:
        recs = _arctic_posts({"author": args.username, "limit": 50})
        if recs is None:
            _stop("account history not reachable right now; mark account.checked false.")
        subs = {}
        for r in recs:
            subs[r["community"]] = subs.get(r["community"], 0) + 1
        _emit({"username": args.username, "age_days": None, "link_karma": None, "comment_karma": None,
               "source": "arctic-shift (posts only)", "top_subreddits": sorted(subs.items(), key=lambda kv: -kv[1])[:10],
               "recent_posts": [{"title": r["title"], "community": r["community"], "posted_at": r["posted_at"]} for r in recs[:25]]})
        return
    d = (about or {}).get("data", {})
    created = d.get("created_utc")
    age_days = int((time.time() - float(created)) / 86400) if created else None
    subs = {}
    recent = _get(f"{BASE}/user/{urllib.parse.quote(args.username)}/submitted.json?limit=50&raw_json=1")
    titles = []
    for child in (recent or {}).get("data", {}).get("children", []):
        cd = child.get("data", {})
        subs[cd.get("subreddit")] = subs.get(cd.get("subreddit"), 0) + 1
        titles.append({"title": cd.get("title"), "community": "r/" + str(cd.get("subreddit")), "posted_at": _iso(cd.get("created_utc"))})
    _emit({"username": args.username, "age_days": age_days,
           "link_karma": d.get("link_karma"), "comment_karma": d.get("comment_karma"),
           "verified_email": d.get("has_verified_email"), "suspended": d.get("is_suspended", False),
           "top_subreddits": sorted(subs.items(), key=lambda kv: -kv[1])[:10], "recent_posts": titles[:25]})


def cmd_rules(args):
    data = _get(f"{BASE}/r/{urllib.parse.quote(args.subreddit)}/about/rules.json")
    if not data:
        _stop("rules not reachable without login; read the subreddit sidebar through another tool or the browser.")
    for r in (data or {}).get("rules", []):
        _emit({"community": "r/" + args.subreddit, "short_name": r.get("short_name"), "description": r.get("description")})


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("new"); a.add_argument("subreddit"); a.add_argument("--limit", type=int, default=50); a.set_defaults(fn=cmd_new)
    a = sub.add_parser("search"); a.add_argument("query"); a.add_argument("--sub"); a.add_argument("--t", default="week")
    a.add_argument("--limit", type=int, default=50); a.set_defaults(fn=cmd_search)
    a = sub.add_parser("post"); a.add_argument("post_id"); a.set_defaults(fn=cmd_post)
    a = sub.add_parser("user"); a.add_argument("username"); a.set_defaults(fn=cmd_user)
    a = sub.add_parser("rules"); a.add_argument("subreddit"); a.set_defaults(fn=cmd_rules)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
