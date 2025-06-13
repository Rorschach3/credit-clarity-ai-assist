revoke select on table "auth"."schema_migrations" from "postgres";


grant delete on table "storage"."s3_multipart_uploads" to "postgres";

grant insert on table "storage"."s3_multipart_uploads" to "postgres";

grant references on table "storage"."s3_multipart_uploads" to "postgres";

grant select on table "storage"."s3_multipart_uploads" to "postgres";

grant trigger on table "storage"."s3_multipart_uploads" to "postgres";

grant truncate on table "storage"."s3_multipart_uploads" to "postgres";

grant update on table "storage"."s3_multipart_uploads" to "postgres";

grant delete on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant insert on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant references on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant select on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant trigger on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant truncate on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant update on table "storage"."s3_multipart_uploads_parts" to "postgres";

create policy "Authenticated users can delete their own files"
on "storage"."buckets"
as permissive
for delete
to authenticated
using ((owner = auth.uid()));


create policy "Authenticated users can insert files"
on "storage"."buckets"
as permissive
for insert
to authenticated
with check (true);


create policy "Authenticated users can update their own files"
on "storage"."buckets"
as permissive
for update
to authenticated
using ((owner = auth.uid()));


create policy "Authenticated users can view storage buckets"
on "storage"."buckets"
as permissive
for select
to authenticated
using (true);


create policy "Authenticated users can delete their own files"
on "storage"."objects"
as permissive
for delete
to authenticated
using ((owner = auth.uid()));


create policy "Authenticated users can insert files"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((owner = auth.uid()));


create policy "Authenticated users can update their own files"
on "storage"."objects"
as permissive
for update
to authenticated
using ((owner = auth.uid()))
with check ((owner = auth.uid()));


create policy "Authenticated users can view storage bucket and objects"
on "storage"."objects"
as permissive
for select
to authenticated
using (true);


create policy "Authenticated users can view their own files"
on "storage"."objects"
as permissive
for select
to authenticated
using ((owner = auth.uid()));


create policy "Give users authenticated access to folder flreew_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder flreew_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder flreew_2"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder flreew_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Public Read Access"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'credit-reports'::text));



