"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface EmailTemplateOption {
  id: string;
  name: string;
  subject: string;
}

interface Recipient {
  id: string;
  name: string;
}

interface SendEmailDialogProps {
  organizationId: string;
  templates: EmailTemplateOption[];
  recipients: Recipient[];
  trigger: React.ReactNode;
}

// Real sending needs an email provider (Resend/SendGrid/etc.), a separate
// milestone, per email_templates' own migration note, needing an account
// and a job queue for anything beyond "send now". Until that's connected,
// this logs the send as an activity on each recipient's timeline instead,
// so the actual picker, one contact or a whole group, choose a template,
// is fully usable and testable now. Real delivery slots in behind this
// same dialog later without changing what the user sees.
export function SendEmailDialog({ organizationId, templates, recipients, trigger }: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const template = templates.find((t) => t.id === templateId);

  const handleSend = async () => {
    if (!template || recipients.length === 0) return;
    setIsSending(true);
    const supabase = createClient();

    const { error } = await supabase.from("activities").insert(
      recipients.map((recipient) => ({
        organization_id: organizationId,
        type: "email",
        body: `Sent "${template.name}", ${template.subject}`,
        contact_id: recipient.id,
      })),
    );

    setIsSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      `Logged "${template.name}" for ${recipients.length} contact${recipients.length === 1 ? "" : "s"}.`,
    );
    setOpen(false);
    setTemplateId("");
    router.refresh();
  };

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) setTemplateId("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send email</DialogTitle>
          <DialogDescription>
            {recipients.length === 1 ? `To ${recipients[0].name}` : `To ${recipients.length} contacts`}
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 ? (
          <p className="text-sm text-text-2">
            No email templates yet. Create one under Emails → Templates first.
          </p>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="template">Template</Label>
            <Select id="template" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <p className="text-xs text-text-3">
          No email provider is connected yet. This logs the send on each
          contact&apos;s activity timeline rather than delivering real mail.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !template || recipients.length === 0}>
            {isSending ? "Sending..." : `Send to ${recipients.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
