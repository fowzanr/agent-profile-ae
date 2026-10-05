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
      from: process.env.RESEND_FROM_EMAIL || "agentprofile.ae <onboarding@resend.dev>",
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
