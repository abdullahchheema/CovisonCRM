import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvitationClient } from "@/components/team/accept-invitation-client";

// Deliberately does NOT use requireOrgContext() — that redirects to
// /onboarding when the signed-in user has no active org yet, which is
// exactly the normal state for someone who just followed an invite link
// and hasn't accepted it yet.
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    // proxy.ts already redirects unauthenticated visits here with ?next
    // preserved — this check is defense-in-depth (don't rely on proxy.ts
    // alone, per the note in lib/supabase/proxy.ts), not the primary gate.
    redirect(`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  return <AcceptInvitationClient token={token} />;
}
