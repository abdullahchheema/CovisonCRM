"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface AddNoteFormProps {
  organizationId: string;
  parent:
    | { contact_id: string }
    | { company_id: string }
    | { deal_id: string }
    | { ticket_id: string }
    | { project_id: string };
}

export function AddNoteForm({ organizationId, parent }: AddNoteFormProps) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("activities").insert({
      organization_id: organizationId,
      type: "note",
      body: body.trim(),
      ...parent,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setBody("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note..."
        rows={3}
        className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      />
      <Button type="submit" size="sm" className="self-end" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add note"}
      </Button>
    </form>
  );
}
