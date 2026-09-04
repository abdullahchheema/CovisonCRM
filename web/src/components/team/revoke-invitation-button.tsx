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
    const { error } = await supabase
      .from("organization_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", invitationId);
    setIsRevoking(false);

    if (error) {
      toast.error(error.message);
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
