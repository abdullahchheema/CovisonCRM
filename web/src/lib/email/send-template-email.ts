"use server";

import { createClient } from "@/lib/supabase/server";

const RESEND_API_URL = "https://api.resend.com/emails";

// {{name}}, {{first_name}}, {{email}}, {{company}} — kept to fields every
// contact actually has, documented next to the body field in the template
// editor so what you can type there and what actually gets substituted
// never drift apart.
function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => vars[key] ?? "");
}

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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      sent: 0,
      failed: contactIds.length,
      errors: ["No email provider is configured (RESEND_API_KEY is not set)."],
    };
  }
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

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
    if (!contact.email) {
      errors.push(`${contact.name}: no email address on file`);
      continue;
    }

    const vars = {
      name: contact.name,
      first_name: contact.name?.split(" ")[0] ?? "",
      email: contact.email,
      company: contact.company_id ? (companyNameById.get(contact.company_id) ?? "") : "",
    };

    const subject = renderTemplate(template.subject, vars);
    const html = renderTemplate(template.body, vars).replace(/\n/g, "<br>");

    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: fromAddress, to: contact.email, subject, html }),
      });

      if (!response.ok) {
        const body = await response.text();
        errors.push(`${contact.name}: ${body || response.statusText}`);
        continue;
      }

      sent += 1;

      await supabase.from("activities").insert({
        organization_id: organizationId,
        type: "email",
        body: `Sent "${template.name}", ${template.subject}`,
        contact_id: contact.id,
      });

      // Best-effort: a contact with no open deal, or a custom pipeline with
      // no "Contacted" stage, is a normal no-op inside this function, not a
      // send failure, so its result is deliberately not checked here.
      await supabase.rpc("mark_contact_contacted", { p_contact_id: contact.id });
    } catch (err) {
      errors.push(`${contact.name}: ${err instanceof Error ? err.message : "failed to send"}`);
    }
  }

  return { sent, failed: contacts.length - sent, errors };
}
