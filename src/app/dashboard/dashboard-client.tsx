"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { api, type ApiError } from "@/lib/api";
import type { Session } from "@/lib/auth";
import type { Match, OpportunityRow } from "@/lib/types";

const DEFAULT_MIN_SCORE = 0.3;

function fmtDeadline(d: string | null): string {
  if (!d) return "rolling";
  return d;
}

function fmtWeeksAgo(week_of: string): string {
  const wd = new Date(week_of + "T00:00:00");
  const days = Math.floor((Date.now() - wd.getTime()) / 86_400_000);
  const weeks = Math.floor(days / 7);
  if (weeks <= 0) return "matched this week";
  return `matched ${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

export function DashboardClient({ session }: { session: Session }) {
  const [minScore, setMinScore] = useState(DEFAULT_MIN_SCORE);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [saved, setSaved] = useState<OpportunityRow[] | null>(null);
  const [popular, setPopular] = useState<OpportunityRow[] | null>(null);

  const fetchMatches = useCallback(async (score: number) => {
    try {
      const data = await api<Match[]>(
        `/api/matches?min_score=${score}&weeks_back=12`,
      );
      setMatches(data);
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't load matches");
    }
  }, []);

  const fetchSaved = useCallback(async () => {
    try {
      setSaved(await api<OpportunityRow[]>("/api/opportunities/saved"));
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't load saved");
    }
  }, []);

  const fetchPopular = useCallback(async () => {
    try {
      setPopular(await api<OpportunityRow[]>("/api/opportunities/popular"));
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't load popular");
    }
  }, []);

  useEffect(() => {
    fetchMatches(minScore);
  }, [minScore, fetchMatches]);

  useEffect(() => {
    fetchSaved();
    fetchPopular();
  }, [fetchSaved, fetchPopular]);

  async function setFeedback(
    matchId: string,
    next: Match["feedback"],
    currentFeedback: Match["feedback"],
  ) {
    const willClear = next === currentFeedback;
    const finalValue = willClear ? null : next;
    try {
      await api(`/api/matches/${matchId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ feedback: finalValue }),
      });
      setMatches((prev) =>
        prev
          ? prev.map((m) =>
              m.match_id === matchId ? { ...m, feedback: finalValue } : m,
            )
          : prev,
      );
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't update feedback");
    }
  }

  async function toggleSave(match: Match) {
    const currentlySaved = match.feedback === "saved";
    try {
      if (currentlySaved) {
        await api(`/api/opportunities/${match.opportunity_id}/save`, {
          method: "DELETE",
        });
        await api(`/api/matches/${match.match_id}/feedback`, {
          method: "POST",
          body: JSON.stringify({ feedback: null }),
        });
        setMatches((prev) =>
          prev
            ? prev.map((m) =>
                m.match_id === match.match_id ? { ...m, feedback: null } : m,
              )
            : prev,
        );
      } else {
        await api(`/api/opportunities/${match.opportunity_id}/save`, {
          method: "POST",
        });
        await api(`/api/matches/${match.match_id}/feedback`, {
          method: "POST",
          body: JSON.stringify({ feedback: "saved" }),
        });
        setMatches((prev) =>
          prev
            ? prev.map((m) =>
                m.match_id === match.match_id ? { ...m, feedback: "saved" } : m,
              )
            : prev,
        );
      }
      fetchSaved();
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't save");
    }
  }

  async function unsaveFromSavedList(opportunityId: string) {
    try {
      await api(`/api/opportunities/${opportunityId}/save`, {
        method: "DELETE",
      });
      setSaved((prev) =>
        prev ? prev.filter((o) => o.opportunity_id !== opportunityId) : prev,
      );
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't unsave");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi {session.full_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {matches?.length ?? "—"} matches above{" "}
          <span className="font-mono">{minScore.toFixed(2)}</span> from the past
          12 weeks.{" "}
          {matches && (
            <span>
              ({matches.filter((m) => m.is_primary).length} would be in your
              weekly email.)
            </span>
          )}
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Minimum match score</CardTitle>
          <CardDescription>
            Final score = 0.1 × text similarity + 0.9 × LLM fit. Email only ships
            matches above the default 0.30 — slide lower to browse possibilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Slider
            value={[minScore]}
            min={0.05}
            max={0.8}
            step={0.05}
            onValueChange={(v) => setMinScore(v[0])}
            className="max-w-md"
          />
          <p className="mt-3 font-mono text-sm">{minScore.toFixed(2)}</p>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Your matches</h2>
      <MatchesList
        matches={matches}
        onFeedback={setFeedback}
        onToggleSave={toggleSave}
      />

      <Separator className="my-10" />

      <h2 className="mb-4 text-lg font-semibold">
        Popular at {session.institution_name} this week
      </h2>
      <PopularSection items={popular} />

      <Separator className="my-10" />

      <h2 className="mb-4 text-lg font-semibold">Your saved opportunities</h2>
      <SavedSection items={saved} onUnsave={unsaveFromSavedList} />
    </main>
  );
}

