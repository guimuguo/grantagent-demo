"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { api, type ApiError } from "@/lib/api";

type MatchRow = {
  match_id: string;
  score: number | null;
  retrieval_score: number | null;
  llm_score: number | null;
  verdict: string | null;
  feedback: string | null;
  is_primary: boolean;
  is_collab_candidate: boolean;
  rationale: string | null;
  faculty_id: string;
  faculty_name: string;
  faculty_email: string | null;
  opportunity_id: string;
  opp_title: string;
  agency: string | null;
  deadline: string | null;
};

type Resp = { week_of: string | null; rows: MatchRow[] };

function VerdictBadge({ verdict }: { verdict: string | null }) {
  if (!verdict) return null;
  const color =
    verdict === "strong_fit"
      ? "default"
      : verdict === "possible_fit"
        ? "secondary"
        : "outline";
  return <Badge variant={color}>{verdict}</Badge>;
}

export function MatchesTable() {
  const [weeks, setWeeks] = useState<string[] | null>(null);
  const [week, setWeek] = useState<string>("");
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ws = await api<string[]>("/api/admin/matches/weeks");
        setWeeks(ws);
        if (ws.length > 0) setWeek(ws[0]);
      } catch (err) {
        toast.error((err as ApiError).detail ?? "Couldn't load weeks");
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!week) return;
    setData(null);
    try {
      const res = await api<Resp>(
        `/api/admin/matches?week_of=${encodeURIComponent(week)}`,
      );
      setData(res);
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't load matches");
    }
  }, [week]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Matches</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.rows.length} matches in week {data.week_of}
          </p>
        )}
      </div>

      <div className="mb-4 max-w-xs space-y-1">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Week of
        </Label>
        <select
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {weeks?.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {data === null ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.rows.length === 0 ? (
        <p className="text-muted-foreground">No matches this week.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Faculty</th>
                <th className="px-3 py-2">Opportunity</th>
                <th className="px-3 py-2 text-right">Score</th>
                <th className="px-3 py-2">Verdict</th>
                <th className="px-3 py-2">Flags</th>
                <th className="px-3 py-2">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.match_id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{r.faculty_name}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/opportunities/${r.opportunity_id}`}
                      className="font-medium hover:underline"
                    >
                      {r.opp_title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {r.agency ?? "—"} · deadline {r.deadline ?? "rolling"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.score != null ? r.score.toFixed(3) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <VerdictBadge verdict={r.verdict} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {r.is_primary && (
                        <Badge variant="default" className="text-xs">
                          Email
                        </Badge>
                      )}
                      {r.is_collab_candidate && (
                        <Badge variant="secondary" className="text-xs">
                          Collab
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.feedback ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
