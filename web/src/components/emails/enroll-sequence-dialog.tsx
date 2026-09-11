"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface SequenceOption {
  id: string;
  name: string;
}

interface Recipient {
  id: string;
  name: string;
}

interface EnrollSequenceDialogProps {
  sequences: SequenceOption[];
  recipients: Recipient[];
  trigger: React.ReactNode;
}

export function EnrollSequenceDialog({ sequences, recipients, trigger }: EnrollSequenceDialogProps) {
  const [open, setOpen] = useState(false);
  const [sequenceId, setSequenceId] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (!sequenceId || recipients.length === 0) return;
    setIsEnrolling(true);
    const supabase = createClient();

    let enrolled = 0;
    let skipped = 0;
    for (const recipient of recipients) {
      const { error } = await supabase.rpc("enroll_contact_in_sequence", {
        p_sequence_id: sequenceId,
        p_contact_id: recipient.id,
      });
      // A unique-active-enrollment conflict (already enrolled in this
      // sequence) is the expected, common reason this fails for one
      // contact in a bulk selection, not worth surfacing per-contact.
      if (error) skipped += 1;
      else enrolled += 1;
    }

    setIsEnrolling(false);

    if (enrolled > 0) {
      toast.success(
        `Enrolled ${enrolled} contact${enrolled === 1 ? "" : "s"}` +
          (skipped > 0 ? `, ${skipped} already enrolled` : "") +
          ".",
      );
    } else {
      toast.error("Already enrolled in this sequence.");
    }
    setOpen(false);
    setSequenceId("");
    router.refresh();
  };

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) setSequenceId("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to follow-up sequence</DialogTitle>
          <DialogDescription>
            {recipients.length === 1 ? `For ${recipients[0].name}` : `For ${recipients.length} contacts`}
          </DialogDescription>
        </DialogHeader>

        {sequences.length === 0 ? (
          <p className="text-sm text-text-2">
            No follow-up sequences yet. Create one under Emails → Follow-ups first.
          </p>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="sequence">Sequence</Label>
            <Select id="sequence" value={sequenceId} onChange={(e) => setSequenceId(e.target.value)}>
              <option value="">Select a sequence...</option>
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={isEnrolling || !sequenceId || recipients.length === 0}>
            {isEnrolling ? "Enrolling..." : `Enroll ${recipients.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
