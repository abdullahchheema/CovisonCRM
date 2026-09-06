"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type OrgRole = Database["public"]["Enums"]["org_role"];

const ROLE_OPTIONS: OrgRole[] = ["owner", "admin", "manager", "member", "viewer"];

interface MemberRowProps {
  membershipId: string;
  displayName: string;
  role: string;
  isSelf: boolean;
}

export function MemberRow({ membershipId, displayName, role, isSelf }: MemberRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as OrgRole;
    setIsUpdating(true);
    const supabase = createClient();
    // organization_members_update's RLS puts the owner/admin check in
    // USING (same pattern as organizations_update, verified earlier this
    // session), a non-admin's attempt matches zero rows with no error,
    // so .select().single() is what actually surfaces that as PGRST116
    // instead of a silent no-op.
    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("id", membershipId)
      .select()
      .single();
    setIsUpdating(false);

    if (error) {
      toast.error(
        error.code === "PGRST116"
          ? "Only workspace owners and admins can change roles."
          : error.message,
      );
      return;
    }

    toast.success("Role updated");
    router.refresh();
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", membershipId)
      .select()
      .single();
    setIsUpdating(false);
    setConfirmRemove(false);

    if (error) {
      toast.error(
        error.code === "PGRST116"
          ? "Only workspace owners and admins can remove members."
          : error.message,
      );
      return;
    }

    toast.success("Member removed");
    router.refresh();
  };

  if (isSelf) {
    // Deliberately no self-service role change or self-removal here, the
    // schema has no "must have at least one owner" constraint, so the
    // simplest safe guard against a sole owner locking themselves out is
    // just not offering the control on your own row at all.
    return (
      <li className="flex items-center justify-between text-sm">
        <span className="text-foreground">{displayName} (you)</span>
        <Badge variant="brand" className="capitalize">
          {role}
        </Badge>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="text-foreground">{displayName}</span>
      <div className="flex items-center gap-2">
        <Select
          value={role}
          onChange={handleRoleChange}
          disabled={isUpdating}
          className="h-7 w-28 text-xs capitalize"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r} className="capitalize">
              {r}
            </option>
          ))}
        </Select>
        <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmRemove(true)}
            disabled={isUpdating}
          >
            Remove
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove {displayName} from the workspace?</DialogTitle>
              <DialogDescription>
                They&apos;ll lose access immediately and will need a new invite
                to rejoin.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemove} disabled={isUpdating}>
                {isUpdating ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </li>
  );
}
