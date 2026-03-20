# Running the Application — Agent Guide

This guide covers every command needed to start, stop, test, and build all services.

---

## Prerequisites

### System requirements
- **Node.js** 18+ (check: `node --version`)
- **Python** 3.11+ (check: `python3 --version`)
- **pip** (check: `pip --version`)
- **Docker** (for local Supabase — check: `docker --version`)
- **Supabase CLI** (check: `supabase --version`)

### First-time setup

```bash
# 1. Install Node dependencies
npm install

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Copy and fill environment variables
cp .env.example .env
# Edit .env with your Supabase URL, API keys, etc.
```

---

## Frontend (React / Vite)

### Development server
```bash
npm run dev
# Open http://localhost:8080
```

### Production build
```bash
npm run build
# Output: dist/
```

### Preview production build locally
```bash
npm run preview
# Open http://localhost:4173
```

### Lint
```bash
npm run lint
```

### Bundle analysis
```bash
npm run analyze
# Opens interactive bundle visualizer in browser
```

---

## Backend (FastAPI / Python)

### Development server
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
# OpenAPI schema at http://localhost:8000/openapi.json
```

### Alternative: run from repo root
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

### Check API is running
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

---

## Supabase (Local)

### Start local Supabase stack
```bash
supabase start
# Services:
#   Studio:      http://localhost:54323
#   API:         http://localhost:54321
#   DB:          postgresql://postgres:postgres@localhost:54322/postgres
#   Inbucket:    http://localhost:54324  (email testing)
```

### Reset and re-run all migrations
```bash
supabase db reset
```

### Stop local Supabase
```bash
supabase stop
```

### Push migrations to remote
```bash
supabase db push
```

### Serve edge functions locally
```bash
supabase functions serve
```

---

## Running Tests

### Frontend unit tests
```bash
npm test
# or
npm run test
```

### Frontend tests with coverage
```bash
npm run test:coverage
# Coverage report: coverage/
```

### Run a specific test file
```bash
npx jest src/components/MyComponent.test.tsx
```

### Run tests matching a pattern
```bash
npx jest --testNamePattern="renders without crashing"
```

### Watch mode (re-runs on file change)
```bash
npx jest --watch
```

### Backend tests (Python)
```bash
cd backend
python -m pytest
# or with verbose output
python -m pytest -v
```

---

## Environment Variables Reference

Create a `.env` file in the repository root:

```dotenv
# Supabase
VITE_SUPABASE_URL=https://gywohmbqohytziwsjrps.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend (Python)
SUPABASE_URL=https://gywohmbqohytziwsjrps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Cloud
GOOGLE_CLOUD_PROJECT=my-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
DOCUMENT_AI_PROCESSOR_ID=abc123456789

# LLM
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...

# AWS (optional, for Textract fallback)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

---

## Common Port Reference

| Service | Port | URL |
|---|---|---|
| Frontend (Vite dev) | 8080 | http://localhost:8080 |
| Backend (FastAPI) | 8000 | http://localhost:8000 |
| Backend API docs | 8000 | http://localhost:8000/docs |
| Supabase API | 54321 | http://localhost:54321 |
| Supabase Studio | 54323 | http://localhost:54323 |
| Supabase DB | 54322 | postgresql://localhost:54322 |
| Supabase Email | 54324 | http://localhost:54324 |

---

## Stopping Services

```bash
# Kill Vite dev server: Ctrl+C in its terminal

# Kill FastAPI server: Ctrl+C in its terminal

# Stop Supabase
supabase stop
```

---

## Troubleshooting

### "Module not found" errors (TypeScript)
```bash
# Regenerate type definitions
npm run build -- --noEmit
```

### Python import errors
```bash
# Ensure you're in a virtual environment with dependencies installed
pip install -r requirements.txt
```

### Supabase connection refused
```bash
# Make sure local Supabase is running
supabase status
supabase start  # if not running
```

### Port already in use
```bash
# Find and kill the process using port 8000
lsof -ti:8000 | xargs kill -9

# Find and kill the process using port 8080
lsof -ti:8080 | xargs kill -9
```

### Vite build cache issues
```bash
rm -rf node_modules/.vite
npm run dev
```
