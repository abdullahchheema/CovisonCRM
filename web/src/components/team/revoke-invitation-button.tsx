"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const [isRevoking, setIsRevoking] = useState(false);
  const router = useRouter();

  const handleRevoke = async () => {
    setIsRevoking(true);
    const supabase = createClient();
    // organization_invitations_update's RLS policy has the owner/admin role
    // check in USING, not just WITH CHECK (same pattern verified against
    // real Postgres for organizations_update. A mismatched USING clause
    // means "0 rows updated", not an error). This path is currently
    // unreachable from a non-admin anyway, since they can't SELECT pending
    // invitations to see a Revoke button at all, but .select().single()
    // here is what would actually surface a rejection if that ever changes,
    // rather than a silent no-op wearing a success toast.
    const { error } = await supabase
      .from("organization_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", invitationId)
      .select()
      .single();
    setIsRevoking(false);

    if (error) {
      toast.error(
        error.code === "PGRST116"
          ? "Only workspace owners and admins can revoke invitations."
          : error.message,
      );
      return;
    }

    toast.success("Invitation revoked");
    router.refresh();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRevoke} disabled={isRevoking}>
      {isRevoking ? "Revoking..." : "Revoke"}
    </Button>
  );
}
