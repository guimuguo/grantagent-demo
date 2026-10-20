import fixtures from "@/demo/fixtures.json";

export type Session = {
  faculty_id: string;
  full_name: string;
  email: string;
  role: "faculty" | "admin";
  institution_id: string;
  institution_name: string;
};

/**
 * Demo build: there is exactly one account (Guimu Guo) and every visitor
 * is signed in as it. It has the admin role so the /admin pages are
 * reachable from the header.
 */
const DEMO_SESSION = fixtures.me as Session;

export async function requireSession(): Promise<Session> {
  return DEMO_SESSION;
}

export async function getSession(): Promise<Session | null> {
  return DEMO_SESSION;
}

export async function requireAdmin(): Promise<Session> {
  return DEMO_SESSION;
}
