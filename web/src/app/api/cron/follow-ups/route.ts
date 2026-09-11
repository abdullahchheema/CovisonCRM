import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { renderAndSendTemplate } from "@/lib/email/render-and-send";

// Runs once a day (see vercel.json). For each active enrollment whose
// next_run_at has passed: sends the next unsent step's template, then
// either advances to the step after it (rescheduling for its delay) or
// marks the enrollment "completed" if that was the last step. A send
// failure leaves the enrollment exactly as it was, so it's picked up and
// retried on tomorrow's run instead of silently getting stuck or skipped.
//
// Uses the service-role client: a cron invocation has no signed-in user
// for RLS to check against, this is the one place in the app that's
// intentional.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: dueEnrollments, error: dueError } = await supabase
    .from("follow_up_enrollments")
    .select("id, organization_id, sequence_id, contact_id, current_step_position")
    .eq("status", "active")
    .lte("next_run_at", new Date().toISOString())
    .limit(200);

  if (dueError) {
    return NextResponse.json({ error: dueError.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let completed = 0;
  const errors: string[] = [];

  for (const enrollment of dueEnrollments ?? []) {
    const { data: nextStep } = await supabase
      .from("follow_up_sequence_steps")
      .select("id, position, delay_days, email_template_id")
      .eq("sequence_id", enrollment.sequence_id)
      .gt("position", enrollment.current_step_position)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextStep) {
      // No further step defined (shouldn't normally happen: a completed
      // enrollment shouldn't still be "active"), close it out defensively.
      await supabase
        .from("follow_up_enrollments")
        .update({ status: "completed" })
        .eq("id", enrollment.id);
      completed += 1;
      continue;
    }

    const [{ data: template }, { data: contact }] = await Promise.all([
      supabase
        .from("email_templates")
        .select("name, subject, body")
        .eq("id", nextStep.email_template_id)
        .single(),
      supabase
        .from("contacts")
        .select("id, name, email, company_id")
        .eq("id", enrollment.contact_id)
        .single(),
    ]);

    if (!template || !contact) {
      failed += 1;
      errors.push(`enrollment ${enrollment.id}: template or contact no longer exists`);
      continue;
    }

    let companyName = "";
    if (contact.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", contact.company_id)
        .single();
      companyName = company?.name ?? "";
    }

    const result = await renderAndSendTemplate(template, contact, companyName);

    if (!result.ok) {
      failed += 1;
      errors.push(`${contact.name}: ${result.error}`);
      continue;
    }

    sent += 1;

    await supabase.from("activities").insert({
      organization_id: enrollment.organization_id,
      type: "email",
      body: `Follow-up sent: "${template.name}", ${template.subject}`,
      contact_id: contact.id,
    });

    const { data: followingStep } = await supabase
      .from("follow_up_sequence_steps")
      .select("delay_days")
      .eq("sequence_id", enrollment.sequence_id)
      .gt("position", nextStep.position)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (followingStep) {
      const nextRunAt = new Date();
      nextRunAt.setDate(nextRunAt.getDate() + followingStep.delay_days);
      await supabase
        .from("follow_up_enrollments")
        .update({ current_step_position: nextStep.position, next_run_at: nextRunAt.toISOString() })
        .eq("id", enrollment.id);
    } else {
      await supabase
        .from("follow_up_enrollments")
        .update({ current_step_position: nextStep.position, status: "completed" })
        .eq("id", enrollment.id);
      completed += 1;
    }
  }

  return NextResponse.json({
    processed: dueEnrollments?.length ?? 0,
    sent,
    failed,
    completed,
    errors,
  });
}
