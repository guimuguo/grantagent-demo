"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, type ApiError } from "@/lib/api";

export default function SignupConfirmPage() {
  // useSearchParams must be inside Suspense so static prerender doesn't bail.
  return (
    <Suspense fallback={<Pending />}>
      <Inner />
    </Suspense>
  );
}

function Pending() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-muted-foreground">Loading…</p>
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
          `/api/auth/signup/confirm?token=${encodeURIComponent(token)}`,
        );
        router.replace("/dashboard");
      } catch (err) {
        setError((err as ApiError).detail ?? "Confirmation failed");
      }
    })();
  }, [token, router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Confirmation link couldn&apos;t be used</AlertTitle>
          <AlertDescription>
            {error}.{" "}
            <Link href="/signup" className="underline">
              Sign up again
            </Link>
            .
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-muted-foreground">
        Confirming your subscription and signing you in…
      </p>
    </main>
  );
}
