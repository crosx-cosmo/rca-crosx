import { createClient } from "@supabase/supabase-js";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase";
import { assertSafeUrl } from "./trace-ssrf.server";

export function shortLinkDb() {
  const key = SUPABASE_PUBLISHABLE_KEY;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Validates a destination before storing or redirecting. Returns an error message or null. */
export async function validateDestination(raw: string, selfHost?: string): Promise<string | null> {
  if (raw.length > 2048) return "URL is too long (max 2048 characters).";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Enter a full URL starting with http:// or https://.";
  }
  if (url.username || url.password) return "URLs with embedded credentials are not allowed.";
  if (selfHost && url.host.toLowerCase() === selfHost.toLowerCase() && url.pathname.startsWith("/s/")) {
    return "A short link cannot point to another short link on this site.";
  }
  const verdict = await assertSafeUrl(url.toString());
  return verdict.ok ? null : (verdict.reason ?? "This destination is not allowed.");
}
