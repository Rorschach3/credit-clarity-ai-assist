# Supabase Edge Functions — Agent Guide

Edge functions run in Supabase's Deno runtime. They are invoked via HTTP from the frontend (`src/integrations/supabase/client.ts`) using `supabase.functions.invoke(...)`.

All functions live in `supabase/functions/<function-name>/index.ts`.

---

## `add-tradeline`

**Path**: `supabase/functions/add-tradeline/index.ts`  
**Method**: `POST`  
**Auth**: Required (JWT in `Authorization` header)

**Purpose**: Validate and upsert parsed tradeline data into the `tradelines` table.

**Request body**:
```json
{
  "tradelines": [
    {
      "user_id": "uuid",
      "creditor_name": "Bank of America",
      "account_number": "123456XXXX",
      "account_balance": "$1,200",
      "credit_limit": "$5,000",
      "monthly_payment": "$50",
      "date_opened": "01/2020",
      "is_negative": false,
      "account_type": "credit_card",
      "account_status": "open",
      "credit_bureau": "equifax",
      "dispute_count": 0
    }
  ]
}
```

**Validation** (Zod schema):
- `account_type`: enum `credit_card | loan | mortgage | auto_loan | student_loan | collection | ""`
- `account_status`: enum `open | closed | in_collection | charged_off | disputed | ""`
- `credit_bureau`: enum `equifax | transunion | experian | ""`

**Upsert strategy**: On conflict `(user_id, account_number, creditor_name)`, updates the existing row.

**Response**:
- `200` — `{ "inserted": N, "updated": M }`
- `400` — Zod validation error details
- `405` — Method not allowed

---

## `check-admin-status`

**Path**: `supabase/functions/check-admin-status/index.ts`  
**Method**: `GET`  
**Auth**: Required

**Purpose**: Check whether the authenticated user has the `admin` role.

**Response**:
```json
{ "isAdmin": true }
```
or
```json
{ "isAdmin": false, "error": "No authorization header" }
```

---

## `docai-ocr`

**Path**: `supabase/functions/docai-ocr/index.ts`  
**Method**: `POST`  
**Auth**: Required

**Purpose**: Fallback OCR via Google Document AI REST API (used when the Python backend cannot reach Document AI directly).

**Request body**:
```json
{
  "fileBase64": "<base64-encoded file>",
  "mimeType": "application/pdf",
  "projectId": "my-gcp-project",
  "location": "us",
  "processorId": "abc123"
}
```

**Environment variables required**:
- `GOOGLE_SERVICE_ACCOUNT` — JSON string of GCP service account credentials

**Response**:
```json
{ "text": "Extracted text content..." }
```

---

## `generate-dispute-letter`

**Path**: `supabase/functions/generate-dispute-letter/index.ts`  
**Method**: `POST`  
**Auth**: Required

**Purpose**: Use an LLM (OpenAI / Gemini) to generate a FCRA-compliant dispute letter.

**Request body**:
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701"
  },
  "selectedTradelines": [
    {
      "creditor_name": "Collector LLC",
      "account_number": "000XXXX",
      "account_type": "collection",
      "dispute_reason": "Not my account"
    }
  ],
  "bureaus": ["Equifax", "TransUnion"]
}
```

**Response**:
```json
{
  "letters": {
    "Equifax": "Dear Equifax...",
    "TransUnion": "Dear TransUnion..."
  }
}
```

---

## `generate-totp-secret`

**Path**: `supabase/functions/generate-totp-secret/index.ts`  
**Method**: `POST`  
**Auth**: Required

**Purpose**: Generate a TOTP (Time-based One-Time Password) secret for 2FA enrollment.

**Response**:
```json
{
  "secret": "BASE32ENCODEDSECRET",
  "qrCodeUrl": "otpauth://totp/CreditClarityAI:user@example.com?secret=..."
}
```

---

## `textract-ocr`

**Path**: `supabase/functions/textract-ocr/index.ts`  
**Method**: `POST`  
**Auth**: Required

**Purpose**: Alternative OCR via AWS Textract (optional fallback alongside Google Document AI).

**Environment variables required**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (default: `us-east-1`)

**Request body**: Same format as `docai-ocr` but processed by AWS Textract.

---

## Calling Edge Functions from the Frontend

```ts
import { supabase } from '@/integrations/supabase/client';

// Invoke an edge function
const { data, error } = await supabase.functions.invoke('add-tradeline', {
  body: { tradelines: [...] },
});

if (error) console.error('Edge function error:', error);
```

---

## Deploying Edge Functions

```bash
# Deploy a single function
supabase functions deploy add-tradeline

# Deploy all functions
supabase functions deploy

# Set secrets for edge functions
supabase secrets set GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## Local Development of Edge Functions

```bash
# Serve functions locally (requires supabase start)
supabase functions serve

# Serve a single function with env vars
supabase functions serve add-tradeline --env-file .env.local
```
