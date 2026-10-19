"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { api, type ApiError } from "@/lib/api";
import type { Session } from "@/lib/auth";
import type { Paper, Profile } from "@/lib/types";

export function ProfileClient({
  session,
  initialProfile,
  initialPapers,
}: {
  session: Session;
  initialProfile: Profile;
  initialPapers: Paper[];
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [papers, setPapers] = useState(initialPapers);
  const [edit, setEdit] = useState({
    full_name: initialProfile.full_name ?? "",
    orcid: initialProfile.orcid ?? "",
    department: initialProfile.department ?? "",
    college: initialProfile.college ?? "",
    rowan_profile_url: initialProfile.rowan_profile_url ?? "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [requestingEmail, setRequestingEmail] = useState(false);
  const [selectedDisown, setSelectedDisown] = useState<Set<string>>(new Set());
  const [disowning, setDisowning] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: edit.full_name,
          orcid: edit.orcid,
          department: edit.department,
          college: edit.college,
          rowan_profile_url: edit.rowan_profile_url,
        }),
      });
      const fresh = await api<Profile>("/api/profile");
      setProfile(fresh);
      toast.success("Profile updated");
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Save failed");
    } finally {
      setSavingEdit(false);
    }
  }

  async function rebuild() {
    setRebuilding(true);
    try {
      await api("/api/profile/rebuild", { method: "POST" });
      const [fresh, freshPapers] = await Promise.all([
        api<Profile>("/api/profile"),
        api<Paper[]>("/api/profile/papers"),
      ]);
      setProfile(fresh);
      setPapers(freshPapers);
      toast.success("Profile rebuilt — papers refreshed");
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Rebuild failed");
    } finally {
      setRebuilding(false);
    }
  }

  async function requestEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setRequestingEmail(true);
    try {
      const res = await api<{ to: string }>("/api/profile/email-change", {
        method: "POST",
        body: JSON.stringify({ new_email: newEmail.trim().toLowerCase() }),
      });
      toast.success(`Confirmation sent to ${res.to}`);
      setNewEmail("");
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't send link");
    } finally {
      setRequestingEmail(false);
    }
  }

  function toggleDisown(workId: string) {
    setSelectedDisown((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) next.delete(workId);
      else next.add(workId);
      return next;
    });
  }

  async function commitDisown() {
    if (selectedDisown.size === 0) return;
    setDisowning(true);
    try {
      await api("/api/profile/disown", {
        method: "POST",
        body: JSON.stringify({ work_ids: Array.from(selectedDisown) }),
      });
      const freshPapers = await api<Paper[]>("/api/profile/papers");
      setPapers(freshPapers);
      setSelectedDisown(new Set());
      toast.success("Papers removed from your profile");
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Disown failed");
    } finally {
      setDisowning(false);
    }
  }

  async function unsubscribe() {
    if (!confirm("Unsubscribe? You will stop receiving weekly emails.")) return;
    setUnsubscribing(true);
    try {
      await api("/api/profile/unsubscribe", { method: "POST" });
      await api("/api/auth/logout", { method: "POST" });
      router.replace("/");
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't unsubscribe");
      setUnsubscribing(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          {session.institution_name} · subscribed:{" "}
          {profile.is_subscribed ? "yes" : "no"} · last profiled:{" "}
          {profile.last_profiled_at
            ? new Date(profile.last_profiled_at).toLocaleDateString()
            : "never"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            Used in matching + downstream emails.
          </CardDescription>
        </CardHeader>
        <form onSubmit={saveEdit}>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" id="full_name">
              <Input
                id="full_name"
                value={edit.full_name}
                onChange={(e) =>
                  setEdit({ ...edit, full_name: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Email">
              <Input value={profile.email} disabled />
            </Field>
            <Field label="ORCID iD" id="orcid">
              <Input
                id="orcid"
                placeholder="0000-0000-0000-0000"
                value={edit.orcid}
                onChange={(e) => setEdit({ ...edit, orcid: e.target.value })}
              />
            </Field>
            <Field label="Department" id="department">
              <Input
                id="department"
                value={edit.department}
                onChange={(e) =>
                  setEdit({ ...edit, department: e.target.value })
                }
              />
            </Field>
            <Field label="College" id="college">
              <Input
                id="college"
                value={edit.college}
                onChange={(e) => setEdit({ ...edit, college: e.target.value })}
              />
            </Field>
            <Field label="Faculty page URL" id="rowan_profile_url">
              <Input
                id="rowan_profile_url"
                value={edit.rowan_profile_url}
                onChange={(e) =>
                  setEdit({ ...edit, rowan_profile_url: e.target.value })
                }
              />
            </Field>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="submit" disabled={savingEdit}>
              {savingEdit ? "Saving…" : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Publications</CardTitle>
          <CardDescription>
            Pulled from OpenAlex. Uncheck anything that isn&apos;t yours, then
            click Remove — it&apos;ll be excluded going forward and the
            embedding will rebuild next time you click Rebuild.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {papers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No papers attached. Click Rebuild to attempt a fresh pull.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {papers.map((p) => (
                <li
                  key={p.openalex_work_id}
                  className="flex items-start gap-3"
                >
                  <input
                    type="checkbox"
                    id={p.openalex_work_id}
                    checked={selectedDisown.has(p.openalex_work_id)}
                    onChange={() => toggleDisown(p.openalex_work_id)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={p.openalex_work_id}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="font-medium">{p.title}</span>
                    <span className="block text-muted-foreground">
                      {p.year ?? "—"} · {p.venue ?? "—"}
                      {p.author_position && (
                        <Badge
                          variant="outline"
                          className="ml-2 align-text-bottom"
                        >
                          {p.author_position}
                        </Badge>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={commitDisown}
            disabled={selectedDisown.size === 0 || disowning}
          >
            {disowning
              ? "Removing…"
              : `Remove ${selectedDisown.size} paper${selectedDisown.size === 1 ? "" : "s"}`}
          </Button>
          <Button onClick={rebuild} disabled={rebuilding}>
            {rebuilding ? "Rebuilding…" : "Rebuild profile"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Change email</CardTitle>
          <CardDescription>
            We send a confirmation to the NEW address. You stay logged in.
          </CardDescription>
        </CardHeader>
        <form onSubmit={requestEmailChange}>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="new_email">New university email</Label>
              <Input
                id="new_email"
                type="email"
                placeholder="you@university.edu"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={requestingEmail || !newEmail}>
              {requestingEmail ? "Sending…" : "Send confirmation"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator className="my-10" />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>
            Stops weekly emails. Your publication profile stays so colleagues
            can still find you for collaborations unless you opt out in
            Identity.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          <Button
            variant="destructive"
            onClick={unsubscribe}
            disabled={unsubscribing || !profile.is_subscribed}
          >
            {unsubscribing
              ? "Unsubscribing…"
              : profile.is_subscribed
                ? "Unsubscribe"
                : "Already unsubscribed"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
