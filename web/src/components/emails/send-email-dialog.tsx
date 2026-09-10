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
import { sendTemplateEmail } from "@/lib/email/send-template-email";

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

export function SendEmailDialog({ organizationId, templates, recipients, trigger }: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const template = templates.find((t) => t.id === templateId);

  const handleSend = async () => {
    if (!template || recipients.length === 0) return;
    setIsSending(true);

    const result = await sendTemplateEmail(
      organizationId,
      template.id,
      recipients.map((r) => r.id),
    );

    setIsSending(false);

    if (result.sent === 0) {
      toast.error(result.errors[0] ?? "Send failed.");
      return;
    }

    if (result.failed > 0) {
      toast.warning(
        `Sent to ${result.sent} of ${recipients.length}. ${result.errors[0] ?? ""}`.trim(),
      );
    } else {
      toast.success(
        `Sent "${template.name}" to ${result.sent} contact${result.sent === 1 ? "" : "s"}.`,
      );
    }
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
          Sends now, personalized per contact, and logs on each recipient&apos;s
          activity timeline.
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
