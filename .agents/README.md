# AI Agent Instructions — CreditClarityAI

This directory contains structured markdown files designed to help AI agents autonomously traverse the codebase, resolve bugs, and run the application.

---

## How to Use This Directory

Start here, then follow the links to the relevant sub-topic. Each file is self-contained and cross-references others when needed.

| File / Folder | Purpose |
|---|---|
| [`architecture.md`](./architecture.md) | Full system architecture, data-flow diagrams, and layer responsibilities |
| [`frontend/README.md`](./frontend/README.md) | React/TypeScript frontend — structure, routing, and component patterns |
| [`frontend/components.md`](./frontend/components.md) | Component hierarchy, reusable UI primitives, and naming conventions |
| [`frontend/state-management.md`](./frontend/state-management.md) | Hooks, React Query, Supabase client, and context patterns |
| [`backend/README.md`](./backend/README.md) | FastAPI Python backend — entry point, routers, and middleware |
| [`backend/services.md`](./backend/services.md) | Service-layer responsibilities (OCR, LLM, storage, validation) |
| [`database/README.md`](./database/README.md) | Supabase PostgreSQL schema, RLS policies, and migrations |
| [`database/supabase-functions.md`](./database/supabase-functions.md) | Edge functions and their HTTP contracts |
| [`workflows/run-code.md`](./workflows/run-code.md) | Step-by-step commands to start and stop all services |
| [`workflows/bug-resolution.md`](./workflows/bug-resolution.md) | Structured process for finding, reproducing, and fixing bugs |
| [`workflows/code-traversal.md`](./workflows/code-traversal.md) | How to navigate the codebase efficiently |
| [`conventions/README.md`](./conventions/README.md) | TypeScript and Python coding conventions used in this project |

---

## Quick-Start for Agents

1. **Understand the system** → read [`architecture.md`](./architecture.md)
2. **Run the app** → follow [`workflows/run-code.md`](./workflows/run-code.md)
3. **Fix a bug** → follow [`workflows/bug-resolution.md`](./workflows/bug-resolution.md)
4. **Find code** → follow [`workflows/code-traversal.md`](./workflows/code-traversal.md)

---

## Repository Root Map

```
credit-clarity-ai-assist/
├── .agents/              ← YOU ARE HERE (AI agent instructions)
├── .github/              ← GitHub Actions workflows and Copilot config
├── backend/              ← FastAPI Python backend
│   ├── main.py           ← Application entry point (uvicorn)
│   ├── routers/          ← Route handlers (parse, upload)
│   ├── services/         ← Business logic (OCR, LLM, storage)
│   ├── models/           ← Pydantic data models
│   ├── utils/            ← Shared helpers (auth, normalizers)
│   └── config/           ← LLM configuration
├── src/                  ← React/TypeScript frontend (Vite)
│   ├── main.tsx          ← React entry point
│   ├── App.tsx           ← Router and layout root
│   ├── components/       ← Reusable UI components
│   ├── pages/            ← Page-level components (route targets)
│   ├── hooks/            ← Custom React hooks
│   ├── services/         ← Frontend API clients
│   ├── integrations/     ← Third-party integrations (Supabase)
│   ├── lib/              ← Utilities (encryption, validation)
│   └── types/            ← TypeScript type definitions
├── supabase/
│   ├── functions/        ← Deno edge functions
│   └── migrations/       ← SQL schema migrations
├── public/               ← Static assets
├── package.json          ← Node dependencies and scripts
├── requirements.txt      ← Python dependencies
├── jest.config.ts        ← Jest test configuration
├── vite.config.ts        ← Vite bundler configuration
├── tsconfig.json         ← TypeScript root configuration
└── tailwind.config.ts    ← Tailwind CSS configuration
```
