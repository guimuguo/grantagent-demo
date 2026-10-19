import { SiteHeader } from "@/components/site-header";
import { requireSession } from "@/lib/auth";

import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await requireSession();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={session} />
      <DashboardClient session={session} />
    </div>
  );
}
