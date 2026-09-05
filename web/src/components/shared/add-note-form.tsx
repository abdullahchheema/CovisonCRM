"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note..."
        rows={3}
      />
      <Button type="submit" size="sm" className="self-end" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add note"}
      </Button>
    </form>
  );
}
