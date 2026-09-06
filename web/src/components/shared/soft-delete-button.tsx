"use client";

import { useState } from "react";
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
  | "lead_types";

interface SoftDeleteButtonProps {
  table: SoftDeletableTable;
  id: string;
  label: string;
  /** Omit to stay on the current page (just refresh) — e.g. deleting a row
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
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();
    // Soft delete — deleted_at, never a hard DELETE — so activity history
    // and any references stay intact rather than cascading destructively.
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() } as Database["public"]["Tables"][typeof table]["Update"])
      .eq("id", id);

    setIsDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${label} deleted`);
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 /> Delete
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
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
