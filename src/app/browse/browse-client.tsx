"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type ApiError } from "@/lib/api";
import type { OpportunityRow } from "@/lib/types";

type Deadline = "any" | "open" | "30d" | "90d" | "180d";
type OrderBy =
  | "best_match"
  | "soonest_deadline"
  | "newest_posted"
  | "highest_award";

const DEADLINE_LABELS: Record<Deadline, string> = {
  any: "Any",
  open: "Open (not past)",
  "30d": "Next 30 days",
  "90d": "Next 90 days",
  "180d": "Next 180 days",
};

const ORDER_LABELS: Record<OrderBy, string> = {
  best_match: "Best match for me",
  soonest_deadline: "Soonest deadline",
  newest_posted: "Newest posted",
  highest_award: "Highest award",
};

export function BrowseClient() {
  const [deadline, setDeadline] = useState<Deadline>("open");
  const [orderBy, setOrderBy] = useState<OrderBy>("best_match");
  const [keyword, setKeyword] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [rows, setRows] = useState<OpportunityRow[] | null>(null);

  const fetchOpps = useCallback(async () => {
    setRows(null);
    const q = new URLSearchParams({
      deadline,
      order_by: orderBy,
      limit: "50",
    });
    if (keyword.trim()) q.set("keyword", keyword.trim());
    if (savedOnly) q.set("saved_only", "true");
    try {
      const data = await api<OpportunityRow[]>(`/api/opportunities?${q}`);
      setRows(data);
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't load");
    }
  }, [deadline, orderBy, keyword, savedOnly]);

  useEffect(() => {
    fetchOpps();
  }, [fetchOpps]);

  async function toggleSave(opp: OpportunityRow) {
    const willSave = !opp.is_saved;
    try {
      await api(`/api/opportunities/${opp.opportunity_id}/save`, {
        method: willSave ? "POST" : "DELETE",
      });
      setRows((prev) =>
        prev
          ? prev.map((o) =>
              o.opportunity_id === opp.opportunity_id
                ? { ...o, is_saved: willSave }
                : o,
            )
          : prev,
      );
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't save");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Browse funding
      </h1>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="kw" className="text-xs uppercase tracking-wide text-muted-foreground">
            Keyword
          </Label>
          <Input
            id="kw"
            placeholder="e.g. AI, MRI, climate"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Deadline
          </Label>
          <select
            value={deadline}
            onChange={(e) => setDeadline(e.target.value as Deadline)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {(Object.keys(DEADLINE_LABELS) as Deadline[]).map((k) => (
              <option key={k} value={k}>
                {DEADLINE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Sort by
          </Label>
          <select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value as OrderBy)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {(Object.keys(ORDER_LABELS) as OrderBy[]).map((k) => (
              <option key={k} value={k}>
                {ORDER_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
            />
            Saved only
          </label>
        </div>
      </div>

      {rows === null && <p className="text-muted-foreground">Loading…</p>}
      {rows && rows.length === 0 && (
        <p className="text-muted-foreground">
          No opportunities match these filters.
        </p>
      )}
      {rows && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((o) => (
            <Card key={o.opportunity_id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-tight">
                      <Link
                        href={`/opportunities/${o.opportunity_id}`}
                        className="hover:underline"
                      >
                        {o.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {o.agency ?? "—"}
                      {o.program ? ` · ${o.program}` : ""}
                      {" · Deadline: "}
                      {o.deadline ?? "rolling"}
                      {o.similarity != null && (
                        <>
                          {" · "}
                          <Badge variant="outline">
                            sim {o.similarity.toFixed(2)}
                          </Badge>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={o.is_saved ? "default" : "outline"}
                    onClick={() => toggleSave(o)}
                  >
                    {o.is_saved ? "🔖 Saved" : "🔖 Save"}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
