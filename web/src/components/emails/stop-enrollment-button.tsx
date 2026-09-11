"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function StopEnrollmentButton({ enrollmentId }: { enrollmentId: string }) {
  const [isStopping, setIsStopping] = useState(false);
  const router = useRouter();

  const handleStop = async () => {
    setIsStopping(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("stop_enrollment", { p_enrollment_id: enrollmentId });
    setIsStopping(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Follow-up stopped");
    router.refresh();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleStop} disabled={isStopping}>
      {isStopping ? "Stopping..." : "Stop"}
    </Button>
  );
}
