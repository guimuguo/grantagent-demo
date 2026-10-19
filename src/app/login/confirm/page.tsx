"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, type ApiError } from "@/lib/api";

/**
 * Magic-link landing. The crucial constraint: cookies set by FastAPI
 * only stick to the user's browser if the response Set-Cookie reaches
 * the browser — which happens automatically when this client component
 * does the fetch (the Next.js rewrite forwards Set-Cookie unchanged).
 * Don't move this to a server component without a route handler in
 * between.
 *
 * Wrapped in Suspense because useSearchParams() forces prerender bailout.
 */
export default function LoginConfirmPage() {
  return (
    <Suspense fallback={<Pending />}>
      <Inner />
    </Suspense>
  );
}

function Pending() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-muted-foreground">Signing you in…</p>
    </main>
  );
}

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("This link is missing its token.");
      return;
    }
    (async () => {
      try {
        await api(
          `/api/auth/login/confirm?token=${encodeURIComponent(token)}`,
        );
        router.replace("/dashboard");
      } catch (err) {
        setError((err as ApiError).detail ?? "Login failed");
      }
    })();
  }, [token, router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Login link couldn&apos;t be used</AlertTitle>
          <AlertDescription>
            {error}.{" "}
            <Link href="/login" className="underline">
              Request a new one
            </Link>
            .
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-muted-foreground">Signing you in…</p>
    </main>
  );
}