function MatchesList({
  matches,
  onFeedback,
  onToggleSave,
}: {
  matches: Match[] | null;
  onFeedback: (
    matchId: string,
    next: Match["feedback"],
    current: Match["feedback"],
  ) => void;
  onToggleSave: (m: Match) => void;
}) {
  if (matches === null) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (matches.length === 0) {
    return (
      <p className="text-muted-foreground">
        No matches in this range. Lower the slider above.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <Card key={m.match_id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {m.is_primary && <Badge variant="default">Email</Badge>}
                  {!m.is_primary && m.is_collab_candidate && (
                    <Badge variant="secondary">Collab</Badge>
                  )}
                  <CardTitle className="text-base leading-tight">
                    {m.url ? (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {m.title}
                      </a>
                    ) : (
                      m.title
                    )}
                  </CardTitle>
                </div>
                <CardDescription className="mt-1">
                  {m.agency ?? "—"} · Deadline: {fmtDeadline(m.deadline)} ·
                  score {(m.score ?? 0).toFixed(2)} · {fmtWeeksAgo(m.week_of)}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={m.feedback === "interested" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFeedback(m.match_id, "interested", m.feedback)}
                  title="Click again to clear"
                >
                  👍 Interested {m.feedback === "interested" && "✓"}
                </Button>
                <Button
                  variant={m.feedback === "saved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToggleSave(m)}
                  title="Click again to unsave"
                >
                  🔖 Save {m.feedback === "saved" && "✓"}
                </Button>
                <Button
                  variant={m.feedback === "not_relevant" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    onFeedback(m.match_id, "not_relevant", m.feedback)
                  }
                  title="Click again to clear"
                >
                  🚫 Not relevant {m.feedback === "not_relevant" && "✓"}
                </Button>
              </div>
            </div>
          </CardHeader>
          {m.rationale && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground italic">
                {m.rationale}
              </p>
              <Link
                className="mt-2 inline-block text-xs underline"
                href={`/opportunities/${m.opportunity_id}`}
              >
                View full opportunity →
              </Link>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function PopularSection({ items }: { items: OpportunityRow[] | null }) {
  if (items === null) return <p className="text-muted-foreground">Loading…</p>;
  if (items.length === 0)
    return (
      <p className="text-muted-foreground">
        Nothing yet — needs at least one institution-wide match this week.
      </p>
    );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((o) => (
        <Card key={o.opportunity_id}>
          <CardHeader>
            <CardTitle className="text-base leading-tight">
              <Link
                href={`/opportunities/${o.opportunity_id}`}
                className="hover:underline"
              >
                {o.title}
              </Link>
            </CardTitle>
            <CardDescription>
              {o.agency ?? "—"} · matched {o.n_matched} colleague(s) · deadline{" "}
              {fmtDeadline(o.deadline)}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function SavedSection({
  items,
  onUnsave,
}: {
  items: OpportunityRow[] | null;
  onUnsave: (opportunityId: string) => void;
}) {
  if (items === null) return <p className="text-muted-foreground">Loading…</p>;
  if (items.length === 0)
    return (
      <p className="text-muted-foreground">
        Save matches above with the 🔖 button to keep them here.
      </p>
    );
  return (
    <div className="space-y-3">
      {items.map((o) => (
        <Card key={o.opportunity_id}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base leading-tight">
                  <Link
                    href={`/opportunities/${o.opportunity_id}`}
                    className="hover:underline"
                  >
                    {o.title}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {o.agency ?? "—"} · deadline {fmtDeadline(o.deadline)}
                  {o.days_until_deadline !== null &&
                    o.days_until_deadline !== undefined &&
                    ` (${o.days_until_deadline}d)`}
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUnsave(o.opportunity_id)}
              >
                Remove
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
