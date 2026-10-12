// Resend rejects display names containing characters like "." unless they're quoted,
// so `agentprofile.ae <noreply@…>` becomes `"agentprofile.ae" <noreply@…>`.
function formatFrom(raw: string): string {
  const match = raw.trim().match(/^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/);
  if (!match) return raw.trim();
  const name = match[1].trim().replace(/^"(.*)"$/, "$1").replace(/"/g, "");
  return name ? `"${name}" <${match[2]}>` : match[2];
}

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email send");
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: formatFrom(process.env.RESEND_FROM_EMAIL || "agentprofile.ae <onboarding@resend.dev>"),
      to,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend email failed", res.status, await res.text().catch(() => ""));
    return { sent: false };
  }

  return { sent: true };
}
