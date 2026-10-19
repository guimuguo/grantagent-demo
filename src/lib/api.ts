/**
 * Demo build: same signatures as the real app's fetch wrapper, but every
 * call is answered in-process by `src/demo/mock.ts` — there is no
 * backend behind the static GitHub Pages site.
 */

import { mockApi } from "@/demo/mock";

export type ApiError = {
  ok: false;
  status: number;
  detail: string;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return mockApi<T>(path, init);
}

/** Server-component helper — at build time this renders from fixtures. */
export async function apiSSR<T>(path: string, init?: RequestInit): Promise<T> {
  return mockApi<T>(path, init);
}
