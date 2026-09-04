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

const dealSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  value: z.coerce.number().min(0).optional(),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
});

type DealFormInput = z.input<typeof dealSchema>;
type DealFormValues = z.output<typeof dealSchema>;

interface DealEditDialogProps {
  deal: {
    id: string;
    name: string;
    value: number;
    contact_id: string | null;
    company_id: string | null;
  };
  contacts: { id: string; name: string }[];
  companies: { id: string; name: string }[];
}

export function DealEditDialog({ deal, contacts, companies }: DealEditDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DealFormInput, unknown, DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: deal.name,
      value: deal.value,
      contact_id: deal.contact_id ?? "",
      company_id: deal.company_id ?? "",
    },
  });

  const onSubmit = async (values: DealFormValues) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("deals")
      .update({
        name: values.name,
        value: values.value ?? 0,
        contact_id: values.contact_id || null,
        company_id: values.company_id || null,
      })
      .eq("id", deal.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Deal updated");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Edit deal"
        >
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit deal</DialogTitle>
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
