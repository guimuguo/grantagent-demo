"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, type ApiError } from "@/lib/api";

const PAGE_SIZE = 100;

type RunRow = {
  run_id: string;
  agent_name: string;
  input_ref_type: string;
  input_ref_id: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  tool_calls_made: number;
  step_budget_hit: boolean;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  has_error: boolean;
};

type Resp = { total: number; rows: RunRow[] };

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtNum(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

export function RunsTable() {
  const [agent, setAgent] = useState<string>("");
  const [agents, setAgents] = useState<string[]>([]);
  const [errorFilter, setErrorFilter] = useState<"all" | "ok" | "err">("all");
  const [sinceDays, setSinceDays] = useState(14);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setAgents(await api<string[]>("/api/admin/runs/agents/list"));
      } catch (err) {
        toast.error((err as ApiError).detail ?? "Couldn't load agent list");
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setData(null);
    const p = new URLSearchParams({
      since_days: String(sinceDays),
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (agent) p.set("agent", agent);
    if (errorFilter === "ok") p.set("has_error", "false");
    if (errorFilter === "err") p.set("has_error", "true");
    try {
      setData(await api<Resp>(`/api/admin/runs?${p}`));
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Load failed");
    }
  }, [agent, errorFilter, sinceDays, offset]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setOffset(0);
  }, [agent, errorFilter, sinceDays]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Agent runs</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total.toLocaleString()} runs · past {sinceDays}d
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Agent
          </Label>
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {agents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Status
          </Label>
          <select
            value={errorFilter}
            onChange={(e) => setErrorFilter(e.target.value as typeof errorFilter)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="ok">OK only</option>
            <option value="err">Errors only</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Window
          </Label>
          <select
            value={sinceDays}
            onChange={(e) => setSinceDays(Number(e.target.value))}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value={1}>1d</option>
            <option value={7}>7d</option>
            <option value={14}>14d</option>
            <option value={30}>30d</option>
            <option value={90}>90d</option>
          </select>
        </div>
      </div>

      {data === null ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.rows.length === 0 ? (
        <p className="text-muted-foreground">No runs.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2">Ref</th>
                <th className="px-3 py-2 text-right">Dur</th>
                <th className="px-3 py-2 text-right">Tools</th>
                <th className="px-3 py-2 text-right">In tok</th>
                <th className="px-3 py-2 text-right">Out tok</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.run_id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(r.started_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.agent_name}
                    {r.has_error && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        err
                      </Badge>
                    )}
                    {r.step_budget_hit && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        budget
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {r.input_ref_type}:{r.input_ref_id?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMs(r.duration_ms)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.tool_calls_made}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtNum(r.input_tokens)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtNum(r.output_tokens)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/runs/${r.run_id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Rows {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} of{" "}
            {data.total.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              ← Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={offset + PAGE_SIZE >= data.total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
