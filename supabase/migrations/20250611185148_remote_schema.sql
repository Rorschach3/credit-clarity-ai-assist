alter table "public"."credit_bureau" disable row level security;

alter table "public"."credit_reports" disable row level security;

alter table "public"."dispute_letter" alter column "tradelines" set data type jsonb using "tradelines"::jsonb;

alter table "public"."dispute_letter" disable row level security;

alter table "public"."dispute_log" disable row level security;

alter table "public"."disputes" add column "lob_id" text;

alter table "public"."disputes" disable row level security;

alter table "public"."documents" disable row level security;

alter table "public"."profiles" disable row level security;

alter table "public"."tradelines" drop column "account_condition";

alter table "public"."tradelines" add column "isNegative" boolean not null default false;

alter table "public"."tradelines" disable row level security;

alter table "public"."user_documents" disable row level security;

alter table "public"."user_roles" add column "assigned_at" timestamp with time zone default now();

alter table "public"."user_roles" alter column "email" set default ''::text;

alter table "public"."user_roles" alter column "role" set default '''user'''::text;

alter table "public"."user_roles" alter column "user_id" set default auth.uid();

alter table "public"."user_roles" disable row level security;


