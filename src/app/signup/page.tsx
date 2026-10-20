"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type ApiError } from "@/lib/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [orcid, setOrcid] = useState("");
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await api<{ to: string; already_subscribed?: boolean }>(
        "/api/auth/signup/request",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            full_name: fullName.trim(),
            orcid: orcid.trim() || null,
          }),
        },
      );
      if (res.already_subscribed) {
        toast.info(
          "That email is already subscribed — we sent you a login link instead.",
        );
      }
      setSentTo(res.to ?? email);
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Sign-up failed");
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your inbox</CardTitle>
            <CardDescription>
              We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{sentTo}</span>.
              Click it to finish signing up. The link is good for 7 days.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/confirm/?token=demo">
                Demo: open the confirmation link
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>
            GrantAgent is currently open to faculty at participating .edu
            institutions.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">University email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orcid">
                ORCID iD <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="orcid"
                placeholder="0000-0000-0000-0000"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
              />
            </div>
            <Alert>
              <AlertTitle>What happens next</AlertTitle>
              <AlertDescription>
                We&apos;ll build a publication profile from OpenAlex and send a
                confirmation email. You won&apos;t receive matches until you
                click that link.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={pending || !email || !fullName}
              className="w-full"
            >
              {pending ? "Building your profile…" : "Send confirmation"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already signed up?{" "}
              <Link href="/login" className="underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
