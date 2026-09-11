const RESEND_API_URL = "https://api.resend.com/emails";

// {{name}}, {{first_name}}, {{email}}, {{company}} — kept to fields every
// contact actually has, documented next to the body field in the template
// editor so what you can type there and what actually gets substituted
// never drift apart.
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => vars[key] ?? "");
}

export interface TemplateContact {
  id: string;
  name: string;
  email: string | null;
  company_id: string | null;
}

export interface EmailTemplateLike {
  name: string;
  subject: string;
  body: string;
}

// The one place that actually calls Resend, shared by the user-triggered
// "Send email" dialog and the follow-up cron, so a template renders and
// sends identically no matter which path fired it. Throws only for
// "couldn't even attempt to send" (network/config); a non-2xx Resend
// response is returned as a result, not thrown, so a caller sending to
// many recipients can keep going after one failure.
export async function renderAndSendTemplate(
  template: EmailTemplateLike,
  contact: TemplateContact,
  companyName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "No email provider is configured (RESEND_API_KEY is not set)." };
  }
  if (!contact.email) {
    return { ok: false, error: "no email address on file" };
  }
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const vars = {
    name: contact.name,
    first_name: contact.name?.split(" ")[0] ?? "",
    email: contact.email,
    company: companyName,
  };

  const subject = renderTemplate(template.subject, vars);
  const html = renderTemplate(template.body, vars).replace(/\n/g, "<br>");

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
    return { ok: false, error: body || response.statusText };
  }

  return { ok: true };
}
