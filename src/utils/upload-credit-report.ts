// src/utils/uploadCreditReport.ts
export async function uploadCreditReport(
  pdfDataUrl: string,
  token: string
) {
  const res = await fetch(
    "/functions/add-tradeline",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_API_KEY // Include the API key in the request headers
      },
      body: JSON.stringify({ file: pdfDataUrl, token }),
    }
  );
  return res.json();
}
