import { apiSSR } from "@/lib/api";

type CostRow = {
  week_of: string;
  agent_name: string;
  model: string | null;
  runs: number;
  budget_hits: number;
  input_tokens: number;
  output_tokens: number;
  avg_duration_ms: number | null;
  p95_duration_ms: number | null;
  tool_calls: number;
  estimated_cost_usd: number;
};

type QualityRow = {
  week_of: string;
  total_matches: number;
  primary_matches: number;
  collab_candidates: number;
  strong_fits: number;
  possible_fits: number;
  faculty_with_primary: number;
  thumbs_up: number;
  thumbs_down: number;
  applied: number;
  avg_score: number | null;
};

type SourceRow = {
  source: string;
  runs_30d: number;
  errored_runs_30d: number;
  items_seen_30d: number;
  items_new_30d: number;
  last_run_at: string | null;
  avg_items_seen: number | null;
};

type Stats = { costs: CostRow[]; quality: QualityRow[]; sources: SourceRow[] };

function fmtNum(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default async function AdminStatsPage() {
  const stats = await apiSSR<Stats>("/api/admin/stats");

  const totalCostUsd = stats.costs.reduce((s, r) => s + r.estimated_cost_usd, 0);
  const totalInTokens = stats.costs.reduce((s, r) => s + r.input_tokens, 0);
  const totalOutTokens = stats.costs.reduce((s, r) => s + r.output_tokens, 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Stats</h1>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Agent costs</h2>
          <div className="mb-3 grid grid-cols-3 gap-4 rounded-lg border bg-card p-4">
            <Stat label="Total est." value={fmtMoney(totalCostUsd)} />
            <Stat label="Input tokens" value={fmtNum(totalInTokens)} />
            <Stat label="Output tokens" value={fmtNum(totalOutTokens)} />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Week</th>
                  <th className="px-3 py-2">Agent</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2 text-right">Runs</th>
                  <th className="px-3 py-2 text-right">Budget hits</th>
                  <th className="px-3 py-2 text-right">In tok</th>
                  <th className="px-3 py-2 text-right">Out tok</th>
                  <th className="px-3 py-2 text-right">$</th>
                </tr>
              </thead>
              <tbody>
                {stats.costs.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{r.week_of}</td>
                    <td className="px-3 py-2 font-medium">{r.agent_name}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.model ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.runs}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.budget_hits}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtNum(r.input_tokens)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtNum(r.output_tokens)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.estimated_cost_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Match quality (12 weeks)</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Week</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Primary</th>
                  <th className="px-3 py-2 text-right">Collab</th>
                  <th className="px-3 py-2 text-right">Strong</th>
                  <th className="px-3 py-2 text-right">Possible</th>
                  <th className="px-3 py-2 text-right">Avg score</th>
                  <th className="px-3 py-2 text-right">👍</th>
                  <th className="px-3 py-2 text-right">👎</th>
                  <th className="px-3 py-2 text-right">Applied</th>
                </tr>
              </thead>
              <tbody>
                {stats.quality.map((r) => (
                  <tr key={r.week_of} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{r.week_of}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.total_matches}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.primary_matches}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.collab_candidates}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.strong_fits}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.possible_fits}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.avg_score != null ? r.avg_score.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.thumbs_up}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.thumbs_down}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.applied}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Data sources (30d)</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2 text-right">Runs</th>
                  <th className="px-3 py-2 text-right">Errors</th>
                  <th className="px-3 py-2 text-right">Items seen</th>
                  <th className="px-3 py-2 text-right">New</th>
                  <th className="px-3 py-2 text-right">Avg per run</th>
                  <th className="px-3 py-2">Last run</th>
                </tr>
              </thead>
              <tbody>
                {stats.sources.map((r) => (
                  <tr key={r.source} className="border-t">
                    <td className="px-3 py-2 font-medium">{r.source}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.runs_30d}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.errored_runs_30d > 0 ? (
                        <span className="text-destructive">{r.errored_runs_30d}</span>
                      ) : (
                        r.errored_runs_30d
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtNum(r.items_seen_30d)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtNum(r.items_new_30d)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.avg_items_seen != null ? r.avg_items_seen.toFixed(0) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.last_run_at ? new Date(r.last_run_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">
          Cost is computed client-side from Anthropic published per-1M
          rates (Haiku $0.80/$4.00, Sonnet $3/$15, Opus $15/$75). Update
          backend/app/routers/admin.py:_PRICE_PER_M when pricing changes.
        </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
