import Link from "next/link";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { requireAdmin } from "@/lib/auth";

const ADMIN_NAV = [
  { href: "/admin/faculty", label: "Faculty" },
  { href: "/admin/opportunities", label: "Opportunities" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/reviews", label: "Review queue" },
  { href: "/admin/runs", label: "Agent runs" },
  { href: "/admin/stats", label: "Stats" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={session} />
      <div className="mx-auto w-full max-w-6xl px-6 pt-3">
        <nav className="-mx-2 flex flex-wrap gap-1 border-b pb-2 text-sm">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
