#!/usr/bin/env node
// reddit-research-mcp — read-only, credential-free Reddit research server.
// Sources: (1) Reddit's official public RSS/Atom feeds (live, slow: Reddit throttles per IP)
//          (2) Arctic Shift archive API (https://arctic-shift.photon-reddit.com) — fast, third-party, ~36h score lag.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const UA = 'windows:reddit-research-mcp:v1.0.0 (personal non-commercial research)';
const log = (...a) => process.stderr.write('[reddit-research] ' + a.join(' ') + '\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- polite fetch with per-host pacing, retries and a 10-minute cache ----------
const cache = new Map(); const CACHE_TTL = 10 * 60 * 1000;
const hosts = {
  reddit: { minGap: 7000, last: 0, chain: Promise.resolve() },
  arctic: { minGap: 2500, last: 0, chain: Promise.resolve() },
};
function paced(hostKey, fn) {
  const h = hosts[hostKey];
  const run = h.chain.then(async () => {
    const wait = h.last + h.minGap - Date.now();
    if (wait > 0) await sleep(wait);
    try { return await fn(); } finally { h.last = Date.now(); }
  });
  h.chain = run.catch(() => {});
  return run;
}
async function getText(hostKey, url, { retries = 4 } = {}) {
  const c = cache.get(url);
  if (c && Date.now() - c.t < CACHE_TTL) return c.v;
  let lastErr; const deadline = Date.now() + 50000; // stay under Claude Desktop's tool-call timeout
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (Date.now() > deadline) break;
    const res = await paced(hostKey, () => fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(30000) }).catch(e => ({ ok: false, status: 0, _e: e })));
    if (res.ok) { const v = await res.text(); cache.set(url, { t: Date.now(), v }); return v; }
    lastErr = `HTTP ${res.status}${res._e ? ' ' + res._e.message : ''}`;
    if (res.status === 429 || res.status >= 500 || res.status === 0) {
      const ra = Number(res.headers?.get?.('retry-after') || res.headers?.get?.('x-ratelimit-reset') || 0);
      const backoff = Math.max(ra * 1000, (hostKey === 'reddit' ? 15000 : 3000) * (attempt + 1));
      log(`${hostKey} ${lastErr}, retry ${attempt + 1}/${retries} in ${Math.round(backoff / 1000)}s`);
      const room = deadline - Date.now() - 2000;
      if (room < 5000) break;
      await sleep(Math.min(backoff, room, 45000));
      continue;
    }
    let body = ''; try { body = (await res.text()).slice(0, 300); } catch {}
    if (res.status === 422 && /timeout|slow down/i.test(body) && attempt < 1) {
      const room = deadline - Date.now() - 2000; if (room < 5000) break;
      log(`${hostKey} 422 timeout, retry in 4s`); await sleep(Math.min(4000, room)); continue;
    }
    throw new Error(`${lastErr} for ${url}${body ? ' — ' + body : ''}`);
  }
  throw new Error(`${lastErr} — ${hostKey === 'reddit' ? 'Reddit is throttling its public RSS feed for this IP. Wait ~1 minute and retry, or use the archive_* tools (fast).' : 'Arctic Shift busy/rate-limited. Retry shortly or narrow the request (shorter date range, fewer subreddits).'}`);
}

// ---------- helpers ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1))) : (ENT[e] ?? m));
const stripHtml = h => decode(decode(h)
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<li>/gi, '\n- ')
  .replace(/<a [^>]*href="([^"]+)"[^>]*>\s*\[link\]\s*<\/a>/gi, '').replace(/<a [^>]*href="([^"]+)"[^>]*>\s*\[comments\]\s*<\/a>/gi, '')
  .replace(/<[^>]+>/g, '')).replace(/submitted by\s+\/u\/\S+\s*/i, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '');
