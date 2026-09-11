"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BrandSpinner } from "@/components/brand/brand-spinner";
import { createClient } from "@/lib/supabase/client";

export function StopEnrollmentButton({ enrollmentId }: { enrollmentId: string }) {
  const [isMutating, setIsMutating] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const router = useRouter();

  const handleStop = async () => {
    setIsMutating(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("stop_enrollment", { p_enrollment_id: enrollmentId });
    setIsMutating(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Follow-up stopped");
    startTransition(() => {
      router.refresh();
    });
  };

  const busy = isMutating || isRefreshing;

  return (
    <Button variant="outline" size="sm" onClick={handleStop} disabled={busy}>
      {busy ? <BrandSpinner className="size-4" /> : "Stop"}
    </Button>
  );
}
