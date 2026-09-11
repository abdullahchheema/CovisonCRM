"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { sendInviteEmail } from "@/lib/email/send-invite-email";

const ROLE_OPTIONS = ["admin", "manager", "member", "viewer"] as const;

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(ROLE_OPTIONS),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InviteMemberDialog({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const [open, setOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "member" },
  });

  const onSubmit = async (values: InviteFormValues) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("invite_member", {
      org: organizationId,
      invite_email: values.email,
      invite_role: values.role,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    const token = data?.[0]?.raw_token;
    if (!token) {
      toast.error("Invitation created but no link was returned, please try again.");
      return;
    }

    const link = `${window.location.origin}/invite/${token}`;
    setInviteLink(link);

    const emailResult = await sendInviteEmail(values.email, organizationName, link);
    if (emailResult.ok) {
      setEmailSentTo(values.email);
    }

    router.refresh();
  };

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      reset();
      setInviteLink(null);
      setEmailSentTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>Invite member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            Creates an invite link, valid for 7 days, and emails it to them
            automatically if email sending is set up.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-2">
              {emailSentTo
                ? `We've emailed the invite to ${emailSentTo}. You can also share the link directly:`
                : "Couldn't send an email automatically (no email provider configured, or the send failed), so share this link yourself:"}
            </p>
            <div className="grid gap-2">
              <Label>Invite link</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Copy invite link"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select id="role" {...register("role")}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role} className="capitalize">
                    {role}
                  </option>
                ))}
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating invite..." : "Create invite link"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
