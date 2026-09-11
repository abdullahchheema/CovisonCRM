import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Bypasses RLS entirely. ONLY for server-only code with no signed-in user
// to act as, the daily follow-up cron is the one legitimate case in this
// app: there's no request, no cookies, no auth.uid() for RLS to check
// against. Never import this from a Client Component or a code path that
// also handles user input without its own explicit organization_id checks.
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
