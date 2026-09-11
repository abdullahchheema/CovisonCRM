"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BrandSpinner } from "@/components/brand/brand-spinner";
import { createClient } from "@/lib/supabase/client";

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const [isMutating, setIsMutating] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const router = useRouter();

  const handleRevoke = async () => {
    setIsMutating(true);
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
    setIsMutating(false);

    if (error) {
      toast.error(
        error.code === "PGRST116"
          ? "Only workspace owners and admins can revoke invitations."
          : error.message,
      );
      return;
    }

    toast.success("Invitation revoked");
    // startTransition, not a plain call: keeps isPending true for the
    // whole refetch-and-rerender, not just the mutation above, so the
    // button stays in its busy state right up until the row is actually
    // gone, instead of resetting to normal while the stale row still sits
    // there for another moment.
    startTransition(() => {
      router.refresh();
    });
  };

  const busy = isMutating || isRefreshing;

  return (
    <Button variant="outline" size="sm" onClick={handleRevoke} disabled={busy}>
      {busy ? <BrandSpinner className="size-4" /> : "Revoke"}
    </Button>
  );
}
