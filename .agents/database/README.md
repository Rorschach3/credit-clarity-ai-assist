# Database — Agent Guide

## Overview

The database is **Supabase** (hosted PostgreSQL) with:
- Row Level Security (RLS) on all tables
- Auth managed by Supabase GoTrue
- Migrations in `supabase/migrations/` (applied in filename order)
- Edge functions in `supabase/functions/` (Deno runtime)

**Project ID**: `gywohmbqohytziwsjrps`

---

## Schema — Tables

### `profiles`
User profile data, extends `auth.users`.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | FK → `auth.users.id` |
| `first_name` | `TEXT` | |
| `last_name` | `TEXT` | |
| `address1` | `TEXT` | |
| `city` | `TEXT` | |
| `state` | `TEXT` | |
| `zip_code` | `TEXT` | |
| `phone_number` | `TEXT` | |
| `ssn_last_four` | `TEXT` | Encrypted at rest |
| `updated_at` | `TIMESTAMPTZ` | |

**RLS**: Users can read/write only their own row.

---

### `tradelines`
Parsed credit report tradeline records.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `auth.users.id` |
| `creditor_name` | `TEXT` | |
| `account_number` | `TEXT` | Masked (e.g. `000000XXXX`) |
| `account_balance` | `TEXT` | |
| `credit_limit` | `TEXT` | |
| `monthly_payment` | `TEXT` | |
| `date_opened` | `TEXT` | Format: `MM/YYYY` |
| `account_type` | `TEXT` | `credit_card`, `mortgage`, etc. |
| `account_status` | `TEXT` | `open`, `closed`, `collection` |
| `is_negative` | `BOOLEAN` | |
| `dispute_count` | `INTEGER` | Default: 0 |
| `created_at` | `TIMESTAMPTZ` | |

**RLS**: Users can read/write only their own rows.  
**Upsert key**: `(user_id, account_number, creditor_name)` — prevents duplicates.

---

### `credit_reports`
Raw (encrypted) credit report storage metadata.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `auth.users.id` |
| `encrypted_content` | `TEXT` | AES-encrypted |
| `encryption_key_id` | `TEXT` | Key reference |
| `created_at` | `TIMESTAMPTZ` | |

**RLS**: Users can access only their own records.

---

### `disputes`
Dispute submissions against credit bureaus.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `auth.users.id` |
| `tradeline_id` | `UUID` | FK → `tradelines.id` |
| `bureau` | `TEXT` | `Equifax`, `Experian`, `TransUnion` |
| `reason` | `TEXT` | Dispute reason |
| `status` | `TEXT` | `pending`, `submitted`, `resolved` |
| `submitted_at` | `TIMESTAMPTZ` | |
| `resolved_at` | `TIMESTAMPTZ` | |

**RLS**: Users can manage only their own disputes.

---

### `dispute_letter`
Generated FCRA dispute letters.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `auth.users.id` |
| `dispute_id` | `UUID` | FK → `disputes.id` |
| `content` | `TEXT` | Letter body |
| `generated_at` | `TIMESTAMPTZ` | |

**RLS**: Users can manage only their own letters (`auth.uid() = user_id`).

---

### `user_roles`
Role-based access control.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `auth.users.id` |
| `role` | `app_role` | ENUM: `admin`, `moderator`, `user` |
| `email` | `TEXT` | Denormalized for quick lookup |
| `assigned_at` | `TIMESTAMPTZ` | |

**RLS**: Admins only.

---

### `audit_history`
Immutable audit log.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `table_name` | `TEXT` | |
| `record_id` | `UUID` | |
| `operation` | `TEXT` | `INSERT`, `UPDATE`, `DELETE` |
| `old_values` | `JSONB` | |
| `new_values` | `JSONB` | |
| `performed_by` | `UUID` | FK → `auth.users.id` |
| `created_at` | `TIMESTAMPTZ` | |

**RLS**: Admins only.

---

### Other Tables
- `payments` — Stripe payment records
- `letters` — Additional letter storage
- `dispute_packets` — Bundled dispute collections
- `user_documents` — Uploaded document metadata
- `encrypted_report_content` — Encrypted report data (alternative to `credit_reports`)
- `admin_activity_logs` — Admin action audit

---

## Row Level Security (RLS)

**All tables have RLS enabled.** The standard pattern:

```sql
-- Users can only see their own data
CREATE POLICY "Users read own data"
  ON public.tradelines
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users insert own data"
  ON public.tradelines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Helper function**:
```sql
-- Check if a user has a role
SELECT public.has_role(auth.uid(), 'admin');
```

---

## Migrations

Migrations live in `supabase/migrations/` and are applied in lexicographic filename order.

**To apply migrations locally**:
```bash
supabase db reset          # Reset local DB and re-run all migrations
supabase db push           # Push local migrations to remote
```

**To create a new migration**:
```bash
supabase migration new my_change_description
# Edits the generated file in supabase/migrations/
```

**Never edit existing migration files.** Always create a new migration to make schema changes.

---

## TypeScript Types

Auto-generated types from the Supabase schema are in `src/types/database.ts` (and re-exported from `src/integrations/supabase/types.ts`).

To regenerate after schema changes:
```bash
supabase gen types typescript --project-id gywohmbqohytziwsjrps > src/integrations/supabase/types.ts
```

---

## Local Development with Supabase

```bash
# Start local Supabase stack (requires Docker)
supabase start

# Stop
supabase stop

# View local Studio
open http://localhost:54323
```
