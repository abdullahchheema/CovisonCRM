import { createClient } from "./server";
import { redirect } from "next/navigation";

/**
 * Resolves the signed-in user, their profile, and their active organization
 * for a Server Component, redirecting to the right place if any step is
 * missing. Every page under app/(app)/ calls this rather than trusting
 * proxy.ts alone: a proxy matcher change can silently stop covering a route
 * (see the Next.js Data Security guide note in lib/supabase/proxy.ts), so
 * each protected page re-verifies for itself.
 */
export async function requireOrgContext() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, active_organization_id")
    .eq("id", userId)
    .single();

  if (!profile?.active_organization_id) {
    redirect("/onboarding");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", profile.active_organization_id)
    .single();

  // The profile pointed at an org this user is no longer a member of (RLS
  // hides it) or that no longer exists, either way, back to onboarding
  // rather than crashing on a null org further down the page.
  if (!org) {
    redirect("/onboarding");
  }

  return { supabase, profile, org };
}
