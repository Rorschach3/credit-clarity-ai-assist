alter table "public"."profiles" alter column "zip" set default '''''::text'::text;

alter table "public"."profiles" alter column "zip" set data type text using "zip"::text;


