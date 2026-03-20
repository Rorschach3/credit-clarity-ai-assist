# Backend Services — Agent Guide

## Service Layer Overview

All business logic is encapsulated in `backend/services/`. Routers are thin — they handle HTTP concerns (request parsing, auth dependencies, response shaping) and delegate all logic to services.

---

## `DocumentAIService` (`document_ai_service.py`)

**Purpose**: Extract text and structured data from uploaded documents using Google Document AI, with fallbacks.

**Key method**:
```python
async def process_document(file_content: bytes, file_name: str) -> DocumentAIResult
```

**Document type detection** (internal `_detect_document_type`):
- `.pdf` → `DocumentType.PDF`
- `.png`, `.jpg`, `.jpeg`, `.tiff` → `DocumentType.IMAGE`
- `.docx` → `DocumentType.DOCX`
- `.txt` → `DocumentType.TXT`

**Fallback chain**:
1. Google Document AI Python client (requires `GOOGLE_APPLICATION_CREDENTIALS`)
2. Node/Express proxy server (`document-ai.js`)
3. Supabase edge function `docai-ocr`

**Returns** `DocumentAIResult`:
```python
@dataclass
class DocumentAIResult:
    text_content: str
    tables: List[ExtractedTable]
    document_type: DocumentType
    processing_time: float
    confidence_score: float
```

---

## `LLMParserService` (`llm_parser_service.py`)

**Purpose**: Use an LLM to extract and normalize tradeline data from raw OCR text.

**Key method**:
```python
async def normalize_tradeline_data(
    raw_text: str,
    table_data: List[Dict],
    context: ProcessingContext
) -> NormalizationResult
```

**LLM provider** (from `config/llm_config.py`):
- Primary: Google Gemini (`google-genai`)
- Fallback: OpenAI GPT (`openai`)

**Uses** `PromptTemplates` to build the prompt and `ResponseValidator` to parse and validate the JSON response.

**Returns** `NormalizationResult` containing:
- `tradelines: List[Tradeline]`
- `consumer_info: ConsumerInfo`
- `confidence_scores: Dict[str, float]`
- `processing_metadata: Dict`

---

## `DocumentProcessorService` (`document_processor_service.py`)

**Purpose**: Orchestrate the full end-to-end processing pipeline for a single job.

**Key method**:
```python
async def document_ai_workflow(job_id: str) -> bool
```

**Pipeline steps**:
1. Fetch raw file bytes from Supabase Storage via `StorageService`
2. Call `DocumentAIService.process_document()` to extract text
3. Save OCR results back to Supabase via `StorageService`
4. Update job status to `completed` via `JobService`
5. On any exception: update job status to `failed` with error message

---

## `StorageService` (`storage_service.py`)

**Purpose**: Abstract all Supabase Storage and database interactions.

**Key methods**:

| Method | Description |
|---|---|
| `save_file(job_id, file_content, filename)` | Upload raw file to Supabase Storage |
| `get_file(job_id)` → `bytes` | Download raw file |
| `save_document_ai_results(job_id, results)` | Persist OCR output as JSON |
| `get_document_ai_results(job_id)` → `Dict` | Retrieve OCR output |
| `save_tradelines(job_id, tradelines)` | Insert tradelines into DB |

Uses the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables.

---

## `ValidationService` (`validation_service.py`)

**Purpose**: Validate uploaded files before processing.

**Checks**:
- File type whitelist: `application/pdf`, `image/jpeg`, `image/png`, `image/tiff`, `text/plain`
- Maximum file size: 50 MB
- Minimum file size: 1 KB (reject empty uploads)

**Key method**:
```python
def validate_upload(file: UploadFile) -> None  # raises HTTPException on failure
```

---

## `JobService` (`job_service.py`)

**Purpose**: Track the lifecycle of asynchronous processing jobs.

**Job statuses** (from `ProcessingStatus` enum):
- `queued` — file uploaded, processing not yet started
- `processing` — OCR and/or LLM in progress
- `completed` — all steps finished successfully
- `failed` — an unrecoverable error occurred

**Key methods**:

| Method | Description |
|---|---|
| `create_job(job_id, user_id, filename)` | Create a new job record |
| `update_job_status(job_id, status, progress?, error_message?)` | Update status |
| `get_job(job_id)` → `Dict` | Retrieve job details |

---

## `PromptTemplates` (`prompt_templates.py`)

**Purpose**: Centralise all LLM prompt strings to keep them out of service code.

**Key method**:
```python
def get_tradeline_prompt(raw_text: str, table_data: List[Dict]) -> str
```

Prompts instruct the LLM to return valid JSON matching the `Tradeline` schema. See `backend/models/tradeline_models.py` for the expected schema.

---

## Data Models

### `Tradeline` (`tradeline_models.py`)
```python
class Tradeline(BaseModel):
    creditor_name: str
    account_number: str
    account_balance: Optional[str]
    credit_limit: Optional[str]
    monthly_payment: Optional[str]
    date_opened: Optional[str]
    account_type: str
    account_status: str
    is_negative: bool
    dispute_count: int = 0
    created_at: Optional[datetime]
```

### `CreditReport` (`tradeline_models.py`)
```python
class CreditReport(BaseModel):
    consumer_info: ConsumerInfo
    tradelines: List[Tradeline]
    report_date: Optional[date]
    bureau: Optional[str]  # "Equifax" | "Experian" | "TransUnion"
```

---

## Adding a New Service

1. Create `backend/services/my_service.py`
2. Define a class with `__init__(self, ...)` taking only configuration/dependencies
3. Keep methods `async` if they do I/O
4. Inject via FastAPI `Depends()` in the router:
   ```python
   def get_my_service() -> MyService:
       return MyService(config=get_config())

   @router.post("/")
   async def endpoint(svc: MyService = Depends(get_my_service)):
       result = await svc.do_something()
   ```