const date = t => (t ? new Date(typeof t === 'number' ? t * 1000 : t).toISOString().slice(0, 10) : '?');
const sub = s => String(s || '').replace(/^\/?r\//i, '').trim();
function postIdFrom(input) {
  const s = String(input).trim();
  let m = s.match(/comments\/([a-z0-9]+)/i) || s.match(/redd\.it\/([a-z0-9]+)/i) || s.match(/^(?:t3_)?([a-z0-9]{4,10})$/i);
  return m ? m[1] : null;
}
function subFromUrl(input) { const m = String(input).match(/\/r\/([^/]+)\//i); return m ? m[1] : null; }

function parseAtom(xml) {
  const entries = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const g = re => { const x = e.match(re); return x ? x[1] : ''; };
    entries.push({
      id: g(/<id>([^<]+)<\/id>/),
      author: decode(g(/<author>\s*<name>([^<]+)<\/name>/)).replace(/^\/u\//, ''),
      title: decode(g(/<title>([\s\S]*?)<\/title>/)),
      link: decode(g(/<link href="([^"]+)"/)),
      sub: g(/<category term="([^"]+)"/),
      published: g(/<published>([^<]+)<\/published>/) || g(/<updated>([^<]+)<\/updated>/),
      text: stripHtml(g(/<content type="html">([\s\S]*?)<\/content>/)),
    });
  }
  return entries;
}

// ---------- official Reddit RSS tools ----------
async function rssSearch({ query, subreddit, sort = 'relevance', time = 'all', limit = 25, max_chars = 600 }) {
  if (!query) throw new Error('query is required');
  const s = sub(subreddit);
  const base = s ? `https://www.reddit.com/r/${encodeURIComponent(s)}/search.rss` : 'https://www.reddit.com/search.rss';
  const url = `${base}?q=${encodeURIComponent(query)}&sort=${sort}&t=${time}&limit=${Math.min(+limit || 25, 100)}${s ? '&restrict_sr=1' : ''}&type=link`;
  const items = parseAtom(await getText('reddit', url)).filter(e => e.id.startsWith('t3_'));
  if (!items.length) return `No results for "${query}"${s ? ' in r/' + s : ''}.`;
  return `[source: Reddit official RSS | ${items.length} posts | scores not available via RSS]\n\n` + items.map((e, i) =>
    `${i + 1}. ${e.title}\n   r/${e.sub} · u/${e.author} · ${date(e.published)} · id=${e.id.replace('t3_', '')}\n   ${e.link}\n   ${clip(e.text, max_chars).replace(/\n/g, '\n   ')}`).join('\n\n');
}
async function rssBrowse({ subreddit, sort = 'hot', time = 'week', limit = 25, max_chars = 400 }) {
  const s = sub(subreddit); if (!s) throw new Error('subreddit is required');
  const url = `https://www.reddit.com/r/${encodeURIComponent(s)}/${sort}.rss?limit=${Math.min(+limit || 25, 100)}${['top', 'controversial'].includes(sort) ? '&t=' + time : ''}`;
  const items = parseAtom(await getText('reddit', url));
  return `[source: Reddit official RSS | r/${s} ${sort}${['top', 'controversial'].includes(sort) ? ' ' + time : ''} | ${items.length} posts]\n\n` + items.map((e, i) =>
    `${i + 1}. ${e.title}\n   u/${e.author} · ${date(e.published)} · id=${e.id.replace('t3_', '')}\n   ${e.link}\n   ${clip(e.text, max_chars).replace(/\n/g, '\n   ')}`).join('\n\n');
}
async function rssComments({ post, subreddit, sort = 'top', limit = 200, max_chars = 1500 }) {
  const id = postIdFrom(post); if (!id) throw new Error('Provide a Reddit post URL or post id');
  const s = sub(subreddit) || subFromUrl(post);
  const url = s ? `https://www.reddit.com/r/${encodeURIComponent(s)}/comments/${id}/.rss?sort=${sort}&limit=${Math.min(+limit || 200, 500)}`
                : `https://www.reddit.com/comments/${id}/.rss?sort=${sort}&limit=${Math.min(+limit || 200, 500)}`;
  const items = parseAtom(await getText('reddit', url));
  const op = items.find(e => e.id.startsWith('t3_'));
  const comments = items.filter(e => e.id.startsWith('t1_'));
  let out = `[source: Reddit official RSS | ${comments.length} comments, flat list (RSS has no nesting/scores), sorted ${sort}]\n\n`;
  if (op) out += `POST: ${op.title}\nr/${op.sub} · u/${op.author} · ${date(op.published)}\n${op.link}\n${clip(op.text, 4000)}\n\n--- COMMENTS ---\n`;
  out += comments.map((c, i) => `#${i + 1} u/${c.author} (${date(c.published)}): ${clip(c.text, max_chars)}`).join('\n\n');
  return out;
}

// ---------- Arctic Shift archive tools ----------
const AS = 'https://arctic-shift.photon-reddit.com/api';
// Normalise "3months", "2 weeks", "1y", "10d" etc. to an ISO date (Arctic Shift only accepts some relative forms).
function normDate(v) {
  if (v === undefined || v === null || v === '') return v;
  const m = String(v).trim().toLowerCase().match(/^(\d+)\s*(y|yr|yrs|year|years|mo|mon|month|months|w|wk|week|weeks|d|day|days|h|hour|hours)$/);
  if (!m) return v;
  const n = +m[1], u = m[2], d = new Date();
  if (u.startsWith('y')) d.setUTCFullYear(d.getUTCFullYear() - n);
  else if (u.startsWith('mo')) d.setUTCMonth(d.getUTCMonth() - n);
  else if (u.startsWith('w')) d.setUTCDate(d.getUTCDate() - 7 * n);
  else if (u.startsWith('d')) d.setUTCDate(d.getUTCDate() - n);
  else d.setUTCHours(d.getUTCHours() - n);
  return d.toISOString().slice(0, 19);
}
const qs = o => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
async function asJson(path, params) {
  if ('after' in params) params.after = normDate(params.after);
  if ('before' in params) params.before = normDate(params.before);
  const txt = await getText('arctic', `${AS}${path}?${qs(params)}`);
  const j = JSON.parse(txt); if (j.error) throw new Error('Arctic Shift: ' + j.error); return j;
}
const subList = s => String(s || '').split(',').map(sub).filter(Boolean);

// Local keyword matcher: words must all appear; "quoted phrases" must appear verbatim; " OR " splits alternatives.
function matches(text, query) {
  const t = String(text || '').toLowerCase();
  return String(query).split(/\s+OR\s+/).some(alt => {
    const phrases = [...alt.matchAll(/"([^"]+)"/g)].map(m => m[1].toLowerCase());
    const words = alt.replace(/"[^"]+"/g, ' ').toLowerCase().split(/\s+/).filter(Boolean);
    return phrases.every(p => t.includes(p)) && words.every(w => w.startsWith('-') ? !t.includes(w.slice(1)) : t.includes(w));
  });
}
async function scanPosts(s, after, before, pages = 3) {
  const out = []; let cursor = before ? normDate(before) : undefined;
  for (let i = 0; i < Math.min(+pages || 3, 10); i++) {
    const j = await asJson('/posts/search', { subreddit: s, after, before: cursor, limit: 100 });
    const d = j.data || []; out.push(...d);
    if (d.length < 100) break;
    cursor = Math.min(...d.map(p => p.created_utc));
  }
  return out.sort((a, b) => b.created_utc - a.created_utc);
}
const fmtPost = max_chars => (p, i) => `${i + 1}. ${decode(p.title || '')}\n   r/${p.subreddit} · u/${p.author} · ${date(p.created_utc)} · score ${p.score} · ${p.num_comments} comments · id=${p.id}\n   https://www.reddit.com/r/${p.subreddit}/comments/${p.id}/\n   ${clip(decode(p.selftext || '').replace(/\s+/g, ' '), max_chars)}`;

async function archiveSearchPosts({ query, subreddits, author, after = '1year', before, limit = 25, min_comments = 0, max_chars = 700, fallback_rss = true, scan_pages = 3 }) {
  const subs = subList(subreddits);
  if (!subs.length && !author) throw new Error('Provide subreddits (comma-separated) or author — Arctic Shift keyword search requires one of them.');
  const targets = subs.length ? subs : [null];
  const parts = [];
  for (const s of targets) {
    try {
      const j = await asJson('/posts/search', { subreddit: s, author, query, after, before, limit: min_comments > 0 ? 100 : Math.min(+limit || 25, 100) });
      j.data = (j.data || []).sort((a, b) => b.created_utc - a.created_utc);
      let rows = (j.data || []).filter(p => (p.num_comments || 0) >= min_comments).slice(0, Math.min(+limit || 25, 100));
      parts.push(`## r/${s || '(author ' + author + ')'} — ${rows.length} posts\n` + rows.map((p, i) =>
        `${i + 1}. ${decode(p.title || '')}\n   r/${p.subreddit} · u/${p.author} · ${date(p.created_utc)} · score ${p.score} · ${p.num_comments} comments · id=${p.id}\n   https://www.reddit.com/r/${p.subreddit}/comments/${p.id}/\n   ${clip(decode(p.selftext || '').replace(/\s+/g, ' '), max_chars)}`).join('\n\n'));
    } catch (e) {
      // Archive keyword search often times out under load. Fallback 1: scan recent posts (cheap listing) and filter locally.
      if (s && query) {
        try {
          const rows = (await scanPosts(s, after, before, scan_pages)).filter(p => matches(`${p.title} ${p.selftext}`, query) && (p.num_comments || 0) >= min_comments).slice(0, Math.min(+limit || 25, 100));
          if (rows.length) { parts.push(`## r/${s} — ${rows.length} posts (archive scan mode: newest ${scan_pages * 100} posts in range, filtered locally)\n` + rows.map(fmtPost(max_chars)).join('\n\n')); continue; }
        } catch (e3) { log('scan failed', e3.message); }
      }
      // Fallback 2: Reddit's official RSS search for this subreddit.
      if (s && query && fallback_rss !== false) {
        try { parts.push(`## r/${s} — archive unavailable (${clip(e.message, 80)}); FALLBACK to official RSS search:\n` + await rssSearch({ query, subreddit: s, sort: 'new', time: 'year', limit, max_chars })); continue; }
        catch (e2) { parts.push(`## r/${s}: archive ERROR ${clip(e.message, 120)} | RSS fallback ERROR ${clip(e2.message, 160)}`); continue; }
      }
      parts.push(`## r/${s}: ERROR ${e.message}`);
    }
  }
  return `[source: Arctic Shift archive | query="${query || ''}" after=${after}${before ? ' before=' + before : ''} | scores lag ~36h for new posts]\n\n` + parts.join('\n\n');
}
async function archiveSearchComments({ query, subreddits, author, after = '6months', before, limit = 25, max_chars = 700 }) {
  const subs = subList(subreddits);
  if (!query) throw new Error('query is required');
  if (!subs.length && !author) throw new Error('Provide subreddits (comma-separated) or author.');
  const parts = [];
  for (const s of (subs.length ? subs : [null])) {
    try {
      const j = await asJson('/comments/search', { subreddit: s, author, body: query, after, before, limit: Math.min(+limit || 25, 100) });
      j.data = (j.data || []).sort((a, b) => b.created_utc - a.created_utc);
      const rows = j.data || [];
      parts.push(`## r/${s || author} — ${rows.length} comments\n` + rows.map((c, i) =>
        `${i + 1}. u/${c.author} · ${date(c.created_utc)} · score ${c.score} · post=${String(c.link_id).replace('t3_', '')}\n   https://www.reddit.com/r/${c.subreddit}/comments/${String(c.link_id).replace('t3_', '')}/_/${c.id}/\n   ${clip(decode(c.body || '').replace(/\s+/g, ' '), max_chars)}`).join('\n\n'));
    } catch (e) { parts.push(`## r/${s}: ERROR ${e.message}\n   (Comment full-text search can time out or be refused on very large subreddits — try a shorter date range like after=1month, or use archive_search_posts.)`); }
  }
  return `[source: Arctic Shift archive | comment full-text search | query="${query}" after=${after}]\n\n` + parts.join('\n\n');
}
async function archiveThread({ post, limit = 500, max_chars = 1200, min_score }) {
  const id = postIdFrom(post); if (!id) throw new Error('Provide a Reddit post URL or post id');
  const [p, t] = await Promise.all([
    asJson('/posts/ids', { ids: id, fields: 'id,title,selftext,author,subreddit,created_utc,score,num_comments' }),
    asJson('/comments/tree', { link_id: 't3_' + id, limit: Math.min(+limit || 500, 9999), start_breadth: 50, start_depth: 8 }),
  ]);
  const op = (p.data || [])[0];
  const lines = []; let count = 0, hidden = 0;
  const walk = (nodes, depth) => {
    const arr = Array.isArray(nodes) ? nodes : nodes?.data?.children || [];
    for (const n of arr) {
      if (n.kind === 'more') { hidden += (n.data?.children?.length || n.data?.count || 0); continue; }
      const c = n.data || n; if (!c.body) continue;
      if (min_score !== undefined && (c.score ?? 0) < min_score) { continue; }
      count++;
      lines.push(`${'  '.repeat(depth)}- [${c.score ?? '?'}] u/${c.author}: ${clip(decode(c.body).replace(/\s+/g, ' '), max_chars)}`);
      if (c.replies) walk(c.replies, depth + 1);
    }
  };
  walk(t.data, 0);
  if (count === 0 && (!op || Date.now() / 1000 - op.created_utc < 3 * 86400 || (op.num_comments || 0) > 0)) {
    try { return `(archive has no comments yet for this post — showing live official RSS instead)\n\n` + await rssComments({ post, max_chars }); } catch (e) { log('rss fallback failed', e.message); }
  }
  let out = `[source: Arctic Shift archive | ${count} comments shown${hidden ? `, ${hidden} collapsed` : ''} | nested, [score]]\n\n`;
  if (op) out += `POST: ${decode(op.title || '')}\nr/${op.subreddit} · u/${op.author} · ${date(op.created_utc)} · score ${op.score} · ${op.num_comments} comments\nhttps://www.reddit.com/r/${op.subreddit}/comments/${op.id}/\n${clip(decode(op.selftext || '').replace(/\s*\n\s*\n\s*/g, '\n\n').trim(), 4000)}\n\n--- COMMENTS ---\n`;
  else out += `(post ${id} not found in archive — it may be too new; try rss_post_comments)\n`;
  return out + lines.join('\n');
}
async function archiveFindSubreddits({ prefix, min_subscribers = 1000, limit = 25 }) {
  const j = await asJson('/subreddits/search', { subreddit_prefix: sub(prefix), min_subscribers, limit: Math.min(+limit || 25, 100), fields: 'display_name,subscribers,public_description' });
  return `[source: Arctic Shift | subreddits starting with "${prefix}"]\n` + (j.data || []).map(s => `- r/${s.display_name} (${(s.subscribers || 0).toLocaleString()} subs): ${clip(decode(s.public_description || ''), 160)}`).join('\n');
}

// ---------- MCP wiring ----------
const str = (d) => ({ type: 'string', description: d });
const num = (d) => ({ type: 'number', description: d });
const TOOLS = [
  { name: 'rss_search', fn: rssSearch, description: 'LIVE search of Reddit posts via Reddit\'s official public RSS feed (no scores). Slow: Reddit throttles to ~1 request per 10-40s, results are cached 10 min. Use for very recent posts; prefer archive_search_posts for bulk research.',
    inputSchema: { type: 'object', required: ['query'], properties: { query: str('Search terms; supports Reddit syntax e.g. "would pay" OR "wish there was"'), subreddit: str('Optional subreddit to restrict to'), sort: { type: 'string', enum: ['relevance', 'new', 'top', 'comments', 'hot'] }, time: { type: 'string', enum: ['hour', 'day', 'week', 'month', 'year', 'all'] }, limit: num('Max 100, default 25'), max_chars: num('Max chars of body per post, default 600') } } },
  { name: 'rss_browse', fn: rssBrowse, description: 'LIVE listing of a subreddit (hot/new/top/rising) via official RSS. Slow, no scores.',
    inputSchema: { type: 'object', required: ['subreddit'], properties: { subreddit: str('Subreddit name'), sort: { type: 'string', enum: ['hot', 'new', 'top', 'rising', 'controversial'] }, time: { type: 'string', enum: ['hour', 'day', 'week', 'month', 'year', 'all'] }, limit: num('Max 100'), max_chars: num('Body chars per post') } } },
  { name: 'rss_post_comments', fn: rssComments, description: 'LIVE post + its comments via official RSS (flat list, no nesting or scores, up to ~500). Use when a post is too new for the archive.',
    inputSchema: { type: 'object', required: ['post'], properties: { post: str('Reddit post URL or id'), subreddit: str('Optional, speeds up lookup'), sort: { type: 'string', enum: ['top', 'best', 'new', 'controversial', 'old'] }, limit: num('Max 500'), max_chars: num('Chars per comment, default 1500') } } },
  { name: 'archive_search_posts', fn: archiveSearchPosts, description: 'FAST keyword search of Reddit posts (title+body) with score and comment counts, via the Arctic Shift archive. Requires subreddits (comma-separated, searched one by one) or author. Best tool for bulk pain-point / demand research.',
    inputSchema: { type: 'object', properties: { query: str('Keywords (all words must match). Leave empty to list recent posts.'), subreddits: str('Comma-separated, e.g. "smallbusiness,Entrepreneur,SaaS"'), author: str('Optional author'), after: str('Date or offset: 2026-01-01, 3months, 1year (default 1year)'), before: str('Optional end date'), limit: num('Per subreddit, max 100, default 25'), min_comments: num('Filter: minimum comments'), max_chars: num('Body chars per post, default 700'), scan_pages: num('If archive keyword search times out, scan this many pages x100 newest posts and filter locally (default 3, max 10)'), fallback_rss: { type: 'boolean', description: 'Last-resort fallback to official RSS search (slow). Default true.' } } } },
  { name: 'archive_search_comments', fn: archiveSearchComments, description: 'Full-text search of Reddit COMMENTS via Arctic Shift (e.g. "I would pay", "is there a tool"). Slower; may fail on huge subreddits — use a short date range.',
    inputSchema: { type: 'object', required: ['query'], properties: { query: str('Supports "exact phrase", OR, -exclude'), subreddits: str('Comma-separated subreddits'), author: str('Optional'), after: str('Default 6months'), before: str('Optional'), limit: num('Per subreddit, max 100'), max_chars: num('Chars per comment') } } },
  { name: 'archive_thread', fn: archiveThread, description: 'FULL nested comment thread of a post with scores, via Arctic Shift. Best way to read a whole discussion. Very new posts (<1 day) may be incomplete — fall back to rss_post_comments.',
    inputSchema: { type: 'object', required: ['post'], properties: { post: str('Reddit post URL or id'), limit: num('Max comments, default 500'), max_chars: num('Chars per comment, default 1200'), min_score: num('Optional: hide comments below this score') } } },
  { name: 'archive_find_subreddits', fn: archiveFindSubreddits, description: 'Find subreddits by name prefix with subscriber counts (to pick communities to research).',
    inputSchema: { type: 'object', required: ['prefix'], properties: { prefix: str('Name prefix, e.g. "accounting"'), min_subscribers: num('Default 1000'), limit: num('Max 100') } } },
];

const server = new Server({ name: 'reddit-research', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS.map(({ fn, ...t }) => ({ ...t, annotations: { readOnlyHint: true, openWorldHint: true } })) }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = TOOLS.find(t => t.name === req.params.name);
  if (!tool) return { isError: true, content: [{ type: 'text', text: 'Unknown tool ' + req.params.name }] };
  const t0 = Date.now();
  try {
    const text = await tool.fn(req.params.arguments || {});
    log(`${tool.name} ok ${Date.now() - t0}ms`);
    return { content: [{ type: 'text', text }] };
  } catch (e) {
    log(`${tool.name} error ${Date.now() - t0}ms: ${e.message}`);
    return { isError: true, content: [{ type: 'text', text: 'Error: ' + e.message }] };
  }
});
await server.connect(new StdioServerTransport());
log('ready');
