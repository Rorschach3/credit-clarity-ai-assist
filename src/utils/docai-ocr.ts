// src/utils/docai-ocr.ts
import { google } from 'googleapis';

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

async function processDocument(
  file: Uint8Array,
  mimeType: string,
  projectId: string,
  location: string,
  processorId: string,
  serviceAccountKey: ServiceAccountKey
): Promise<string> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await google.documentai({
      version: 'v1',
      auth: auth,
    });

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    const request = {
      name,
      rawDocument: {
        content: file,
        mimeType: mimeType,
      },
    };

    const [result] = await client.projects.locations.processors.processDocument(request as any);
    const { document } = result;

    return document.text || '';
  } catch (error) {
    console.error("Document AI processing error:", error);
    throw new Error("Failed to process document with Document AI");
  }
}

export { processDocument };