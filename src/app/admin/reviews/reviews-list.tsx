"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type ApiError } from "@/lib/api";

type Status = "pending" | "approved" | "rejected" | "superseded" | "all";
const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  superseded: "Superseded",
  all: "All",
};

type Review = {
  review_id: string;
  kind: string;
  ref_type: string;
  ref_id: string | null;
  payload: unknown;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  faculty_name: string | null;
  faculty_email: string | null;
};

type Resp = { total: number; rows: Review[] };

export function ReviewsList() {
  const [status, setStatus] = useState<Status>("pending");
  const [data, setData] = useState<Resp | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setData(null);
    try {
      setData(
        await api<Resp>(`/api/admin/reviews?status=${status}&limit=200`),
      );
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Load failed");
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(r: Review, decision: "approved" | "rejected") {
    setPendingId(r.review_id);
    try {
      await api(`/api/admin/reviews/${r.review_id}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          notes: notesById[r.review_id] ?? null,
        }),
      });
      toast.success(`${decision} ✓`);
      setNotesById((prev) => {
        const next = { ...prev };
        delete next[r.review_id];
        return next;
      });
      load();
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total.toLocaleString()} {status}
          </p>
        )}
      </div>

      <div className="mb-4 max-w-xs space-y-1">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Status
        </Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {(Object.keys(STATUS_LABEL) as Status[]).map((k) => (
            <option key={k} value={k}>
              {STATUS_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      {data === null ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.rows.length === 0 ? (
        <p className="text-muted-foreground">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {data.rows.map((r) => (
            <Card key={r.review_id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {r.faculty_name ?? r.ref_id?.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mr-1">
                        {r.kind}
                      </Badge>
                      {r.faculty_email ?? "—"} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      r.status === "pending"
                        ? "default"
                        : r.status === "approved"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <pre className="overflow-x-auto rounded bg-muted/40 px-3 py-2 text-xs">
                  {JSON.stringify(r.payload, null, 2)}
                </pre>
                {r.notes && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    notes: {r.notes}
                  </p>
                )}
                {r.reviewed_by && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    decided by {r.reviewed_by} ·{" "}
                    {r.reviewed_at && new Date(r.reviewed_at).toLocaleString()}
                  </p>
                )}
              </CardContent>
              {r.status === "pending" && (
                <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <Input
                    placeholder="Notes (optional)"
                    value={notesById[r.review_id] ?? ""}
                    onChange={(e) =>
                      setNotesById({
                        ...notesById,
                        [r.review_id]: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => decide(r, "approved")}
                      disabled={pendingId === r.review_id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => decide(r, "rejected")}
                      disabled={pendingId === r.review_id}
                    >
                      Reject
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
