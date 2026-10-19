/**
 * In-browser stand-in for the FastAPI backend.
 *
 * Every `api()` call in the app is routed here instead of over the
 * network. Read endpoints answer from `fixtures.json` (real public
 * grants.gov opportunities + fictional people); write endpoints mutate a
 * small state object that is persisted to localStorage so saves,
 * feedback and review decisions survive a page reload — per visitor,
 * never shared.
 */

import fixtures from "./fixtures.json";

type Json = Record<string, unknown>;
type Opp = (typeof fixtures.opportunities)[number];

export type MockError = { ok: false; status: number; detail: string };

const STORAGE_KEY = "grantagent-demo-state-v1";

type State = {
  saved: Record<string, string>; // opportunity_id -> saved_at
  feedback: Record<string, string | null>; // match_id -> feedback
  reviews: Record<string, { status: string; notes: string | null; at: string }>;
  subscribed: Record<string, boolean>; // faculty_id -> override
  profile: Partial<typeof fixtures.profile>;
  disowned: string[];
};

function freshState(): State {
  const now = new Date().toISOString();
  return {
    saved: Object.fromEntries(fixtures.initial_saved.map((id) => [id, now])),
    feedback: {},
    reviews: {},
    subscribed: {},
    profile: {},
    disowned: [],
  };
}

let state: State | null = null;

function load(): State {
  if (state) return state;
  state = freshState();
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) state = { ...state, ...(JSON.parse(raw) as Partial<State>) };
    } catch {
      /* private mode / blocked storage — fall back to in-memory */
    }
  }
  return state;
}

