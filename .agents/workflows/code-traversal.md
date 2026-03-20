# Codebase Traversal — Agent Guide

This guide explains how to efficiently navigate the CreditClarityAI codebase to find any piece of code.

---

## Mental Model

The application has three distinct layers:

```
User Request
     │
     ▼
Frontend (src/)          ← What users see and interact with
     │ HTTP/WebSocket
     ▼
Backend (backend/)       ← Business logic, OCR, LLM processing
     │ Supabase SDK
     ▼
Database (supabase/)     ← PostgreSQL + Edge Functions
```

Always start your search from the layer where the issue manifests, then follow the call chain up or down.

---

## Starting From a URL / Route

The full list of routes is defined in `src/App.tsx`.

```bash
# Open App.tsx and search for the path
grep -n "path=" src/App.tsx
```

Each route maps to a page in `src/pages/`. Follow these steps:
1. Open the page component
2. Find the hooks it uses (they call `useQuery`, `useMutation`, or Supabase directly)
3. Follow the hook to its query function
4. The query function calls either `src/services/api.ts` or `supabase.from(...)`

---

## Starting From a UI Element

1. **Inspect the element** in browser DevTools to find its CSS class or `data-testid`
2. **Search for the class or text**:
   ```bash
   grep -r "upload-button" src/ --include="*.tsx"
   grep -r "Upload Credit Report" src/ --include="*.tsx"
   ```
3. **Open the component file** and trace upward to find its parent page

---

## Starting From an API Endpoint

Backend endpoints follow the pattern `POST /api/<prefix>/<path>`.

### Find the router
```bash
# Search for the route definition
grep -rn '"/api/' backend/ --include="*.py"
grep -rn "@router.post" backend/ --include="*.py"
grep -rn "@router.get" backend/ --include="*.py"
```

### Find where the frontend calls it
```bash
grep -rn "/api/upload" src/ --include="*.ts" --include="*.tsx"
```

---

## Starting From a Database Table

### Find all reads/writes to a table
```bash
# Frontend Supabase queries
grep -rn "from('tradelines')" src/ --include="*.ts" --include="*.tsx"

# Backend service calls
grep -rn "tradelines" backend/ --include="*.py"

# Edge function references
grep -rn "tradelines" supabase/functions/ --include="*.ts"
```

### Find the table schema
1. Open `supabase/migrations/` — scan files in order by filename
2. Look for `CREATE TABLE <name>` or `ALTER TABLE <name>`
3. The TypeScript type definition is in `src/types/database.ts`

---

## Starting From an Error Message

### Frontend console errors
```bash
# Search for the error string in source code
grep -rn "Error uploading file" src/ --include="*.ts" --include="*.tsx"
grep -rn "throw new Error" src/ --include="*.ts" --include="*.tsx"
```

### Backend error messages
```bash
grep -rn "detail=" backend/ --include="*.py"
grep -rn "HTTPException" backend/ --include="*.py"
```

### Edge function errors
```bash
grep -rn "return new Response" supabase/functions/ --include="*.ts"
```

---

## Starting From a Data Model

### TypeScript types
```bash
# Find a type definition
grep -rn "interface Tradeline" src/ --include="*.ts" --include="*.tsx"
grep -rn "type Tradeline" src/ --include="*.ts" --include="*.tsx"

# Find all usages of a type
grep -rn "Tradeline" src/ --include="*.ts" --include="*.tsx"
```

### Python Pydantic models
```bash
grep -rn "class Tradeline" backend/ --include="*.py"
grep -rn "Tradeline" backend/ --include="*.py"
```

---

## Key Files Quick Reference

| What you're looking for | Where to look |
|---|---|
| All page routes | `src/App.tsx` |
| A specific page | `src/pages/<PageName>.tsx` |
| A UI component | `src/components/<feature>/` or `src/components/ui/` |
| Data fetching for a feature | `src/hooks/queries/` |
| Frontend API calls (FastAPI) | `src/services/api.ts` |
| Supabase client | `src/integrations/supabase/client.ts` |
| TypeScript types for DB | `src/types/database.ts` |
| TypeScript utility functions | `src/lib/utils.ts` |
| Form validation schemas | `src/lib/validation/` or `src/lib/validations.ts` |
| All FastAPI endpoints | `backend/routers/` |
| OCR logic | `backend/services/document_ai_service.py` |
| LLM parsing logic | `backend/services/llm_parser_service.py` |
| LLM prompt strings | `backend/services/prompt_templates.py` |
| Python data models | `backend/models/` |
| Auth middleware (Python) | `backend/utils/auth.py` |
| Database schema | `supabase/migrations/` (in order) |
| Edge functions | `supabase/functions/<name>/index.ts` |
| Environment config | `.env` (root) |
| Build configuration | `vite.config.ts` |
| TypeScript config | `tsconfig.json` |
| Test configuration | `jest.config.ts` |
| Tailwind config | `tailwind.config.ts` |
| Python dependencies | `requirements.txt` |
| Node dependencies | `package.json` |

---

## Navigating the Component Tree

To understand how a page is assembled:

```bash
# 1. Open the page
cat src/pages/DashboardPage.tsx

# 2. Find all imported components
grep "^import" src/pages/DashboardPage.tsx

# 3. For each component, check what it renders
# Repeat recursively until you find the element you're looking for
```

---

## Understanding a Hook

```bash
# 1. Find the hook file
find src/hooks -name "useTradelines*"

# 2. Read it to understand the query key, query function, and return value
cat src/hooks/queries/useTradelines.ts

# 3. Find all components that use this hook
grep -rn "useTradelines" src/ --include="*.tsx"
```

---

## Tracing a Full Request End-to-End

Example: "Why isn't my tradeline being saved?"

1. **Frontend**: find where the save button's `onClick` handler is → likely calls a `useMutation` hook
2. **Hook**: the mutation function calls `supabase.functions.invoke('add-tradeline', ...)`
3. **Edge function**: `supabase/functions/add-tradeline/index.ts` validates with Zod and upserts
4. **Database**: check `supabase/migrations/` for the `tradelines` table RLS policy
5. **Logs**: check Supabase Studio → Edge Functions → Logs for the error

---

## File and Symbol Search Commands

```bash
# Find all files containing a symbol
grep -rl "processDocument" backend/

# Find a function definition in Python
grep -n "def process_document" backend/services/document_ai_service.py

# Find a React component definition
grep -n "function DisputeWizard\|const DisputeWizard\|export.*DisputeWizard" src/components/dispute-wizard/

# List all exported functions in a file
grep -n "^export" src/services/api.ts

# Find TODO / FIXME comments
grep -rn "TODO\|FIXME\|HACK" src/ backend/ --include="*.ts" --include="*.tsx" --include="*.py"
```
