"use client";

import { toast } from "sonner";

import { resetDemoState } from "@/demo/mock";

/** Thin strip on every page so nobody mistakes the demo for the live service. */
export function DemoBanner() {
  return (
    <div className="border-b border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-1.5 text-xs">
        <span>
          <strong>Interactive demo.</strong> Shown from the perspective of
          Guimu Guo (real profile and publications); opportunities are real
          grants.gov listings; all other people are fictional. Nothing you do
          here is sent anywhere.
        </span>
        <button
          type="button"
          className="underline underline-offset-2 hover:no-underline"
          onClick={() => {
            resetDemoState();
            toast.success("Demo data reset");
            setTimeout(() => window.location.reload(), 400);
          }}
        >
          Reset demo data
        </button>
      </div>
    </div>
  );
}
