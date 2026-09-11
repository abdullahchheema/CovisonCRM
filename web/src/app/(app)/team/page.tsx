import { requireOrgContext } from "@/lib/supabase/org-context";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { RevokeInvitationButton } from "@/components/team/revoke-invitation-button";
import { MemberRow } from "@/components/team/member-row";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export default async function TeamPage() {
  const { supabase, org, profile } = await requireOrgContext();

  const [{ data: members, error: membersError }, { data: invitations }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id, user_id, role, created_at")
      .order("created_at"),
    supabase
      .from("organization_invitations")
      .select("id, email, role, expires_at, created_at")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] as { id: string; email: string; full_name: string | null }[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const ownerCount = (members ?? []).filter((m) => m.role === "owner").length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Team"
        actions={<InviteMemberDialog organizationId={org.id} organizationName={org.name} />}
      />

      {membersError && <p className="text-sm text-danger">{membersError.message}</p>}

      <div className="rounded-xl bg-surface-2 p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
          Members ({(members ?? []).length})
        </h2>
        <ul className="flex flex-col gap-2">
          {(members ?? []).map((member) => {
            const memberProfile = profileById.get(member.user_id);
            return (
              <MemberRow
                key={member.id}
                membershipId={member.id}
                displayName={
                  memberProfile?.full_name || memberProfile?.email || member.user_id
                }
                role={member.role}
                isSelf={member.user_id === profile.id}
                isOnlyOwner={member.role === "owner" && ownerCount === 1}
              />
            );
          })}
        </ul>
      </div>

      {(invitations ?? []).length > 0 && (
        <div className="mt-6 rounded-xl bg-surface-2 p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
            Pending invitations ({(invitations ?? []).length})
          </h2>
          <ul className="flex flex-col gap-3">
            {(invitations ?? []).map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="text-foreground">{invitation.email}</span>
                  <Badge variant="neutral" className="ml-2 capitalize">
                    {invitation.role}
                  </Badge>
                  <p className="mt-1 text-xs text-text-3">
                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <RevokeInvitationButton invitationId={invitation.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
