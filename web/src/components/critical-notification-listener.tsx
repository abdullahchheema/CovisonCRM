"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CovisonMark } from "@/components/brand/covison-mark";
import { createClient } from "@/lib/supabase/client";

interface CriticalNotification {
  type: string;
  title: string;
}

// Live, interrupt-immediately notices, not the polling bell's kind (an
// assignment can wait until the bell is next opened; being removed from
// the workspace you're actively working in can't, since every request
// you make from here is about to start failing).
//
// Subscribes to the existing notifications table (RLS: user_id =
// auth.uid(), not tied to org membership, see migration
// 20260911000005's comment for why that matters here specifically),
// filtered to this user. Currently handles one type,
// "removed_from_org"; adding another interrupt-worthy event elsewhere in
// the app means inserting a notifications row with a new `type` and a
// case here, not new realtime plumbing.
export function CriticalNotificationListener({ userId }: { userId: string }) {
  const [notification, setNotification] = useState<CriticalNotification | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`critical-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { type: string; title: string };
          if (row.type === "removed_from_org") {
            setNotification({ type: row.type, title: row.title });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleAcknowledge = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <Dialog open={notification !== null}>
      <DialogContent
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <CovisonMark className="mb-2 size-10" />
          <DialogTitle>{notification?.title}</DialogTitle>
          <DialogDescription>
            An admin removed you from this workspace. You&apos;ll need a new
            invite to get back in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleAcknowledge} disabled={isSigningOut} className="w-full">
            {isSigningOut ? "Signing out..." : "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
