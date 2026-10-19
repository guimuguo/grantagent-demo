"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type ApiError } from "@/lib/api";

const PAGE_SIZE = 50;

type Deadline = "all" | "open" | "30d" | "90d" | "180d";
const DEADLINE_LABEL: Record<Deadline, string> = {
  all: "All",
  open: "Open (not past)",
  "30d": "Next 30 days",
  "90d": "Next 90 days",
  "180d": "Next 180 days",
};

type Row = {
  opportunity_id: string;
  title: string | null;
  agency: string | null;
  program: string | null;
  source: string | null;
  deadline: string | null;
  url: string | null;
  first_seen_at: string | null;
  award_floor: number | null;
  award_ceiling: number | null;
  match_count: number;
};

type Resp = { total: number; limit: number; offset: number; rows: Row[] };

export function OppsTable() {
  const [q, setQ] = useState("");
  const [deadline, setDeadline] = useState<Deadline>("open");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Resp | null>(null);

  const load = useCallback(async () => {
    setData(null);
    const p = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
      deadline,
    });
    if (q.trim()) p.set("q", q.trim());
    try {
      setData(await api<Resp>(`/api/admin/opportunities?${p}`));
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Load failed");
    }
  }, [q, deadline, offset]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setOffset(0);
  }, [q, deadline]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total.toLocaleString()} total
          </p>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <Label htmlFor="q" className="sr-only">
            Search
          </Label>
          <Input
            id="q"
            placeholder="Title, agency, program…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={deadline}
          onChange={(e) => setDeadline(e.target.value as Deadline)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          {(Object.keys(DEADLINE_LABEL) as Deadline[]).map((k) => (
            <option key={k} value={k}>
              {DEADLINE_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      {data === null ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.rows.length === 0 ? (
        <p className="text-muted-foreground">No opportunities match.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Agency</th>
                <th className="px-3 py-2">Deadline</th>
                <th className="px-3 py-2">First seen</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2 text-right">Matches</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.opportunity_id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">
                    <Link
                      href={`/opportunities/${r.opportunity_id}`}
                      className="hover:underline"
                    >
                      {r.title ?? "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.agency ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.deadline ?? "rolling"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {r.first_seen_at
                      ? new Date(r.first_seen_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{r.source ?? "—"}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.match_count}
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
