import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { to, name } = await req.json();

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return new Response("Missing RESEND_API_KEY", { status: 500 });
  }

  const body = {
    from: "Credit Clarity <no-reply@creditclarity.com>",
    to,
    subject: "Your Dispute Packet Was Submitted",
    html: `
      <p>Hi ${name},</p>
      <p>We’ve received your dispute packet and it has been marked as submitted.</p>
      <p>Please allow 30–45 days for bureaus to review and respond.</p>
      <p>You can view your history anytime by logging in.</p>
      <br />
      <p>– The Credit Clarity Team</p>
    `,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: response.status,
  });
});
