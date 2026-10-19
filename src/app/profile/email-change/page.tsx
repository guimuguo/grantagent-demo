"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, type ApiError } from "@/lib/api";

export default function EmailChangeConfirmPage() {
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
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [info, setInfo] = useState<{ name?: string; new_email?: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setError("This link is missing its token.");
      return;
    }
    (async () => {
      try {
        const res = await api<{ name: string; new_email: string }>(
          `/api/auth/email-change/confirm?token=${encodeURIComponent(token)}`,
        );
        setInfo(res);
        setStatus("ok");
      } catch (err) {
        setError((err as ApiError).detail ?? "Confirmation failed");
        setStatus("err");
      }
    })();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      {status === "loading" && (
        <p className="text-muted-foreground">Updating your email…</p>
      )}
      {status === "ok" && info && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email updated</CardTitle>
            <CardDescription>
              {info.name ? `Hi ${info.name}! ` : ""}Your account email is now{" "}
              <span className="font-medium text-foreground">
                {info.new_email}
              </span>
              . Use this address to log in from now on.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
      {status === "err" && (
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Email change failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
