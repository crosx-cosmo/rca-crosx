/**
 * Supabase browser client.
 *
 * The publishable key is designed for public frontend use — data stays
 * protected by Row Level Security policies on the database tables.
 * Never put a service_role key here.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dbklnkkjrpbothpzusvu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tCHrNZDhwYS2wznhn7xi7A_Lq-cCCMR";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
