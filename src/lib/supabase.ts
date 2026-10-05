/**
 * Supabase client using the publishable key from the project environment.
 * Data stays protected by Row Level Security and security-definer functions.
 */
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ??
  (typeof process !== "undefined" ? process.env["SUPABASE_URL"] : undefined) ??
  "";
export const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
  (typeof process !== "undefined" ? process.env["SUPABASE_PUBLISHABLE_KEY"] : undefined) ??
  "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
