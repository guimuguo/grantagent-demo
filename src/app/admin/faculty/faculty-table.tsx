"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type ApiError } from "@/lib/api";
import type { FacultyListResponse, FacultyRow } from "@/lib/admin-types";

const PAGE_SIZE = 50;

type Filter = "all" | "yes" | "no";

const FILTER_LABEL: Record<Filter, string> = {
  all: "All faculty",
  yes: "Subscribed only",
  no: "Not subscribed",
};

export function FacultyTable() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<FacultyListResponse | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setData(null);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
      subscribed: filter,
    });
    if (q.trim()) params.set("q", q.trim());
    try {
      const res = await api<FacultyListResponse>(
        `/api/admin/faculty?${params}`,
      );
      setData(res);
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't load");
    }
  }, [q, filter, offset]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setOffset(0);
  }, [q, filter]);

  async function toggleSubscribe(row: FacultyRow) {
    setPendingId(row.faculty_id);
    try {
      if (row.is_subscribed) {
        await api(`/api/admin/faculty/${row.faculty_id}/unsubscribe`, {
          method: "POST",
        });
        toast.success(`${row.full_name} unsubscribed`);
      } else {
        await api(
          `/api/admin/faculty/${row.faculty_id}/subscribe?send_confirmation=false&run_initial_match=false`,
          { method: "POST" },
        );
        toast.success(`${row.full_name} subscribed`);
      }
      load();
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Faculty</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total.toLocaleString()} rows total
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
            placeholder="Name, email, department…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          {(Object.keys(FILTER_LABEL) as Filter[]).map((k) => (
            <option key={k} value={k}>
              {FILTER_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      {data === null ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.rows.length === 0 ? (
        <p className="text-muted-foreground">No faculty match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2 text-right">Papers</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.faculty_id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">
                    {r.full_name}
                    {r.role === "admin" && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        admin
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.email ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.department ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.paper_count}
                  </td>
                  <td className="px-3 py-2">
                    {r.is_subscribed ? (
                      <Badge>Subscribed</Badge>
                    ) : (
                      <Badge variant="secondary">—</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant={r.is_subscribed ? "outline" : "default"}
                      onClick={() => toggleSubscribe(r)}
                      disabled={pendingId === r.faculty_id}
                    >
                      {pendingId === r.faculty_id
                        ? "…"
                        : r.is_subscribed
                          ? "Unsubscribe"
                          : "Subscribe"}
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

      <p className="mt-6 text-xs text-muted-foreground">
        Tip: subscribe from here skips the confirmation email — useful for
        seeding new admin-onboarded faculty. Use{" "}
        <Link href="/signup" className="underline">
          /signup
        </Link>{" "}
        for normal opt-in flow.
      </p>
    </main>
  );
}
