"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

interface EmailGroupContactsDialogProps {
  groupId: string;
  organizationId: string;
  allContacts: { id: string; name: string }[];
  memberContactIds: string[];
}

export function EmailGroupContactsDialog({
  groupId,
  organizationId,
  allContacts,
  memberContactIds,
}: EmailGroupContactsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(memberContactIds));
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const toggle = (contactId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();

    const originalSet = new Set(memberContactIds);
    const toAdd = [...selected].filter((id) => !originalSet.has(id));
    const toRemove = memberContactIds.filter((id) => !selected.has(id));

    if (toAdd.length > 0) {
      const { error } = await supabase.from("email_group_contacts").insert(
        toAdd.map((contactId) => ({
          group_id: groupId,
          contact_id: contactId,
          organization_id: organizationId,
        })),
      );
      if (error) {
        toast.error(error.message);
        setIsSaving(false);
        return;
      }
    }

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("email_group_contacts")
        .delete()
        .eq("group_id", groupId)
        .in("contact_id", toRemove);
      if (error) {
        toast.error(error.message);
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSelected(new Set(memberContactIds));
      }}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Users /> Manage contacts
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage contacts</DialogTitle>
        </DialogHeader>
        {allContacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contacts in this workspace yet.</p>
        ) : (
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {allContacts.map((contact) => (
              <label
                key={contact.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.has(contact.id)}
                  onChange={() => toggle(contact.id)}
                  className="size-4"
                />
                <span className="text-sm text-foreground">{contact.name}</span>
              </label>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
