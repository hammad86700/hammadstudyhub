-- ==============================================================================
-- HAMMAD STUDYHUB — SUBJECT GOOGLE DRIVE FOLDERS & FILE ATTACHMENTS MIGRATION
-- Adds 1-time Google Drive folder linking to subjects and file metadata to resources
-- ==============================================================================

-- Add Google Drive folder link columns to subjects table
alter table if exists public.subjects
  add column if not exists google_drive_folder_url text,
  add column if not exists google_drive_folder_id text;

-- Add Google Drive folder link & file attachment metadata to resources table
alter table if exists public.resources
  add column if not exists google_drive_folder_url text,
  add column if not exists file_name text,
  add column if not exists file_size text;

-- Add comment explanations
comment on column public.subjects.google_drive_folder_url is 'Configured once by admin: the Google Drive folder for this subject';
comment on column public.subjects.google_drive_folder_id is 'Extracted Google Drive folder ID for embedded folder view';
comment on column public.resources.google_drive_folder_url is 'Inherited or customized Google Drive folder URL for this resource';
comment on column public.resources.file_name is 'Original file name uploaded from device';
comment on column public.resources.file_size is 'Formatted file size of uploaded document';
