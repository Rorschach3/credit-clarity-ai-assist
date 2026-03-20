# Backend — Agent Guide

## Overview

The backend is a **FastAPI** (Python) application that:
- Receives file uploads from the frontend
- Processes documents through OCR (Google Document AI)
- Parses tradeline data with LLMs (Gemini / OpenAI)
- Stores results and tracks job status in Supabase

**Entry point**: `backend/main.py`  
**Server**: Uvicorn on `http://localhost:8000`

---

## Directory Structure

```
backend/
├── main.py                         # FastAPI app factory + router registration
├── config/
│   └── llm_config.py               # LLM provider configuration (API keys, model names)
├── routers/
│   ├── upload_router.py            # POST /api/upload — file ingestion
│   └── parse_router.py             # POST /api/llm/normalize — LLM normalization
├── services/
│   ├── document_ai_service.py      # OCR: Google Document AI integration
│   ├── document_processor_service.py  # Orchestrates full processing pipeline
│   ├── llm_parser_service.py       # LLM: tradeline extraction and normalization
│   ├── storage_service.py          # Supabase Storage read/write
│   ├── validation_service.py       # Pydantic-based input validation
│   ├── job_service.py              # Async job status tracking
│   └── prompt_templates.py         # LLM prompt templates
├── models/
│   ├── tradeline_models.py         # Pydantic models: Tradeline, CreditReport, etc.
│   └── llm_models.py               # Pydantic models: LLMRequest, LLMResponse, etc.
└── utils/
    ├── auth.py                     # JWT verification + FastAPI dependency
    ├── data_normalizers.py         # Text cleaning and normalization helpers
    └── llm_helpers.py              # Token counting, response validation
```

---

## API Endpoints

### `POST /api/upload/`
Upload a credit report document (PDF or image).

**Auth**: Required (JWT in `Authorization: Bearer <token>` header)  
**Content-Type**: `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | `UploadFile` | PDF or image file |

**Response** (`200 OK`):
```json
{
  "job_id": "uuid",
  "status": "queued",
  "message": "Document uploaded and processing started",
  "estimated_processing_time": 30
}
```

**What it does internally**:
1. Reads file bytes
2. Validates file type and size
3. Saves to Supabase Storage
4. Creates a job record via `JobService`
5. Kicks off background processing via `DocumentProcessorService`

---

### `POST /api/llm/normalize`
Trigger LLM normalization for an already-uploaded document.

**Auth**: Required  
**Content-Type**: `application/json`

**Request body**:
```json
{
  "job_id": "uuid",
  "document_type": "credit_report",
  "confidence_threshold": 0.7
}
```

**Response** (`200 OK`): `NormalizationResult` JSON containing structured tradelines.

**Rate limit**: 10 requests per user per minute.

---

### `GET /api/upload/{job_id}/status`
Check processing status for a job.

**Response**:
```json
{
  "job_id": "uuid",
  "status": "processing | completed | failed",
  "progress": 0.75,
  "error_message": null
}
```

---

## Authentication

All protected endpoints use the `get_current_user` / `get_current_user_id` FastAPI dependency defined in `backend/utils/auth.py`.

```python
from backend.utils.auth import get_current_user_id

@router.post("/my-endpoint")
async def my_endpoint(user_id: str = Depends(get_current_user_id)):
    ...
```

The dependency:
1. Extracts the `Authorization: Bearer <jwt>` header
2. Verifies the JWT signature using the Supabase JWT secret
3. Returns the `user_id` (Supabase UUID) from the token claims
4. Raises `HTTP 401` if the token is missing, expired, or invalid

---

## Processing Pipeline

```
upload_router.py
  └── DocumentProcessorService.document_ai_workflow(job_id)
        ├── 1. StorageService.get_file(job_id)          → raw bytes
        ├── 2. DocumentAIService.process_document()      → extracted text + tables
        ├── 3. StorageService.save_document_ai_results() → saved to Supabase
        └── 4. JobService.update_job_status("completed")

parse_router.py
  └── LLMParserService.normalize_tradeline_data()
        ├── StorageService.get_document_ai_results(job_id)
        ├── PromptTemplates.get_tradeline_prompt(raw_text)
        ├── LLM API call (OpenAI / Gemini)
        └── ResponseValidator.validate_and_parse()
```

---

## Adding a New Endpoint

1. Create a new router file in `backend/routers/` or add to an existing one:
   ```python
   from fastapi import APIRouter
   router = APIRouter(prefix="/api/my-feature", tags=["my-feature"])

   @router.get("/")
   async def my_endpoint():
       return {"status": "ok"}
   ```

2. Register it in `backend/main.py`:
   ```python
   from backend.routers.my_router import router as my_router
   app.include_router(my_router)
   ```

---

## Error Handling

FastAPI automatically converts Python exceptions to HTTP responses:

```python
from fastapi import HTTPException

# 404 - not found
raise HTTPException(status_code=404, detail="Job not found")

# 400 - bad request
raise HTTPException(status_code=400, detail="Invalid file type")

# 429 - rate limit
raise HTTPException(status_code=429, detail="Rate limit exceeded")

# 500 - let FastAPI catch unhandled exceptions and return 500
```

All service methods should log errors with `logger.exception(...)` before re-raising.

---

## Logging

All modules use the standard Python logger:

```python
import logging
logger = logging.getLogger(__name__)

logger.info("Starting process for job %s", job_id)
logger.warning("Fallback triggered: %s", reason)
logger.error("Failed to parse: %s", e)
logger.exception("Unexpected error")  # includes stack trace
```

Log output goes to stdout (captured by Uvicorn).
