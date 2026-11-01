-- ==============================================================================
-- HAMMAD STUDYHUB — PLATFORM CLOUD STORAGE & ACADEMIC FILE ATTACHMENTS
-- Supports direct upload of PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, Images, ZIP
-- ==============================================================================

alter table if exists public.resources
  add column if not exists file_data text,
  add column if not exists file_name text,
  add column if not exists file_size text,
  add column if not exists mime_type text,
  add column if not exists original_filename text;

comment on column public.resources.file_data is 'Direct binary / Base64 data URL for instant platform viewing & downloading';
comment on column public.resources.file_name is 'Original file name uploaded from computer';
comment on column public.resources.file_size is 'Formatted file size of uploaded academic document';
comment on column public.resources.mime_type is 'MIME content type of uploaded study material';
comment on column public.resources.original_filename is 'Original uploaded filename for download preservation';

