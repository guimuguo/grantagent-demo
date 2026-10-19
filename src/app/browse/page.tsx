import { SiteHeader } from "@/components/site-header";
import { requireSession } from "@/lib/auth";

import { BrowseClient } from "./browse-client";

export default async function BrowsePage() {
  const session = await requireSession();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={session} />
      <BrowseClient />
    </div>
  );
}
