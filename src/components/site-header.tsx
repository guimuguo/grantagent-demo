"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Session } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/browse", label: "Browse" },
  { href: "/profile", label: "Profile" },
];

const ADMIN_NAV = [{ href: "/admin", label: "Admin" }];

export function SiteHeader({ session }: { session: Session }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.replace("/");
    } catch {
      toast.error("Couldn't sign out — try refreshing.");
      setSigningOut(false);
    }
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            grantAgent
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {session.role === "admin" &&
              ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-medium hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.full_name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </div>
    </header>
  );
}
