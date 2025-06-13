alter table "public"."dispute_letter" alter column "email" set default ''::text;

alter table "public"."tradelines" add column "date_opened" text;

alter table "public"."tradelines" alter column "created_at" set default now();

alter table "public"."tradelines" alter column "created_at" set data type timestamp with time zone using "created_at"::timestamp with time zone;

alter table "public"."tradelines" alter column "credit_limit" set default '0'::text;

alter table "public"."tradelines" alter column "monthly_payment" set default '0'::text;


