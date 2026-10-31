-- ==============================================================================
-- HAMMAD STUDYHUB — REGISTERED STUDENTS DIRECTORY MIGRATION
-- Database: Supabase PostgreSQL
-- Platform Architect: Muhammad Hammad
-- Description: Creates the shared registered_students directory table so student
--              accounts and CR/GR appointments synchronize across all devices
--              and are directly accessible in the Master Admin panel.
-- ==============================================================================

create table if not exists public.registered_students (
  id text primary key,
  display_name text not null,
  email text not null unique,
  password text,
  role text not null default 'student' check (role in ('admin', 'cr', 'gr', 'student')),
  gender text check (gender in ('male', 'female')),
  phone text,
  roll_no text,
  program_name text,
  semester text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- Index for instant case-insensitive email lookups
create index if not exists idx_registered_students_email on public.registered_students(lower(email));
create index if not exists idx_registered_students_role on public.registered_students(role);

-- Enable Row Level Security
alter table public.registered_students enable row level security;

-- Permissive policies for anon & authenticated so students can register/log in
-- and the Master Admin can manage roles from anywhere
drop policy if exists "Allow registered_students select" on public.registered_students;
create policy "Allow registered_students select" on public.registered_students
  for select using (true);

drop policy if exists "Allow registered_students insert" on public.registered_students;
create policy "Allow registered_students insert" on public.registered_students
  for insert with check (true);

drop policy if exists "Allow registered_students update" on public.registered_students;
create policy "Allow registered_students update" on public.registered_students
  for update using (true) with check (true);

drop policy if exists "Allow registered_students delete" on public.registered_students;
create policy "Allow registered_students delete" on public.registered_students
  for delete using (true);
