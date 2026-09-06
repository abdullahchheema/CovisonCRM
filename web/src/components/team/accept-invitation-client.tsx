"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function AcceptInvitationClient({ token }: { token: string }) {
  const [status, setStatus] = useState<"pending" | "error">("pending");
  const [message, setMessage] = useState("Accepting your invitation...");
  const router = useRouter();
  // Effects can run twice in development (React Strict Mode). Accepting
  // twice would just be a harmless no-op RPC call, but this avoids the
  // double network round-trip and duplicate state updates regardless.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const accept = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("accept_invitation", {
        raw_token: token,
      });

      if (error || !data) {
        setStatus("error");
        setMessage(
          error?.message ??
            "This invitation link is invalid, expired, or was issued to a different email address.",
        );
        return;
      }

      // The RPC updated profiles.active_organization_id, but this client's
      // session token still carries the old (or absent) org claim until
      // refreshed, same requirement as the onboarding create-workspace flow.
      await supabase.auth.refreshSession();
      router.push("/dashboard");
      router.refresh();
    };

    accept();
  }, [token, router]);

  // The centred/branded frame lives on the page (AuthShell), so this
  // renders just the card.
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-h3">
          {status === "error" ? "Couldn't accept invitation" : "Joining workspace"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-2">{message}</p>
      </CardContent>
    </Card>
  );
}
