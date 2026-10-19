import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import fixtures from "@/demo/fixtures.json";

const FACULTY_FEATURES = [
  {
    title: "Weekly matches",
    body: "Every Monday, each faculty member gets the federal opportunities that fit their research, each with a written rationale and a fit verdict.",
    href: "/dashboard",
  },
  {
    title: "Browse & save",
    body: "Search all open opportunities, sorted by how well they match your publication profile, deadline, or award size. Save the ones to come back to.",
    href: "/browse",
  },
  {
    title: "Publication profile",
    body: "Built automatically from OpenAlex. Faculty can remove papers that were misattributed to them, and the profile rebuilds.",
    href: "/profile",
  },
];

const ADMIN_FEATURES = [
  { title: "Faculty roster", body: "Who is subscribed, profile coverage, paper counts.", href: "/admin/faculty" },
  { title: "Match review", body: "Every match the pipeline produced, week by week, with retrieval and LLM scores.", href: "/admin/matches" },
  { title: "Review queue", body: "Ambiguous author identities and suspected misattributed papers, approved or rejected by a human.", href: "/admin/reviews" },
  { title: "Agent runs", body: "Full transcripts of each AI agent's tool calls and verdicts, for auditing.", href: "/admin/runs" },
  { title: "Cost & quality", body: "Weekly LLM spend per agent, match quality, and data-source health.", href: "/admin/stats" },
];

const PIPELINE = [
  ["Ingest", "New federal opportunities are pulled from grants.gov daily, with full synopsis and eligibility."],
  ["Profile", "Each faculty member's research profile is built from their publications (OpenAlex / ORCID)."],
  ["Match", "Semantic retrieval finds candidate opportunities; an LLM reranks them and writes the rationale."],
  ["Agents", "Specialised agents suggest collaborators, propose proposal angles, and flag eligibility risks."],
  ["Deliver", "A weekly email plus this portal, where faculty give feedback that tunes future matches."],
];

export default function Home() {
  const nOpps = fixtures.opportunities.length;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-14 px-6 py-14">
      <section className="flex flex-col items-center gap-5 text-center">
        <Badge variant="secondary">Prototype demo</Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          grantAgent
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Weekly federal funding matches for tenure-track faculty — matched to
          each person&apos;s own publication record, with an explanation of
          why each opportunity fits.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Try the faculty view</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/admin">Open the admin console</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          You are signed in as a fictional faculty member,{" "}
          <span className="font-medium text-foreground">
            {fixtures.me.full_name}
          </span>{" "}
          (Computer Science). The {nOpps} opportunities are real grants.gov
          listings.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">For faculty</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {FACULTY_FEATURES.map((f) => (
            <FeatureCard key={f.href} {...f} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">For research office / admins</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_FEATURES.map((f) => (
            <FeatureCard key={f.href} {...f} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">How it works</h2>
        <ol className="grid gap-3 sm:grid-cols-5">
          {PIPELINE.map(([step, body], i) => (
            <li key={step} className="rounded-lg border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground">
                Step {i + 1}
              </div>
              <div className="mt-1 font-medium">{step}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t pt-8 text-sm text-muted-foreground">
        <span>Also see the sign-up flow:</span>
        <Link href="/signup" className="underline">
          Sign up
        </Link>
        <Link href="/login" className="underline">
          Magic-link login
        </Link>
      </section>
    </main>
  );
}

function FeatureCard({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-colors group-hover:border-foreground/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            {title}
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </CardTitle>
          <CardDescription>{body}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
