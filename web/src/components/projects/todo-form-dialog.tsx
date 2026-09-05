"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const todoSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  assigned_to: z.string().optional(),
});

type TodoFormValues = z.infer<typeof todoSchema>;

interface TodoFormDialogProps {
  organizationId: string;
  projectId: string;
  columnId: string;
  members: { id: string; name: string }[];
}

export function TodoFormDialog({
  organizationId,
  projectId,
  columnId,
  members,
}: TodoFormDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TodoFormValues>({ resolver: zodResolver(todoSchema) });

  const onSubmit = async (values: TodoFormValues) => {
    const supabase = createClient();
    const { count } = await supabase
      .from("project_todos")
      .select("id", { count: "exact", head: true })
      .eq("column_id", columnId);

    const { error } = await supabase.from("project_todos").insert({
      organization_id: organizationId,
      project_id: projectId,
      column_id: columnId,
      title: values.title,
      description: values.description || null,
      assigned_to: values.assigned_to || null,
      position: count ?? 0,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="w-full justify-start">
          <Plus /> Add card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-danger">{errors.title.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("description")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assigned_to">Assigned to</Label>
            <Select id="assigned_to" {...register("assigned_to")}>
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
