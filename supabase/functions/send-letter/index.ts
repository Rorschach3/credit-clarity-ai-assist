// send-letter/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { to, body } = await req.json();

  const response = await fetch("https://api.lob.com/v1/letters", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(Deno.env.get("LOB_API_KEY") || "")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: "Dispute Letter",
      to,
      from: {
        name: "YourCompany",
        address_line1: "123 Your St",
        address_city: "City",
        address_state: "ST",
        address_zip: "00000",
      },
      file: body,
      color: false,
    }),
  });

  const data = await response.json();

  return new Response(JSON.stringify({ lob_id: data.id }), {
    headers: { "Content-Type": "application/json" },
    status: response.status,
  });
});
