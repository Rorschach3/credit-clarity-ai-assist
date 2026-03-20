# Bug Resolution — Agent Guide

A structured process for finding, reproducing, diagnosing, and fixing bugs in CreditClarityAI.

---

## Step 1 — Reproduce the Bug

Before touching any code, reproduce the issue reliably.

### Frontend bugs
1. Start both services (see [`run-code.md`](./run-code.md))
2. Navigate to the affected route
3. Open browser DevTools → **Console** tab (note any red errors)
4. Open **Network** tab — filter by `Fetch/XHR` (note failed requests and their status codes)
5. Document the exact steps to reproduce

### Backend bugs
1. Start the FastAPI server: `uvicorn backend.main:app --reload --port 8000`
2. Make the failing request (via browser, curl, or the `/docs` UI)
3. Check terminal output for stack traces
4. Check `http://localhost:8000/docs` to test endpoints interactively

### Common reproduction helpers
```bash
# Test a backend endpoint directly
curl -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Bearer <jwt>" \
  -F "file=@/path/to/test.pdf"

# Check backend logs in real time
uvicorn backend.main:app --reload --log-level debug
```

---

## Step 2 — Locate the Code

### Frontend: trace from the UI

1. Find the affected **page** in `src/pages/`
2. Identify which **component** renders the broken UI
3. Find the **hook** that fetches or mutates the data
4. Find the **service call** in `src/services/api.ts` or Supabase client

### Backend: trace from the endpoint

1. Identify the router from the URL prefix:
   - `/api/upload/` → `backend/routers/upload_router.py`
   - `/api/llm/` → `backend/routers/parse_router.py`
2. Follow the call into the **service** (`backend/services/`)
3. Check the **model** validation (`backend/models/`)

### Useful search commands
```bash
# Find all usages of a function or symbol
grep -r "functionName" src/ --include="*.ts" --include="*.tsx"
grep -r "method_name" backend/ --include="*.py"

# Find where a component is rendered
grep -r "ComponentName" src/ --include="*.tsx"

# Find all API endpoint definitions
grep -r "@router\." backend/ --include="*.py"

# Find where a Supabase table is queried
grep -r "from('tradelines')" src/ --include="*.ts" --include="*.tsx"
```

---

## Step 3 — Diagnose the Root Cause

### Frontend diagnostic checklist
- [ ] Is the React Query cache stale? (try `queryClient.invalidateQueries(...)`)
- [ ] Is the auth token expired? (check Network tab → request headers)
- [ ] Is the Supabase RLS policy blocking the query? (check Supabase Studio → Logs)
- [ ] Is a TypeScript type mismatch causing a runtime error?
- [ ] Is the component receiving `undefined` props?
- [ ] Is a useEffect dependency missing, causing stale closures?

### Backend diagnostic checklist
- [ ] Is the input failing Pydantic validation? (check 422 response body for details)
- [ ] Is the auth dependency failing? (check for 401 response)
- [ ] Is an external service (Document AI, Gemini, Supabase) returning an error?
- [ ] Is a background task failing silently? (check `job_service` status)
- [ ] Are environment variables set correctly?

### Supabase diagnostic checklist
- [ ] Does the RLS policy allow the operation? (check `supabase/migrations/`)
- [ ] Is the Zod schema in the edge function rejecting the payload?
- [ ] Does the edge function have the required secrets set?
- [ ] Is there a unique constraint violation?

---

## Step 4 — Fix the Bug

### Frontend fix patterns

**Stale query data**:
```ts
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['tradelines'] });
```

**Null/undefined guard**:
```tsx
// Before
return <div>{user.name}</div>;

// After
return <div>{user?.name ?? 'Unknown'}</div>;
```

**Missing dependency in useEffect**:
```ts
// Before (stale closure bug)
useEffect(() => { fetchData(userId); }, []);

// After
useEffect(() => { fetchData(userId); }, [userId]);
```

**TypeScript type mismatch** — update the type in `src/types/` or cast safely:
```ts
const result = data as Tradeline;  // only if you're sure of the shape
```

### Backend fix patterns

**Pydantic validation error**:
```python
# Before
class MyRequest(BaseModel):
    amount: int  # crashes if frontend sends "100" (string)

# After
from pydantic import validator
class MyRequest(BaseModel):
    amount: int

    @validator('amount', pre=True)
    def coerce_amount(cls, v):
        return int(v)
```

**Unhandled exception in background task**:
```python
# Always wrap background tasks with try/except and update job status
async def my_background_task(job_id: str):
    try:
        await do_work(job_id)
        await job_service.update_job_status(job_id, ProcessingStatus.COMPLETED)
    except Exception as e:
        logger.exception("Task failed for job %s", job_id)
        await job_service.update_job_status(
            job_id, ProcessingStatus.FAILED, error_message=str(e)
        )
```

**Missing environment variable**:
```python
import os
value = os.environ.get("MY_VAR")
if not value:
    raise RuntimeError("MY_VAR environment variable is required")
```

---

## Step 5 — Write a Test

After fixing the bug, write a test that would have caught it:

### Frontend test
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

it('shows error message when API returns 400', async () => {
  // Mock the API to return an error
  jest.spyOn(global, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ error: 'Bad input' }), { status: 400 })
  );

  render(<MyComponent />);
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/Bad input/i)).toBeInTheDocument();
  });
});
```

### Backend test
```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_upload_rejects_invalid_file_type():
    response = client.post(
        "/api/upload/",
        files={"file": ("test.exe", b"binary content", "application/octet-stream")},
        headers={"Authorization": "Bearer fake-jwt"},
    )
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]
```

---

## Step 6 — Verify the Fix

```bash
# Run affected tests
npx jest src/components/MyComponent.test.tsx

# Run all tests to check for regressions
npm test

# Manually verify the bug is gone by following Step 1 again
```

---

## Quick Reference — Error Codes

| HTTP Status | Meaning | Common Cause |
|---|---|---|
| `400 Bad Request` | Invalid input | Pydantic validation failure, Zod rejection |
| `401 Unauthorized` | Auth failure | Expired JWT, missing Authorization header |
| `403 Forbidden` | Permission denied | RLS policy blocking, not an admin |
| `404 Not Found` | Resource missing | Job ID doesn't exist, wrong route |
| `422 Unprocessable Entity` | FastAPI validation | Wrong request body schema |
| `429 Too Many Requests` | Rate limit hit | LLM rate limiter (10 req/min per user) |
| `500 Internal Server Error` | Unhandled exception | Check backend logs for stack trace |
