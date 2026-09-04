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
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const dealSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  value: z.coerce.number().min(0).optional(),
  stage_id: z.string().min(1, "Pick a stage"),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
  owner_id: z.string().optional(),
});

// z.coerce.number() makes the schema's input type (string, from the <input>)
// differ from its output type (number, after coercion) — useForm needs both
// sides named explicitly, or TS can't reconcile register()'s raw string
// values with onSubmit's coerced ones.
type DealFormInput = z.input<typeof dealSchema>;
type DealFormValues = z.output<typeof dealSchema>;

interface DealFormDialogProps {
  organizationId: string;
  pipelineId: string;
  stages: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  members: { id: string; name: string }[];
}

export function DealFormDialog({
  organizationId,
  pipelineId,
  stages,
  contacts,
  companies,
  members,
}: DealFormDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealFormInput, unknown, DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: { stage_id: stages[0]?.id ?? "" },
  });

  const onSubmit = async (values: DealFormValues) => {
    const supabase = createClient();
    const { error } = await supabase.from("deals").insert({
      organization_id: organizationId,
      pipeline_id: pipelineId,
      stage_id: values.stage_id,
      name: values.name,
      value: values.value ?? 0,
      contact_id: values.contact_id || null,
      company_id: values.company_id || null,
      owner_id: values.owner_id || null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Deal created");
    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New deal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-danger">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Value</Label>
            <Input id="value" type="number" step="0.01" {...register("value")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stage_id">Stage</Label>
            <Select id="stage_id" {...register("stage_id")}>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_id">Contact</Label>
            <Select id="contact_id" {...register("contact_id")}>
              <option value="">No contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company_id">Company</Label>
            <Select id="company_id" {...register("company_id")}>
              <option value="">No company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="owner_id">Owner</Label>
            <Select id="owner_id" {...register("owner_id")}>
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
              {isSubmitting ? "Creating..." : "Create deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
