"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

const DAY_OF_WEEK_OPTIONS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const templateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().trim().optional(),
  recipient_group_id: z.string().optional(),
  frequency: z.string(),
  send_date: z.string().optional(),
  send_time: z.string().optional(),
  day_of_week: z.string().optional(),
  day_of_month: z.string().optional(),
  status: z.string(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;
type EmailTemplate = Database["public"]["Tables"]["email_templates"]["Row"];

interface EmailTemplateFormDialogProps {
  organizationId: string;
  groups: { id: string; name: string }[];
  template?: EmailTemplate;
  trigger: React.ReactNode;
}

export function EmailTemplateFormDialog({
  organizationId,
  groups,
  template,
  trigger,
}: EmailTemplateFormDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: template
      ? {
          name: template.name,
          subject: template.subject,
          body: template.body,
          recipient_group_id: template.recipient_group_id ?? "",
          frequency: template.frequency,
          send_date: template.send_date ?? "",
          send_time: template.send_time ?? "",
          day_of_week: template.day_of_week ?? "monday",
          day_of_month: template.day_of_month?.toString() ?? "1",
          status: template.status,
        }
      : { frequency: "one-time", status: "draft", day_of_week: "monday", day_of_month: "1" },
  });

  const frequency = useWatch({ control, name: "frequency" });

  const onSubmit = async (values: TemplateFormValues) => {
    const supabase = createClient();
    const payload = {
      organization_id: organizationId,
      name: values.name,
      subject: values.subject,
      body: values.body || "",
      recipient_group_id: values.recipient_group_id || null,
      frequency: values.frequency,
      send_date: values.send_date || null,
      send_time: values.send_time || null,
      day_of_week: values.frequency === "weekly" ? values.day_of_week || null : null,
      day_of_month:
        values.frequency === "monthly" && values.day_of_month
          ? Number(values.day_of_month)
          : null,
      status: values.status,
    };

    const { error } = template
      ? await supabase.from("email_templates").update(payload).eq("id", template.id)
      : await supabase.from("email_templates").insert(payload);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(template ? "Template updated" : "Template created");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "New email template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-danger">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...register("subject")} />
            {errors.subject && (
              <p className="text-sm text-danger">{errors.subject.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipient_group_id">Recipients (group)</Label>
            <Select id="recipient_group_id" {...register("recipient_group_id")}>
              <option value="">No group selected</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" rows={5} {...register("body")} />
            <p className="text-xs text-text-3">
              Dynamic variables: {"{{name}}"}, {"{{email}}"}
            </p>
          </div>

          <div className="rounded-lg bg-surface-2 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
              Schedule
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select id="frequency" {...register("frequency")}>
                  <option value="one-time">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="send_time">Send time</Label>
                <Input id="send_time" type="time" {...register("send_time")} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="send_date">
                  {frequency === "one-time" ? "Send date" : "Start date"}
                </Label>
                <Input id="send_date" type="date" {...register("send_date")} />
              </div>
              {frequency === "weekly" && (
                <div className="grid gap-2">
                  <Label htmlFor="day_of_week">Day of week</Label>
                  <Select id="day_of_week" {...register("day_of_week")}>
                    {DAY_OF_WEEK_OPTIONS.map((day) => (
                      <option key={day} value={day}>
                        {day[0].toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {frequency === "monthly" && (
                <div className="grid gap-2">
                  <Label htmlFor="day_of_month">Day of month</Label>
                  <Select id="day_of_month" {...register("day_of_month")}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-text-3">
            Sending isn&apos;t wired up yet — this workspace has no email provider
            configured. Templates and audiences can be built now and will send
            once that&apos;s set up.
          </p>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : template ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
