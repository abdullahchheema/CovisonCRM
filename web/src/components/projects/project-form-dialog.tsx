"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { createClient } from "@/lib/supabase/client";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const DEFAULT_COLUMNS = ["To do", "In progress", "Done"];

export function ProjectFormDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });

  const onSubmit = async (values: ProjectFormValues) => {
    const supabase = createClient();
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ organization_id: organizationId, name: values.name })
      .select()
      .single();

    if (error || !project) {
      toast.error(error?.message ?? "Could not create project");
      return;
    }

    const { error: columnsError } = await supabase.from("project_columns").insert(
      DEFAULT_COLUMNS.map((name, index) => ({
        organization_id: organizationId,
        project_id: project.id,
        name,
        position: index,
      })),
    );

    if (columnsError) {
      toast.error(columnsError.message);
      return;
    }

    toast.success("Project created");
    reset();
    setOpen(false);
    router.push(`/projects/${project.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-danger">{errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
