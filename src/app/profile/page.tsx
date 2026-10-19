import { SiteHeader } from "@/components/site-header";
import { apiSSR } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import type { Paper, Profile } from "@/lib/types";

import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const session = await requireSession();
  const [profile, papers] = await Promise.all([
    apiSSR<Profile>("/api/profile"),
    apiSSR<Paper[]>("/api/profile/papers"),
  ]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={session} />
      <ProfileClient
        session={session}
        initialProfile={profile}
        initialPapers={papers}
      />
    </div>
  );
}
