import { requireOrgContext } from "@/lib/supabase/org-context";
import { EmailNavTabs } from "@/components/emails/email-nav-tabs";
import { EmailGroupFormDialog } from "@/components/emails/email-group-form-dialog";
import { EmailGroupContactsDialog } from "@/components/emails/email-group-contacts-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";

export default async function EmailGroupsPage() {
  const { supabase, org } = await requireOrgContext();

  const [{ data: groups, error }, { data: contacts }, { data: memberships }] = await Promise.all([
    supabase
      .from("email_groups")
      .select("id, name, description")
      .is("deleted_at", null)
      .order("name"),
    supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("email_group_contacts").select("group_id, contact_id"),
  ]);

  const contactIdsByGroup = new Map<string, string[]>();
  for (const row of memberships ?? []) {
    const list = contactIdsByGroup.get(row.group_id) ?? [];
    list.push(row.contact_id);
    contactIdsByGroup.set(row.group_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Emails</h1>
        <EmailGroupFormDialog organizationId={org.id} />
      </div>
      <EmailNavTabs />

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (groups ?? []).length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No audience groups yet. Create one to build a send list.
          </p>
        </div>
      )}

      {!error && (groups ?? []).length > 0 && (
        <ul className="flex flex-col gap-2">
          {(groups ?? []).map((group) => {
            const memberIds = contactIdsByGroup.get(group.id) ?? [];
            return (
              <li
                key={group.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.description ?? "—"} · {memberIds.length} contact
                    {memberIds.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <EmailGroupContactsDialog
                    groupId={group.id}
                    organizationId={org.id}
                    allContacts={contacts ?? []}
                    memberContactIds={memberIds}
                  />
                  <SoftDeleteButton table="email_groups" id={group.id} label="Group" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
