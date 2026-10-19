"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api, type ApiError } from "@/lib/api";

export function SaveToggle({
  opportunityId,
  initiallySaved,
}: {
  opportunityId: string;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);

  // Demo: the page is pre-rendered, so read this visitor's saved state.
  useEffect(() => {
    api<{ is_saved?: boolean }>(`/api/opportunities/${opportunityId}`)
      .then((o) => setSaved(Boolean(o.is_saved)))
      .catch(() => {});
  }, [opportunityId]);

  async function toggle() {
    setPending(true);
    try {
      if (saved) {
        await api(`/api/opportunities/${opportunityId}/save`, {
          method: "DELETE",
        });
        setSaved(false);
      } else {
        await api(`/api/opportunities/${opportunityId}/save`, {
          method: "POST",
        });
        setSaved(true);
      }
    } catch (err) {
      toast.error((err as ApiError).detail ?? "Couldn't update");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant={saved ? "default" : "outline"}
      onClick={toggle}
      disabled={pending}
    >
      {saved ? "🔖 Saved" : "🔖 Save"}
    </Button>
  );
}
