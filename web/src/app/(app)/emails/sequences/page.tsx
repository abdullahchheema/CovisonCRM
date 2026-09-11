import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { EmailNavTabs } from "@/components/emails/email-nav-tabs";
import { SequenceFormDialog } from "@/components/emails/sequence-form-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pencil } from "lucide-react";

export default async function SequencesPage() {
  const { supabase, org } = await requireOrgContext();

  const [{ data: sequences, error }, { data: templates }, { data: steps }, { data: enrollments }] =
    await Promise.all([
      supabase
        .from("follow_up_sequences")
        .select("id, name, description")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("email_templates").select("id, name").is("deleted_at", null).order("name"),
      supabase
        .from("follow_up_sequence_steps")
        .select("sequence_id, delay_days, email_template_id")
        .order("position"),
      supabase.from("follow_up_enrollments").select("sequence_id, status"),
    ]);

  const stepsBySequence = new Map<string, { delay_days: number; email_template_id: string }[]>();
  for (const step of steps ?? []) {
    (stepsBySequence.get(step.sequence_id) ?? stepsBySequence.set(step.sequence_id, []).get(step.sequence_id)!).push(
      { delay_days: step.delay_days, email_template_id: step.email_template_id },
    );
  }

  const activeCountBySequence = new Map<string, number>();
  for (const enrollment of enrollments ?? []) {
    if (enrollment.status !== "active") continue;
    activeCountBySequence.set(
      enrollment.sequence_id,
      (activeCountBySequence.get(enrollment.sequence_id) ?? 0) + 1,
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Emails"
        actions={
          <SequenceFormDialog
            organizationId={org.id}
            templates={templates ?? []}
            trigger={<Button disabled={!templates?.length}>New sequence</Button>}
          />
        }
      />
      <EmailNavTabs />

      {!templates?.length && (
        <p className="mb-4 text-sm text-text-3">
          Create an email template first, a sequence sends existing templates on a schedule.
        </p>
      )}

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (sequences ?? []).length === 0 && (
        <EmptyState
          title="No follow-up sequences yet"
          description="Create one to automatically follow up with contacted leads after a set number of days."
        />
      )}

      {!error && (sequences ?? []).length > 0 && (
        <ul className="flex flex-col divide-y divide-line-soft rounded-xl bg-surface shadow-sm">
          {(sequences ?? []).map((sequence) => {
            const sequenceSteps = stepsBySequence.get(sequence.id) ?? [];
            const activeCount = activeCountBySequence.get(sequence.id) ?? 0;
            return (
              <li key={sequence.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link href={`/emails/sequences/${sequence.id}`} className="min-w-0">
                  <p className="text-sm font-medium text-foreground hover:underline">
                    {sequence.name}
                  </p>
                  <p className="mt-1 text-xs text-text-3">
                    {sequenceSteps.length} step{sequenceSteps.length === 1 ? "" : "s"}
                    {sequenceSteps.length > 0 &&
                      ` (day ${sequenceSteps.map((s) => s.delay_days).join(", ")})`}
                    {activeCount > 0 && ` · ${activeCount} active`}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <SequenceFormDialog
                    organizationId={org.id}
                    templates={templates ?? []}
                    sequence={{ ...sequence, steps: sequenceSteps }}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Pencil /> Edit
                      </Button>
                    }
                  />
                  <SoftDeleteButton table="follow_up_sequences" id={sequence.id} label="Sequence" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
