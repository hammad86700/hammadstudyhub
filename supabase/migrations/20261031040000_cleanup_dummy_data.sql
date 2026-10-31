-- ==============================================================================
-- HAMMAD STUDYHUB — CLEANUP DUMMY DATA & GOOGLE DRIVE SUBJECT SCHEMAS
-- Database: Supabase PostgreSQL
-- Platform Architect: Muhammad Hammad
-- Description:
--   1. Safely removes all legacy sample/seed demo records from database.
--   2. Ensures Google Drive folder columns exist on subjects.
--   3. Ensures Google Drive file metadata columns exist on resources.
--   4. Preserves all administrator accounts, real students, and security policies.
-- ==============================================================================

-- 1. DELETE LEGACY DEMO RESOURCES (If present from initial seeds)
delete from public.resources
where 
  subject_id::text like '44444444-%'
  or slug in (
    'lesson-01-algorithms-pseudocode',
    'lesson-02-variables-data-types',
    'lesson-03-control-structures',
    'assignment-01-number-theory',
    'lesson-01-number-systems-conversions',
    'lesson-02-boolean-axioms-de-morgan',
    'midterm-past-papers-dld-2024-2025',
    'academic-writing-thesis-statements'
  );

-- 2. DELETE LEGACY DEMO ANNOUNCEMENTS
delete from public.announcements
where title in (
  'Welcome to Hammad StudyHub Fall 2026!',
  'Mid-Term Examination Schedule Announced',
  'CS-101 Programming Lab 02 Submission Deadline'
);

-- 3. DELETE LEGACY DEMO SUBJECTS
delete from public.subjects
where id::text like '44444444-%';

-- 4. DELETE LEGACY DEMO SEMESTERS & PROGRAMS
delete from public.semesters
where id::text like '33333333-%';

delete from public.academic_programs
where id::text like '22222222-%';

delete from public.institutions
where id::text like '11111111-%';

-- 5. ENSURE SUBJECT TABLE GOOGLE DRIVE INTEGRATION COLUMNS
alter table public.subjects
  add column if not exists google_drive_folder_url text,
  add column if not exists google_drive_folder_id text,
  add column if not exists folder_configured boolean default true;

-- 6. ENSURE RESOURCE TABLE GOOGLE DRIVE UPLOAD COLUMNS
alter table public.resources
  add column if not exists google_drive_file_id text,
  add column if not exists google_drive_file_url text,
  add column if not exists google_drive_folder_url text,
  add column if not exists original_filename text,
  add column if not exists mime_type text,
  add column if not exists file_size text,
  add column if not exists file_data text;

-- 7. PERFORMANCE INDEXES
create index if not exists idx_subjects_folder_id on public.subjects(google_drive_folder_id);
create index if not exists idx_resources_drive_file_id on public.resources(google_drive_file_id);
