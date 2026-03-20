# Coding Conventions — Agent Guide

This document describes the conventions used in CreditClarityAI for both TypeScript/React (frontend) and Python (backend). Follow these when adding or modifying code.

---

## TypeScript / React Conventions

### File naming
| Type | Convention | Example |
|---|---|---|
| React component | `PascalCase.tsx` | `DisputeWizard.tsx` |
| React page | `PascalCase.tsx` | `DashboardPage.tsx` |
| React hook | `camelCase.ts/tsx` with `use` prefix | `useTradelines.ts` |
| Utility/helper | `camelCase.ts` | `formatCurrency.ts` |
| Type definition | `camelCase.ts` | `tradeline.ts` |
| Test file | Same name + `.test.tsx` | `DisputeWizard.test.tsx` |
| CSS module | Same name + `.module.css` | `DisputeWizard.module.css` |

### Imports
- Use the `@/` alias for `src/` (configured in `tsconfig.json` and `vite.config.ts`)
- Sort: external packages first, then `@/` imports, then relative imports
- Do not use barrel re-exports (`index.ts`) unless the directory is a published library

```ts
// External
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal via alias
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

// Relative
import { formatDate } from './utils';
```

### Component structure

```tsx
// 1. Imports
import React from 'react';

// 2. Type/interface definitions
interface TradelineCardProps {
  tradeline: Tradeline;
  onDispute: (id: string) => void;
}

// 3. Component function
export function TradelineCard({ tradeline, onDispute }: TradelineCardProps) {
  // 3a. Hooks (always at the top, never conditional)
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // 3b. Event handlers and callbacks
  const handleDispute = () => {
    onDispute(tradeline.id);
  };

  // 3c. JSX return
  return (
    <Card>
      <CardContent>{tradeline.creditor_name}</CardContent>
    </Card>
  );
}
```

### Styling
- Use **Tailwind CSS utility classes** — no inline `style` props
- Use `cn()` from `src/lib/utils.ts` for conditional classes:
  ```tsx
  import { cn } from '@/lib/utils';
  <div className={cn('base-class', isActive && 'active-class')} />
  ```
- Dark mode via CSS variables — Tailwind `dark:` variant

### TypeScript strictness
- Avoid `any` — use `unknown` and narrow the type
- Prefer `interface` for object shapes, `type` for unions/aliases
- Always type function parameters and return values
- Use `z.infer<typeof schema>` to derive types from Zod schemas

### Error handling (frontend)
```tsx
// In React Query mutations
mutationFn: async (data) => {
  const { error } = await supabase.from('tradelines').insert(data);
  if (error) throw new Error(error.message);  // React Query catches this
},
onError: (error) => {
  toast({ title: 'Error', description: error.message, variant: 'destructive' });
},
```

### React patterns
- **Lazy load** heavy pages with `React.lazy()` + `<Suspense>` (see `App.tsx`)
- **Error boundaries** — the global `ErrorBoundary` wraps the entire app; add local boundaries for critical feature areas
- **Keys** — always use stable, unique IDs as React `key` props (never array index for dynamic lists)
- **Effects** — keep `useEffect` minimal; prefer React Query for data fetching side effects

---

## Python Conventions

### File and class naming
| Type | Convention | Example |
|---|---|---|
| Module | `snake_case.py` | `llm_parser_service.py` |
| Class | `PascalCase` | `LLMParserService` |
| Function / method | `snake_case` | `normalize_tradeline_data` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE_MB` |
| Private method | `_snake_case` | `_detect_document_type` |

### Imports
```python
# Standard library
import os
import logging
from typing import Dict, List, Optional

# Third-party
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

# Local (relative)
from ..models.tradeline_models import Tradeline
from ..utils.auth import get_current_user
```

### Async
- All I/O-bound functions should be `async def`
- Use `await` for all async calls
- Avoid mixing sync and async code in the same function

### Pydantic models
```python
from pydantic import BaseModel, Field
from typing import Optional

class Tradeline(BaseModel):
    creditor_name: str = Field(..., description="Name of the creditor")
    account_number: str = Field(default="", description="Masked account number")
    is_negative: bool = Field(default=False)
    dispute_count: int = Field(default=0, ge=0)

    class Config:
        # Allow ORM objects as input
        from_attributes = True
```

### Logging
```python
import logging
logger = logging.getLogger(__name__)

# Use lazy string formatting (not f-strings) for performance
logger.info("Processing job %s", job_id)
logger.error("Failed to parse tradeline: %s", error)
logger.exception("Unexpected error in job %s", job_id)  # includes stack trace
```

### FastAPI dependency injection
```python
from fastapi import Depends

def get_storage_service() -> StorageService:
    """FastAPI dependency factory."""
    return StorageService()

@router.post("/")
async def my_endpoint(
    storage: StorageService = Depends(get_storage_service),
    user_id: str = Depends(get_current_user_id),
):
    ...
```

### Error handling (backend)
```python
# Always re-raise HTTPException or raise a new one with a clear message
try:
    result = await some_service.do_work(job_id)
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.exception("Unexpected error processing job %s", job_id)
    raise HTTPException(status_code=500, detail="Internal processing error")
```

### Environment variables
```python
import os
from dotenv import load_dotenv

load_dotenv()  # loads .env file

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required")
```

---

## Shared Conventions

### Commit messages
Use the Conventional Commits format:
```
feat: add TOTP 2FA enrollment flow
fix: prevent duplicate tradeline inserts on re-upload
chore: update dependencies
docs: add edge function documentation
test: add DisputeWizard smoke tests
```

### No magic numbers or strings
```python
# Bad
if file_size > 52428800:
    raise HTTPException(...)

# Good
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
if file_size > MAX_FILE_SIZE_BYTES:
    raise HTTPException(...)
```

### Security checklist
- Never log sensitive data (JWT tokens, API keys, SSN)
- Always use parameterized queries (Supabase SDK handles this)
- Validate all user input (Pydantic for Python, Zod for TypeScript)
- Set Content-Security-Policy headers where applicable
- RLS policies are the last line of defense — always verify they are in place