function persist() {
  if (typeof window === "undefined" || !state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Wipe this visitor's demo changes (saves, feedback, decisions). */
export function resetDemoState() {
  state = freshState();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

// ------------------------------------------------------------ helpers

const today = () => new Date().toISOString().slice(0, 10);

function fail(status: number, detail: string): never {
  const err: MockError = { ok: false, status, detail };
  throw err;
}

function isOpen(o: { deadline: string | null }) {
  return o.deadline === null || o.deadline >= today();
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline + "T00:00:00").getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

function oppRow(o: Opp, extra: Json = {}) {
  const s = load();
  return {
    opportunity_id: o.opportunity_id,
    title: o.title,
    agency: o.agency,
    program: o.program,
    deadline: o.deadline,
    award_floor: o.award_floor,
    award_ceiling: o.award_ceiling,
    url: o.url,
    collaboration_signal: o.collaboration_signal,
    first_seen_at: o.first_seen_at,
    is_saved: o.opportunity_id in s.saved,
    saved_at: s.saved[o.opportunity_id] ?? null,
    days_until_deadline: daysUntil(o.deadline),
    ...extra,
  };
}

function oppById(id: string): Opp {
  const o = fixtures.opportunities.find((x) => x.opportunity_id === id);
  if (!o) fail(404, "opportunity not found");
  return o;
}

function paginate<T>(rows: T[], q: URLSearchParams, defLimit = 50) {
  const limit = Number(q.get("limit") ?? defLimit);
  const offset = Number(q.get("offset") ?? 0);
  return { total: rows.length, limit, offset, rows: rows.slice(offset, offset + limit) };
}

function contains(hay: (string | null | undefined)[], needle: string) {
  const n = needle.toLowerCase();
  return hay.some((h) => h?.toLowerCase().includes(n));
}

function deadlineWithin(o: { deadline: string | null }, key: string | null) {
  if (!key || key === "any" || key === "all") return true;
  if (key === "open") return isOpen(o);
  const days = Number(key.replace("d", ""));
  const d = daysUntil(o.deadline);
  return d !== null && d >= 0 && d <= days;
}

function facultyRows() {
  const s = load();
  return fixtures.faculty.map((f) => ({
    ...f,
    is_subscribed: s.subscribed[f.faculty_id] ?? f.is_subscribed,
  }));
}

function reviewRows() {
  const s = load();
  return fixtures.reviews.map((r) => {
    const d = s.reviews[r.review_id];
    return d
      ? { ...r, status: d.status, notes: d.notes, reviewed_at: d.at, reviewed_by: fixtures.me.email }
      : r;
  });
}

// ------------------------------------------------------------ routes

type Handler = (m: RegExpMatchArray, q: URLSearchParams, body: Json) => unknown;

const routes: [string, RegExp, Handler][] = [
  // ---- auth (always succeeds — there is only one demo account)
  ["GET", /^\/api\/me$/, () => fixtures.me],
  ["POST", /^\/api\/auth\/logout$/, () => null],
  ["POST", /^\/api\/auth\/login\/request$/, (_m, _q, b) => ({ to: b.email })],
  ["GET", /^\/api\/auth\/login\/confirm$/, () => fixtures.me],
  ["POST", /^\/api\/auth\/signup\/request$/, (_m, _q, b) => ({ to: b.email })],
  ["GET", /^\/api\/auth\/signup\/confirm$/, () => fixtures.me],
  [
    "GET",
    /^\/api\/auth\/email-change\/confirm$/,
    () => ({ name: fixtures.me.full_name, new_email: fixtures.me.email }),
  ],

  // ---- faculty dashboard
  [
    "GET",
    /^\/api\/matches$/,
    (_m, q) => {
      const s = load();
      const min = Number(q.get("min_score") ?? 0.3);
      const showDismissed = q.get("show_dismissed") === "true";
      return fixtures.matches
        .map((m) => ({ ...m, feedback: m.match_id in s.feedback ? s.feedback[m.match_id] : m.feedback }))
        .filter((m) => (m.score ?? 0) >= min && isOpen(m))
        .filter((m) => showDismissed || m.feedback !== "not_relevant")
        .sort((a, b) => b.week_of.localeCompare(a.week_of) || (b.score ?? 0) - (a.score ?? 0));
    },
  ],
  [
    "POST",
    /^\/api\/matches\/([^/]+)\/feedback$/,
    (m, _q, b) => {
      load().feedback[m[1]] = (b.feedback as string | null) ?? null;
      persist();
      return { ok: true };
    },
  ],
  [
    "GET",
    /^\/api\/opportunities\/saved$/,
    () => {
      const s = load();
      return fixtures.opportunities
        .filter((o) => o.opportunity_id in s.saved)
        .sort((a, b) => s.saved[b.opportunity_id].localeCompare(s.saved[a.opportunity_id]))
        .map((o) => oppRow(o));
    },
  ],
  [
    "GET",
    /^\/api\/opportunities\/popular$/,
    () =>
      fixtures.opportunities
        .filter((o) => o.n_matched > 0 && isOpen(o))
        .sort((a, b) => b.n_matched - a.n_matched || (a.title ?? "").localeCompare(b.title ?? ""))
        .slice(0, 4)
        .map((o) => oppRow(o, { n_matched: o.n_matched })),
  ],
  [
    "GET",
    /^\/api\/opportunities$/,
    (_m, q) => {
      const s = load();
      const kw = q.get("keyword");
      let rows = fixtures.opportunities.filter((o) => deadlineWithin(o, q.get("deadline")));
      if (kw) rows = rows.filter((o) => contains([o.title, o.agency, o.program, o.summary], kw));
      if (q.get("saved_only") === "true") rows = rows.filter((o) => o.opportunity_id in s.saved);
      const order = q.get("order_by") ?? "best_match";
      const by: Record<string, (a: Opp, b: Opp) => number> = {
        best_match: (a, b) => b.similarity - a.similarity,
        soonest_deadline: (a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"),
        newest_posted: (a, b) => b.first_seen_at.localeCompare(a.first_seen_at),
        highest_award: (a, b) => (b.award_ceiling ?? -1) - (a.award_ceiling ?? -1),
      };
      return [...rows]
        .sort(by[order] ?? by.best_match)
        .slice(0, Number(q.get("limit") ?? 50))
        .map((o) => oppRow(o, { similarity: o.similarity }));
    },
  ],
  [
    "GET",
    /^\/api\/opportunities\/([^/]+)$/,
    (m) => {
      const o = oppById(m[1]);
      return oppRow(o, { summary: o.summary, eligibility: o.eligibility });
    },
  ],
  [
    "POST",
    /^\/api\/opportunities\/([^/]+)\/save$/,
    (m) => {
      load().saved[m[1]] = new Date().toISOString();
      persist();
      return { ok: true };
    },
  ],
  [
    "DELETE",
    /^\/api\/opportunities\/([^/]+)\/save$/,
    (m) => {
      delete load().saved[m[1]];
      persist();
      return null;
    },
  ],

  // ---- profile
  ["GET", /^\/api\/profile$/, () => ({ ...fixtures.profile, ...load().profile, disowned_openalex_work_ids: load().disowned })],
  [
    "PATCH",
    /^\/api\/profile$/,
    (_m, _q, b) => {
      Object.assign(load().profile, b);
      persist();
      return { ok: true };
    },
  ],
  [
    "GET",
    /^\/api\/profile\/papers$/,
    () => fixtures.papers.filter((p) => !load().disowned.includes(p.openalex_work_id)),
  ],
  [
    "POST",
    /^\/api\/profile\/disown$/,
    (_m, _q, b) => {
      const ids = (b.work_ids ?? b.openalex_work_ids ?? []) as string[];
      const s = load();
      s.disowned = [...new Set([...s.disowned, ...ids])];
      persist();
      return { ok: true };
    },
  ],
  ["POST", /^\/api\/profile\/rebuild$/, () => ({ ok: true })],
  ["POST", /^\/api\/profile\/email-change$/, (_m, _q, b) => ({ to: b.new_email ?? b.email })],
  ["POST", /^\/api\/profile\/unsubscribe$/, () => ({ ok: true })],

  // ---- admin
  [
    "GET",
    /^\/api\/admin\/faculty$/,
    (_m, q) => {
      let rows = facultyRows();
      const qq = q.get("q");
      if (qq) rows = rows.filter((f) => contains([f.full_name, f.email, f.department], qq));
      const sub = q.get("subscribed");
      if (sub === "yes") rows = rows.filter((f) => f.is_subscribed);
      if (sub === "no") rows = rows.filter((f) => !f.is_subscribed);
      return paginate(rows, q);
    },
  ],
  [
    "POST",
    /^\/api\/admin\/faculty\/([^/]+)\/(subscribe|unsubscribe)$/,
    (m) => {
      load().subscribed[m[1]] = m[2] === "subscribe";
      persist();
      return { ok: true };
    },
  ],
  [
    "GET",
    /^\/api\/admin\/opportunities$/,
    (_m, q) => {
      const qq = q.get("q");
      const rows = fixtures.opportunities
        .filter((o) => deadlineWithin(o, q.get("deadline")))
        .filter((o) => !qq || contains([o.title, o.agency, o.program], qq))
        .sort((a, b) => b.first_seen_at.localeCompare(a.first_seen_at))
        .map((o) => ({
          opportunity_id: o.opportunity_id,
          title: o.title,
          agency: o.agency,
          program: o.program,
          source: "grants_gov",
          deadline: o.deadline,
          url: o.url,
          first_seen_at: o.first_seen_at,
          award_floor: o.award_floor,
          award_ceiling: o.award_ceiling,
          match_count: o.n_matched,
        }));
      return paginate(rows, q);
    },
  ],
  [
    "GET",
    /^\/api\/admin\/matches\/weeks$/,
    () => [...new Set(fixtures.admin_matches.map((m) => m.week_of))].sort().reverse(),
  ],
  [
    "GET",
    /^\/api\/admin\/matches$/,
    (_m, q) => {
      const week = q.get("week_of");
      const s = load();
      return {
        week_of: week,
        rows: fixtures.admin_matches
          .filter((m) => m.week_of === week)
          .map((m) => ({ ...m, feedback: m.match_id in s.feedback ? s.feedback[m.match_id] : m.feedback }))
          .sort((a, b) => b.score - a.score),
      };
    },
  ],
  [
    "GET",
    /^\/api\/admin\/reviews$/,
    (_m, q) => {
      const status = q.get("status");
      const rows = reviewRows()
        .filter((r) => !status || status === "all" || r.status === status)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return paginate(rows, q, 200);
    },
  ],
  [
    "POST",
    /^\/api\/admin\/reviews\/([^/]+)\/resolve$/,
    (m, _q, b) => {
      load().reviews[m[1]] = {
        status: String(b.decision),
        notes: (b.notes as string | null) ?? null,
        at: new Date().toISOString(),
      };
      persist();
      return { ok: true };
    },
  ],
  [
    "GET",
    /^\/api\/admin\/runs\/agents\/list$/,
    () => [...new Set(fixtures.runs.map((r) => r.agent_name))].sort(),
  ],
  [
    "GET",
    /^\/api\/admin\/runs$/,
    (_m, q) => {
      const agent = q.get("agent");
      const err = q.get("has_error");
      const since = Number(q.get("since_days") ?? 14);
      const cutoff = new Date(Date.now() - since * 86_400_000).toISOString();
      const rows = fixtures.runs
        .filter((r) => r.started_at >= cutoff)
        .filter((r) => !agent || r.agent_name === agent)
        .filter((r) => err === null || String(r.has_error) === err)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(({ transcript, output, error, ...row }) => row);
      return paginate(rows, q);
    },
  ],
  [
    "GET",
    /^\/api\/admin\/runs\/([^/]+)$/,
    (m) => {
      const r = fixtures.runs.find((x) => x.run_id === m[1]);
      if (!r) fail(404, "run not found");
      return r;
    },
  ],
  ["GET", /^\/api\/admin\/stats$/, () => fixtures.stats],
];

export async function mockApi<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const url = new URL(path, "http://demo.local");
  let body: Json = {};
  if (typeof init?.body === "string" && init.body) {
    try {
      body = JSON.parse(init.body) as Json;
    } catch {
      /* not JSON */
    }
  }
  for (const [m, re, handler] of routes) {
    if (m !== method) continue;
    const match = url.pathname.match(re);
    if (match) {
      // A short delay so loading states are visible, like the real app.
      if (typeof window !== "undefined") await new Promise((r) => setTimeout(r, 120));
      return structuredClone(handler(match, url.searchParams, body)) as T;
    }
  }
  return fail(404, `demo: no mock for ${method} ${url.pathname}`);
}

export const demoOpportunityIds = () => fixtures.opportunities.map((o) => o.opportunity_id);
export const demoRunIds = () => fixtures.runs.map((r) => r.run_id);
