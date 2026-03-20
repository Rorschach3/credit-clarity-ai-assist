# System Architecture — CreditClarityAI

## Overview

CreditClarityAI is a full-stack web application that:
1. Accepts PDF or image uploads of credit reports
2. Extracts text via OCR (Google Document AI / Tesseract fallback)
3. Parses tradeline data with an LLM (Gemini / OpenAI)
4. Displays errors, generates FCRA-compliant dispute letters, and tracks disputes

---

## Architecture Layers

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                    │
│   React 18 · React Router v6 · TanStack Query · Radix UI │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTPS
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
┌──────────────┐           ┌─────────────────────┐
│  FastAPI     │           │  Supabase Platform  │
│  (Python)    │           │  ─ PostgreSQL DB    │
│  Port 8000   │           │  ─ Auth (GoTrue)    │
│              │           │  ─ Storage          │
│  /api/upload │           │  ─ Edge Functions   │
│  /api/parse  │           │    (Deno runtime)   │
└──────┬───────┘           └─────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  External AI / Cloud Services    │
│  ─ Google Document AI (OCR)      │
│  ─ Google Gemini (LLM parsing)   │
│  ─ OpenAI (fallback LLM)         │
└──────────────────────────────────┘
```

---

## Request Data Flow — Credit Report Upload

```
User selects PDF
      │
      ▼
document-ai-parser.ts          (src/services/)
  converts file → base64
      │
      ▼
FastAPI  POST /api/upload       (backend/routers/upload_router.py)
  saves raw file to Supabase Storage
      │
      ▼
FastAPI  POST /api/parse        (backend/routers/parse_router.py)
  1. Google Document AI Python client  ──► extracted text
  2. fallback: Node/Express proxy      ──► extracted text
  3. fallback: Supabase edge function  ──► extracted text
      │
      ▼
llm_parser_service.py          (backend/services/)
  sends text to Gemini/OpenAI
  returns structured JSON tradelines
      │
      ▼
Frontend receives JSON
  displays tradelines in UI
  user reviews and confirms
      │
      ▼
Supabase Edge Function: add-tradeline
  validates with Zod schema
  upserts into PostgreSQL tradelines table
      │
      ▼
Dashboard shows tradelines + dispute status
```

---

## Key Technologies

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 18.3 |
| Frontend build | Vite | 6.x |
| Frontend language | TypeScript | 5.5 |
| Styling | Tailwind CSS + shadcn/ui | 3.4 |
| State / data fetching | TanStack React Query | 5.x |
| Backend framework | FastAPI | 0.115 |
| Backend language | Python | 3.11+ |
| Backend server | Uvicorn | 0.35 |
| Database | Supabase (PostgreSQL) | 2.x |
| Auth | Supabase GoTrue | — |
| OCR | Google Document AI | 3.5 |
| OCR fallback | Tesseract.js | 6.x |
| LLM (primary) | Google Gemini | google-genai 1.24 |
| LLM (fallback) | OpenAI GPT | openai 1.93 |
| Edge functions | Deno (Supabase) | — |
| Frontend tests | Jest + Testing Library | 29.x |

---

## Environment Variables

### Frontend (`src/integrations/supabase/`)
| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

### Backend (`.env` in repo root or `backend/`)
| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID for Document AI |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENAI_API_KEY` | OpenAI API key (fallback) |
| `DOCUMENT_AI_PROCESSOR_ID` | Document AI processor ID |

---

## Authentication Flow

1. User logs in via Supabase Auth (email/password or OAuth)
2. Supabase issues a JWT stored in `localStorage` / cookies
3. Frontend Supabase client (`src/integrations/supabase/client.ts`) attaches JWT to all requests
4. Backend verifies JWTs via `backend/utils/auth.py`
5. Row Level Security (RLS) on all Supabase tables enforces per-user data isolation

---

## Dispute Letter Generation Flow

```
User selects a tradeline error
      │
      ▼
Supabase Edge Function: generate-dispute-letter
  receives: tradeline_id, dispute_reason, bureau
  calls Gemini/OpenAI to draft FCRA-compliant letter
  stores letter in dispute_letters table
      │
      ▼
Frontend renders letter in editor
User reviews, edits, and downloads PDF (jsPDF)
```

---

## Module Dependency Map

```
src/pages/*
  └── uses src/components/*
        └── uses src/hooks/*  (data fetching via React Query)
              └── calls src/services/api.ts  (HTTP to FastAPI)
              └── calls src/integrations/supabase/client.ts  (direct DB)

backend/routers/*
  └── calls backend/services/*
        └── document_ai_service.py   (OCR)
        └── llm_parser_service.py    (LLM parsing)
        └── storage_service.py       (Supabase Storage)
        └── validation_service.py    (Pydantic validation)
        └── job_service.py           (async job tracking)
```
