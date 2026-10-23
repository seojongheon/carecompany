-- Application revision conflicts are not PostgreSQL serialization failures.
-- PostgREST 14 retries SQLSTATE 40001, potentially keeping these RPCs in a loop.
-- https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b
-- Preserve the deployed bodies, SECURITY DEFINER/search_path settings and grants.
-- Only the six explicit signatures below contain custom 40001 errors.
-- admin_update_inquiry(uuid,text,uuid,timestamptz) already raises P0001 and is unchanged.
do $$
declare
  target regprocedure;
  definition text;
  corrected_definition text;
begin
  foreach target in array array[
    'public.save_case_revision(uuid,bigint,jsonb)'::regprocedure,
    'public.publish_case_revision(uuid,bigint)'::regprocedure,
    'public.discard_case_revision(uuid,bigint)'::regprocedure,
    'public.transition_case_revision(uuid,bigint,text)'::regprocedure,
    'public.save_content_document(text,integer,jsonb)'::regprocedure,
    'public.publish_content_document(text,integer)'::regprocedure
  ] loop
    definition := pg_get_functiondef(target);
    corrected_definition := regexp_replace(
      definition,
      'errcode[[:space:]]*=[[:space:]]*''40001''',
      'errcode=''P0001''',
      'gi'
    );
    if corrected_definition = definition then
      raise exception 'Expected custom conflict code missing from %', target;
    end if;
    execute corrected_definition;
  end loop;
end;
$$;
