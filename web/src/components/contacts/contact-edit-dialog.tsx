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
import {
  CustomFieldsSection,
  findMissingRequiredField,
  type LeadTypeOption,
} from "@/components/lead-types/custom-fields-section";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "connected", label: "Connected" },
  { value: "attempted", label: "Attempted" },
  { value: "won", label: "Won" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "veryHigh", label: "Very high" },
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  job_title: z.string().trim().optional(),
  status: z.string(),
  priority: z.string().optional(),
  company_id: z.string().optional(),
  owner_id: z.string().optional(),
  expected_revenue: z.string().trim().optional(),
  expected_close: z.string().trim().optional(),
  probability: z.string().trim().optional(),
  linkedin_url: z.string().trim().optional(),
  website: z.string().trim().optional(),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  niche: z.string().trim().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;
type Contact = Database["public"]["Tables"]["contacts"]["Row"];

interface ContactEditDialogProps {
  contact: Contact;
  companies: { id: string; name: string }[];
  members: { id: string; name: string }[];
  leadTypes: LeadTypeOption[];
}

export function ContactEditDialog({
  contact,
  companies,
  members,
  leadTypes,
}: ContactEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [leadTypeId, setLeadTypeId] = useState(contact.lead_type_id ?? "");
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(
    (contact.custom_fields as Record<string, unknown> | null) ?? {},
  );
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
      priority: contact.priority ?? "",
      company_id: contact.company_id ?? "",
      owner_id: contact.owner_id ?? "",
      expected_revenue: contact.expected_revenue?.toString() ?? "",
      expected_close: contact.expected_close ?? "",
      probability: contact.probability ?? "",
      linkedin_url: contact.linkedin_url ?? "",
      website: contact.website ?? "",
      country: contact.country ?? "",
      city: contact.city ?? "",
      niche: contact.niche ?? "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    const missing = findMissingRequiredField(
      leadTypes.find((t) => t.id === leadTypeId),
      customFields,
    );
    if (missing) {
      toast.error(`${missing} is required for this lead type.`);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("contacts")
      .update({
        lead_type_id: leadTypeId || null,
        custom_fields: customFields,
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        job_title: values.job_title || null,
        status: values.status,
        priority: values.priority || null,
        company_id: values.company_id || null,
        owner_id: values.owner_id || null,
        expected_revenue: values.expected_revenue ? Number(values.expected_revenue) : null,
        expected_close: values.expected_close || null,
        probability: values.probability || null,
        linkedin_url: values.linkedin_url || null,
        website: values.website || null,
        country: values.country || null,
        city: values.city || null,
        niche: values.niche || null,
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
      <DialogContent className="max-h-[85vh] overflow-y-auto">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job_title">Job title</Label>
              <Input id="job_title" {...register("job_title")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://" {...register("website")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input id="linkedin_url" placeholder="https://" {...register("linkedin_url")} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="niche">Niche / industry</Label>
            <Input id="niche" {...register("niche")} />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-foreground">Lead details</p>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" {...register("priority")}>
                  <option value="">None</option>
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expected_revenue">Expected revenue</Label>
                <Input
                  id="expected_revenue"
                  type="number"
                  step="0.01"
                  {...register("expected_revenue")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expected_close">Expected close</Label>
                <Input id="expected_close" type="date" {...register("expected_close")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="probability">Probability (0-1)</Label>
                <Input id="probability" placeholder="0.7" {...register("probability")} />
              </div>
            </div>
          </div>

          <CustomFieldsSection
            leadTypes={leadTypes}
            leadTypeId={leadTypeId}
            onLeadTypeChange={setLeadTypeId}
            values={customFields}
            onValuesChange={setCustomFields}
          />

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
