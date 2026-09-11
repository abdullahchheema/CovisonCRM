"use server";

import { createClient } from "@/lib/supabase/server";
import { renderAndSendTemplate } from "@/lib/email/render-and-send";

export interface SendTemplateEmailResult {
  sent: number;
  failed: number;
  errors: string[];
}

// Sends one contact at a time (not a single batch call) so a template's
// placeholders resolve per-recipient, and one bad address doesn't fail the
// whole group. Logs an activity and tries to auto-advance the contact's
// pipeline stage after each successful send, mirroring what the log-only
// placeholder used to do unconditionally.
export async function sendTemplateEmail(
  organizationId: string,
  templateId: string,
  contactIds: string[],
): Promise<SendTemplateEmailResult> {
  if (contactIds.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { sent: 0, failed: contactIds.length, errors: ["Not signed in."] };
  }

  const { data: template } = await supabase
    .from("email_templates")
    .select("id, name, subject, body")
    .eq("id", templateId)
    .single();

  if (!template) {
    return { sent: 0, failed: contactIds.length, errors: ["Template not found."] };
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email, company_id")
    .in("id", contactIds);

  if (!contacts || contacts.length === 0) {
    return { sent: 0, failed: contactIds.length, errors: ["No recipients found."] };
  }

  const companyIds = [...new Set(contacts.map((c) => c.company_id).filter((id): id is string => !!id))];
  const companyNameById = new Map<string, string>();
  if (companyIds.length > 0) {
    const { data: companies } = await supabase.from("companies").select("id, name").in("id", companyIds);
    for (const company of companies ?? []) companyNameById.set(company.id, company.name);
  }

  let sent = 0;
  const errors: string[] = [];

  for (const contact of contacts) {
    const companyName = contact.company_id ? (companyNameById.get(contact.company_id) ?? "") : "";
    const result = await renderAndSendTemplate(template, contact, companyName);

    if (!result.ok) {
      errors.push(`${contact.name}: ${result.error}`);
      continue;
    }

    sent += 1;

    await supabase.from("activities").insert({
      organization_id: organizationId,
      type: "email",
      body: `Sent "${template.name}", ${template.subject}`,
      contact_id: contact.id,
    });

    // Best-effort: creates a deal in the org's default pipeline's first
    // stage if this contact doesn't have an open one yet; a contact
    // already somewhere in the pipeline is left alone (a follow-up email
    // shouldn't undo progress someone made moving it by hand). Result is
    // deliberately not checked, this is a side effect, not a send failure.
    await supabase.rpc("mark_contact_contacted", { p_contact_id: contact.id });
  }

  return { sent, failed: contacts.length - sent, errors };
}
