-- ==============================================================================
-- HAMMAD STUDYHUB — REALTIME REPLICATION PUBLICATION MIGRATION
-- Database: Supabase PostgreSQL
-- Platform Architect: Muhammad Hammad
-- Description: Adds resources, subjects, announcements, and registered_students
--              to supabase_realtime publication to enable instant multi-device sync
--              between laptops, mobile devices, and tablets.
-- ==============================================================================

-- 1. Ensure supabase_realtime publication exists
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- 2. Add core platform tables to publication for instant cross-device updates
alter publication supabase_realtime add table public.resources;
alter publication supabase_realtime add table public.subjects;
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.registered_students;

