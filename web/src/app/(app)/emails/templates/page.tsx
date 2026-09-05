import { requireOrgContext } from "@/lib/supabase/org-context";
import { EmailNavTabs } from "@/components/emails/email-nav-tabs";
import { EmailTemplateFormDialog } from "@/components/emails/email-template-form-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pencil } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
};

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  draft: "neutral",
  active: "success",
  paused: "warning",
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
      <PageHeader
        title="Emails"
        actions={
          <EmailTemplateFormDialog
            organizationId={org.id}
            groups={groups ?? []}
            trigger={<Button>New template</Button>}
          />
        }
      />
      <EmailNavTabs />

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (templates ?? []).length === 0 && (
        <EmptyState
          title="No email templates yet"
          description="Create one to get started."
        />
      )}

      {!error && (templates ?? []).length > 0 && (
        <ul className="flex flex-col divide-y divide-line-soft rounded-xl bg-surface shadow-sm">
          {(templates ?? []).map((template) => (
            <li
              key={template.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{template.name}</p>
                <p className="mt-1 text-xs text-text-3">
                  {template.subject} ·{" "}
                  {template.recipient_group_id
                    ? (groupNameById[template.recipient_group_id] ?? "Unknown group")
                    : "No group selected"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={STATUS_VARIANT[template.status] ?? "neutral"}>
                  {STATUS_LABELS[template.status] ?? template.status}
                </Badge>
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
