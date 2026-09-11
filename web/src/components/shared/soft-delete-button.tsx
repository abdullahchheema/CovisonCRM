"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BrandSpinner } from "@/components/brand/brand-spinner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type SoftDeletableTable =
  | "contacts"
  | "companies"
  | "deals"
  | "tasks"
  | "tags"
  | "tickets"
  | "projects"
  | "project_todos"
  | "email_groups"
  | "email_templates"
  | "lead_types"
  | "follow_up_sequences";

interface SoftDeleteButtonProps {
  table: SoftDeletableTable;
  id: string;
  label: string;
  /** Omit to stay on the current page (just refresh), e.g. deleting a row
   * from a list rather than deleting the thing the current page is about. */
  redirectTo?: string;
}

export function SoftDeleteButton({
  table,
  id,
  label,
  redirectTo,
}: SoftDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async () => {
    setIsMutating(true);
    const supabase = createClient();
    // Soft delete, deleted_at, never a hard DELETE, so activity history
    // and any references stay intact rather than cascading destructively.
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() } as Database["public"]["Tables"][typeof table]["Update"])
      .eq("id", id);

    setIsMutating(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${label} deleted`);
    setOpen(false);
    // startTransition, not a plain call: keeps isPending true for the
    // whole navigate-and-refetch, not just the mutation above, so the
    // dialog's button stays busy right up until the item is actually gone
    // from the list, instead of resetting to normal while the now-stale
    // row still sits there for another moment.
    startTransition(() => {
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  };

  const busy = isMutating || isRefreshing;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)} disabled={busy}>
        {busy ? <BrandSpinner className="size-4" /> : <Trash2 />} Delete
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {label.toLowerCase()}?</DialogTitle>
          <DialogDescription>
            This removes it from lists and searches. This can&apos;t be
            undone from the app yet.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={busy}>
            {busy ? <BrandSpinner className="size-4" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
