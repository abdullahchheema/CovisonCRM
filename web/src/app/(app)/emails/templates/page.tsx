import { requireOrgContext } from "@/lib/supabase/org-context";
import { EmailNavTabs } from "@/components/emails/email-nav-tabs";
import { EmailTemplateFormDialog } from "@/components/emails/email-template-form-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
};

export default async function EmailTemplatesPage() {
  const { supabase, org } = await requireOrgContext();

  const [{ data: templates, error }, { data: groups }] = await Promise.all([
    supabase
      .from("email_templates")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("email_groups").select("id, name").is("deleted_at", null).order("name"),
  ]);

  const groupNameById = Object.fromEntries((groups ?? []).map((g) => [g.id, g.name]));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Emails</h1>
        <EmailTemplateFormDialog
          organizationId={org.id}
          groups={groups ?? []}
          trigger={<Button>New template</Button>}
        />
      </div>
      <EmailNavTabs />

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (templates ?? []).length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No email templates yet. Create one to get started.
          </p>
        </div>
      )}

      {!error && (templates ?? []).length > 0 && (
        <ul className="flex flex-col gap-2">
          {(templates ?? []).map((template) => (
            <li
              key={template.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {template.subject} ·{" "}
                  {template.recipient_group_id
                    ? (groupNameById[template.recipient_group_id] ?? "Unknown group")
                    : "No group selected"}{" "}
                  · {STATUS_LABELS[template.status] ?? template.status}
                </p>
              </div>
              <div className="flex gap-2">
                <EmailTemplateFormDialog
                  organizationId={org.id}
                  groups={groups ?? []}
                  template={template}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Pencil /> Edit
                    </Button>
                  }
                />
                <SoftDeleteButton table="email_templates" id={template.id} label="Template" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
