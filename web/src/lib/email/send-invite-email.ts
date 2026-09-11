"use server";

const RESEND_API_URL = "https://api.resend.com/emails";

// A one-off transactional email, not a user-editable template: the invite
// flow predates Resend being wired up at all, so it only ever produced a
// link to copy and share by hand. Now that Resend is configured, this
// sends that same link automatically; the dialog still shows the link too,
// so copy-and-share keeps working as a fallback either way.
export async function sendInviteEmail(
  toEmail: string,
  organizationName: string,
  inviteLink: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "No email provider is configured." };
  }
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: toEmail,
      subject: `You're invited to join ${organizationName} on Covison CRM`,
      html: `<p>You've been invited to join <strong>${organizationName}</strong> on Covison CRM.</p><p><a href="${inviteLink}">${inviteLink}</a></p><p>This link expires in 7 days.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: body || response.statusText };
  }

  return { ok: true };
}
