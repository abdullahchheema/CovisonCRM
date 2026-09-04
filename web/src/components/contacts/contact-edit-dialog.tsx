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
import type { Database } from "@/lib/supabase/database.types";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "connected", label: "Connected" },
  { value: "attempted", label: "Attempted" },
  { value: "won", label: "Won" },
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  job_title: z.string().trim().optional(),
  status: z.string(),
  company_id: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;
type Contact = Database["public"]["Tables"]["contacts"]["Row"];

interface ContactEditDialogProps {
  contact: Contact;
  companies: { id: string; name: string }[];
}

export function ContactEditDialog({ contact, companies }: ContactEditDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact.name,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      job_title: contact.job_title ?? "",
      status: contact.status,
      company_id: contact.company_id ?? "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("contacts")
      .update({
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        job_title: values.job_title || null,
        status: values.status,
        company_id: values.company_id || null,
      })
      .eq("id", contact.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Contact updated");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
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
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-danger">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job_title">Job title</Label>
            <Input id="job_title" {...register("job_title")} />
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
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register("status")}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
