import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseTradelinesFromText, saveTradelinesToDatabase } from "../../../src/utils/tradelineParser.ts";

const corsHeaders = {
 "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
 }

 try {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) throw new Error("User not authenticated");

    const body = await req.json();
    const { fileName, fileContentBase64 } = body;

    if (!fileName || !fileContentBase64) {
      throw new Error("Missing fileName or fileContentBase64");
    }

    const fileContent = Uint8Array.from(atob(fileContentBase64), (c) => c.charCodeAt(0));

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("credit-reports")
      .upload(`${user.id}/${fileName}`, fileContent, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

  // Extract text from the PDF file
  const { data: fileData, error: downloadError } = await supabase.storage
   .from("credit-reports")
   .download(uploadData.path);

  if (downloadError) throw downloadError;

  // Convert the downloaded file data to a Uint8Array
  const uint8Array = new Uint8Array(await fileData.arrayBuffer());

  // Extract text from the PDF file
  const pdfText = await extractTextFromPdf(uint8Array);

  // Parse tradelines from the extracted text
  const tradelines = parseTradelinesFromText(pdfText);

  // Save tradelines to the database
  await saveTradelinesToDatabase(tradelines, user.id);

  const { error: dbError } = await supabase
     .from("credit_reports")
     .insert({
        user_id: user.id,
        file_path: uploadData?.path,
        file_name: fileName,
        uploaded_at: new Date().toISOString(),
      });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ message: "File uploaded successfully" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});

async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  // Import pdf-parse dynamically to avoid issues in environments where it's not available
  const pdfParse = (await import('pdf-parse')).default;

  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}
