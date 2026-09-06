import { requireOrgContext } from "@/lib/supabase/org-context";
import { EmailNavTabs } from "@/components/emails/email-nav-tabs";
import { EmailGroupFormDialog } from "@/components/emails/email-group-form-dialog";
import { EmailGroupContactsDialog } from "@/components/emails/email-group-contacts-dialog";
import { SendEmailDialog } from "@/components/emails/send-email-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Mail } from "lucide-react";

export default async function EmailGroupsPage() {
  const { supabase, org } = await requireOrgContext();

  const [{ data: groups, error }, { data: contacts }, { data: memberships }, { data: templates }] =
    await Promise.all([
      supabase
        .from("email_groups")
        .select("id, name, description")
        .is("deleted_at", null)
        .order("name"),
      supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("email_group_contacts").select("group_id, contact_id"),
      supabase
        .from("email_templates")
        .select("id, name, subject")
        .is("deleted_at", null)
        .order("name"),
    ]);

  const contactIdsByGroup = new Map<string, string[]>();
  for (const row of memberships ?? []) {
    const list = contactIdsByGroup.get(row.group_id) ?? [];
    list.push(row.contact_id);
    contactIdsByGroup.set(row.group_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Emails" actions={<EmailGroupFormDialog organizationId={org.id} />} />
      <EmailNavTabs />

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (groups ?? []).length === 0 && (
        <EmptyState
          title="No audience groups yet"
          description="Create one to build a send list."
        />
      )}

      {!error && (groups ?? []).length > 0 && (
        <ul className="flex flex-col divide-y divide-line-soft rounded-xl bg-surface shadow-sm">
          {(groups ?? []).map((group) => {
            const memberIds = contactIdsByGroup.get(group.id) ?? [];
            const members = (contacts ?? []).filter((c) => memberIds.includes(c.id));
            return (
              <li
                key={group.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{group.name}</p>
                  <p className="text-xs text-text-3">
                    {group.description ?? "—"} · {memberIds.length} contact
                    {memberIds.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <SendEmailDialog
                    organizationId={org.id}
                    templates={templates ?? []}
                    recipients={members}
                    trigger={
                      <Button variant="outline" size="sm" disabled={members.length === 0}>
                        <Mail /> Send
                      </Button>
                    }
                  />
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
