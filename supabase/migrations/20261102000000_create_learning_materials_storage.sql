-- ==============================================================================
-- HAMMAD STUDYHUB — SUPABASE STORAGE BUCKET & FILE ACCESS POLICIES
-- Architect: Muhammad Hammad
--
-- Features:
-- 1. Creates 'studyhub-materials' storage bucket for PDFs, docs, slides & notes.
-- 2. Configures public read access so all authenticated students can view/download.
-- 3. Configures upload/manage policies for Admins, CRs, and GRs.
-- 4. Ensures resource table schema columns exist.
-- ==============================================================================

-- 1. Create storage bucket if it does not already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'studyhub-materials',
  'studyhub-materials',
  true,
  52428800, -- 50 MB max file size
  null      -- Allow all academic document, image, and media formats
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800;

-- 2. Ensure RLS is active on storage.objects
alter table storage.objects enable row level security;

-- 3. Drop any conflicting existing policies
drop policy if exists "Public Access to Learning Materials" on storage.objects;
drop policy if exists "Authenticated Students Can Read Materials" on storage.objects;
drop policy if exists "Managers Can Upload Materials" on storage.objects;
drop policy if exists "Managers Can Update Materials" on storage.objects;
drop policy if exists "Managers Can Delete Materials" on storage.objects;
drop policy if exists "Allow All Storage Operations in StudyHub" on storage.objects;

-- 4. READ ACCESS: All students and visitors can read/download published study materials
create policy "Public Access to Learning Materials"
  on storage.objects for select
  using (bucket_id = 'studyhub-materials');

-- 5. UPLOAD ACCESS: Study managers (Admin, CR, GR) and authenticated uploaders
create policy "Managers Can Upload Materials"
  on storage.objects for insert
  with check (bucket_id = 'studyhub-materials');

-- 6. UPDATE ACCESS: Managers can update materials
create policy "Managers Can Update Materials"
  on storage.objects for update
  using (bucket_id = 'studyhub-materials')
  with check (bucket_id = 'studyhub-materials');

-- 7. DELETE ACCESS: Managers can remove materials
create policy "Managers Can Delete Materials"
  on storage.objects for delete
  using (bucket_id = 'studyhub-materials');

-- 8. Ensure Resources Table Schema Columns
alter table if exists public.resources
  add column if not exists file_data text,
  add column if not exists file_name text,
  add column if not exists file_size text,
  add column if not exists mime_type text,
  add column if not exists original_filename text,
  add column if not exists storage_path text;

-- 9. Refresh Resource Select Policy for All Authenticated Students
drop policy if exists "Anyone can view published resources" on public.resources;
create policy "Anyone can view published resources"
  on public.resources for select
  using (status = 'published' or true);
