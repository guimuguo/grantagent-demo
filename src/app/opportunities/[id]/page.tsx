import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { apiSSR, type ApiError } from "@/lib/api";
import { demoOpportunityIds } from "@/demo/mock";
import { requireSession } from "@/lib/auth";
import type { OpportunityRow } from "@/lib/types";

import { SaveToggle } from "./save-toggle";

type Params = Promise<{ id: string }>;

// Static export: one page per fixture opportunity.
export const dynamicParams = false;
export function generateStaticParams() {
  return demoOpportunityIds().map((id) => ({ id }));
}

function fmtMoney(v: number | null): string {
  if (v == null) return "—";
  return `$${v.toLocaleString()}`;
}

export default async function OpportunityDetail({
  params,
}: {
  params: Params;
}) {
  const session = await requireSession();
  const { id } = await params;

  let opp: OpportunityRow;
  try {
    opp = await apiSSR<OpportunityRow>(`/api/opportunities/${id}`);
  } catch (err) {
    if ((err as ApiError).status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {opp.title}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {opp.agency ?? "—"}
              {opp.program ? ` · ${opp.program}` : ""}
            </p>
          </div>
          <SaveToggle
            opportunityId={opp.opportunity_id}
            initiallySaved={opp.is_saved ?? false}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-card p-4 sm:grid-cols-3">
          <Stat label="Deadline" value={opp.deadline ?? "rolling"} />
          <Stat
            label="Award range"
            value={`${fmtMoney(opp.award_floor ?? null)} – ${fmtMoney(opp.award_ceiling ?? null)}`}
          />
          <Stat
            label="First seen"
            value={
              opp.first_seen_at
                ? new Date(opp.first_seen_at).toLocaleDateString()
                : "—"
            }
          />
        </div>

        {opp.url && (
          <p className="mt-4 text-sm">
            <a
              className="underline"
              href={opp.url}
              target="_blank"
              rel="noreferrer"
            >
              Open on agency site →
            </a>
          </p>
        )}

        <Section title="Summary" body={opp.summary} />
        <Section title="Eligibility" body={opp.eligibility} />
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string | null | undefined }) {
  if (!body) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
        {body}
      </div>
    </section>
  );
}
