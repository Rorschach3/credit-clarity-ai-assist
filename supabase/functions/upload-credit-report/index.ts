import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

app.use((req, res, next) => {
  res.set(corsHeaders);
  next();
});

app.post("/upload", async (req, res) => {
  const supabaseClient = createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  );

  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) throw new Error("User not authenticated");

    const user = userData.user;
    const { fileName, fileContentBase64 } = req.body;

    if (!fileName || !fileContentBase64) {
      throw new Error("Missing fileName or fileContentBase64");
    }

    const fileContent = Buffer.from(fileContentBase64, "base64");

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("credit-reports")
      .upload(`${user.id}/${fileName}`, fileContent, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabaseClient
      .from("credit_reports")
      .insert({
        user_id: user.id,
        file_path: uploadData.path,
        file_name: fileName,
        uploaded_at: new Date().toISOString(),
      });

    if (dbError) throw dbError;

    return res.status(200).json({ message: "File uploaded successfully" });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "Unknown error" });
  }
});

export default app;
