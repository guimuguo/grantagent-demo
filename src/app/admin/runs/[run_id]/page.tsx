import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoRunIds } from "@/demo/mock";
import { apiSSR, type ApiError } from "@/lib/api";

type RunDetail = {
  run_id: string;
  agent_name: string;
  input_ref_type: string;
  input_ref_id: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  tool_calls_made: number;
  step_budget_hit: boolean;
  transcript: unknown;
  output: unknown;
  error: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
};

type Params = Promise<{ run_id: string }>;

// Static export: one page per fixture agent run.
export const dynamicParams = false;
export function generateStaticParams() {
  return demoRunIds().map((run_id) => ({ run_id }));
}

export default async function RunDetailPage({ params }: { params: Params }) {
  const { run_id } = await params;

  let run: RunDetail;
  try {
    run = await apiSSR<RunDetail>(`/api/admin/runs/${run_id}`);
  } catch (err) {
    if ((err as ApiError).status === 404) notFound();
    throw err;
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="mb-4">
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/runs">← All runs</Link>
          </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {run.agent_name}
            {run.error && (
              <Badge variant="destructive" className="ml-2 align-middle">
                error
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {run.model ?? "—"} · {run.input_ref_type}:
            <span className="font-mono">{run.input_ref_id ?? "—"}</span> ·{" "}
            {new Date(run.started_at).toLocaleString()}
            {run.finished_at && (
              <> → {new Date(run.finished_at).toLocaleString()}</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-4 sm:grid-cols-4">
          <Stat label="Duration" value={run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—"} />
          <Stat label="Tool calls" value={String(run.tool_calls_made)} />
          <Stat label="Input tokens" value={(run.input_tokens ?? 0).toLocaleString()} />
          <Stat label="Output tokens" value={(run.output_tokens ?? 0).toLocaleString()} />
        </div>

        {run.error && (
          <Section title="Error">
            <pre className="overflow-x-auto rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {run.error}
            </pre>
          </Section>
        )}

        {run.output !== null && run.output !== undefined && (
          <Section title="Output">
            <pre className="overflow-x-auto rounded bg-muted/40 px-3 py-2 text-xs">
              {JSON.stringify(run.output, null, 2)}
            </pre>
          </Section>
        )}

        <Section title="Transcript">
          <pre className="max-h-[60vh] overflow-x-auto overflow-y-auto rounded bg-muted/40 px-3 py-2 text-xs">
            {JSON.stringify(run.transcript, null, 2)}
          </pre>
        </Section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
