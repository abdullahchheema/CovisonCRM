"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

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

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  due_at: z.string().optional(),
  priority: z.string().optional(),
  contact_id: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskEditDialogProps {
  task: {
    id: string;
    title: string;
    due_at: string | null;
    priority: string | null;
    contact_id: string | null;
  };
  contacts: { id: string; name: string }[];
}

export function TaskEditDialog({ task, contacts }: TaskEditDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      due_at: task.due_at ? task.due_at.slice(0, 10) : "",
      priority: task.priority ?? "",
      contact_id: task.contact_id ?? "",
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({
        title: values.title,
        due_at: values.due_at ? new Date(values.due_at).toISOString() : null,
        priority: values.priority || null,
        contact_id: values.contact_id || null,
      })
      .eq("id", task.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Task updated");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Edit task"
        >
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
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
            <Label htmlFor="due_at">Due date</Label>
            <Input id="due_at" type="date" {...register("due_at")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" {...register("priority")}>
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_id">Related contact</Label>
            <Select id="contact_id" {...register("contact_id")}>
              <option value="">None</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
