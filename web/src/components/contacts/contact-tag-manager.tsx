"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tag as TagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ContactTagManagerProps {
  contactId: string;
  organizationId: string;
  allTags: Tag[];
  assignedTagIds: string[];
}

export function ContactTagManager({
  contactId,
  organizationId,
  allTags,
  assignedTagIds,
}: ContactTagManagerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedTagIds));
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const toggle = (tagId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();

    const originalSet = new Set(assignedTagIds);
    const toAdd = [...selected].filter((id) => !originalSet.has(id));
    const toRemove = assignedTagIds.filter((id) => !selected.has(id));

    if (toAdd.length > 0) {
      const { error } = await supabase.from("contact_tags").insert(
        toAdd.map((tagId) => ({
          contact_id: contactId,
          tag_id: tagId,
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
        .from("contact_tags")
        .delete()
        .eq("contact_id", contactId)
        .in("tag_id", toRemove);
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
        if (next) setSelected(new Set(assignedTagIds));
      }}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <TagIcon /> Manage tags
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
        </DialogHeader>
        {allTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tags in this workspace yet. Create some from the Tags page.
          </p>
        ) : (
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {allTags.map((tag) => (
              <label
                key={tag.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.has(tag.id)}
                  onChange={() => toggle(tag.id)}
                  className="size-4"
                />
                <span className="text-sm text-foreground">{tag.name}</span>
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
