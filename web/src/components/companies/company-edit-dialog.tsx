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

const companySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  domain: z.string().trim().optional(),
  website: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  owner_id: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;
type Company = Database["public"]["Tables"]["companies"]["Row"];

interface CompanyEditDialogProps {
  company: Company;
  members: { id: string; name: string }[];
}

export function CompanyEditDialog({ company, members }: CompanyEditDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
      domain: company.domain ?? "",
      website: company.website ?? "",
      phone: company.phone ?? "",
      industry: company.industry ?? "",
      owner_id: company.owner_id ?? "",
    },
  });

  const onSubmit = async (values: CompanyFormValues) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("companies")
      .update({
        name: values.name,
        domain: values.domain || null,
        website: values.website || null,
        phone: values.phone || null,
        industry: values.industry || null,
        owner_id: values.owner_id || null,
      })
      .eq("id", company.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Company updated");
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
          <DialogTitle>Edit company</DialogTitle>
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
            <Label htmlFor="domain">Domain</Label>
            <Input id="domain" {...register("domain")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...register("website")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" {...register("industry")} />
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
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
