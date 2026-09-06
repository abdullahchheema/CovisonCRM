import { requireOrgContext } from "@/lib/supabase/org-context";
import { LeadTypeFormDialog } from "@/components/lead-types/lead-type-form-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { parseLeadTypeFields } from "@/lib/lead-types";
import { Pencil } from "lucide-react";

export default async function LeadTypesPage() {
  const { supabase, org } = await requireOrgContext();

  const { data: leadTypes, error } = await supabase
    .from("lead_types")
    .select("id, name, description, fields, position")
    .is("deleted_at", null)
    .order("position")
    .order("name");

  const parsed = (leadTypes ?? []).map((leadType) => ({
    ...leadType,
    fields: parseLeadTypeFields(leadType.fields),
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Lead types"
        description="Different kinds of lead capture different details. Define each type once, then pick it on a contact."
        align="start"
        actions={
          <LeadTypeFormDialog
            organizationId={org.id}
            nextPosition={parsed.length}
            trigger={<Button>New lead type</Button>}
          />
        }
      />

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && parsed.length === 0 && (
        <EmptyState
          title="No lead types yet"
          description="Create one — for example Truck dispatching or RCM — and give it the fields that kind of lead needs."
        />
      )}

      {!error && parsed.length > 0 && (
        <ul className="flex flex-col divide-y divide-line-soft rounded-xl bg-surface shadow-sm">
          {parsed.map((leadType) => (
            <li key={leadType.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{leadType.name}</p>
                {leadType.description && (
                  <p className="mt-0.5 text-xs text-text-3">{leadType.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {leadType.fields.length === 0 ? (
                    <span className="text-xs text-text-3">No extra fields</span>
                  ) : (
                    leadType.fields.map((field) => (
                      <Badge key={field.key} variant="neutral">
                        {field.label}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <LeadTypeFormDialog
                  organizationId={org.id}
                  leadType={leadType}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Pencil /> Edit
                    </Button>
                  }
                />
                <SoftDeleteButton table="lead_types" id={leadType.id} label="Lead type" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
