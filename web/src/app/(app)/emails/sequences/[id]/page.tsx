import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { StopEnrollmentButton } from "@/components/emails/stop-enrollment-button";
import { ArrowLeft } from "lucide-react";

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  active: "brand",
  completed: "success",
  stopped: "neutral",
};

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireOrgContext();

  const [{ data: sequence }, { data: steps }, { data: enrollments }] = await Promise.all([
    supabase
      .from("follow_up_sequences")
      .select("id, name, description")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("follow_up_sequence_steps")
      .select("position, delay_days")
      .eq("sequence_id", id)
      .order("position"),
    supabase
      .from("follow_up_enrollments")
      .select("id, contact_id, status, current_step_position, next_run_at, enrolled_at")
      .eq("sequence_id", id)
      .order("next_run_at", { ascending: true }),
  ]);

  if (!sequence) {
    notFound();
  }

  const contactIds = [...new Set((enrollments ?? []).map((e) => e.contact_id))];
  const { data: contacts } =
    contactIds.length > 0
      ? await supabase.from("contacts").select("id, name").in("id", contactIds)
      : { data: [] as { id: string; name: string }[] };
  const contactNameById = Object.fromEntries((contacts ?? []).map((c) => [c.id, c.name]));

  const totalSteps = steps?.length ?? 0;
  const now = new Date().getTime();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/emails/sequences"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Follow-up sequences
      </Link>
      <PageHeader title={sequence.name} />
      {sequence.description && <p className="mb-6 -mt-4 text-sm text-text-2">{sequence.description}</p>}

      {(enrollments ?? []).length === 0 ? (
        <EmptyState
          title="No one enrolled yet"
          description="Add contacts to this sequence from the Contacts list."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line-soft rounded-xl bg-surface shadow-sm">
          {(enrollments ?? []).map((enrollment) => {
            const overdue = enrollment.status === "active" && new Date(enrollment.next_run_at).getTime() < now;
            return (
              <li key={enrollment.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <Link
                    href={`/contacts/${enrollment.contact_id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {contactNameById[enrollment.contact_id] ?? "Unknown contact"}
                  </Link>
                  <p className="mt-1 text-xs text-text-3">
                    Step {enrollment.current_step_position} of {totalSteps}
                    {enrollment.status === "active" && (
                      <>
                        {" · "}
                        <span className={overdue ? "font-medium text-danger" : ""}>
                          {overdue ? "Overdue" : "Next"}{" "}
                          {new Date(enrollment.next_run_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={STATUS_VARIANT[enrollment.status] ?? "neutral"} className="capitalize">
                    {enrollment.status}
                  </Badge>
                  {enrollment.status === "active" && (
                    <StopEnrollmentButton enrollmentId={enrollment.id} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
