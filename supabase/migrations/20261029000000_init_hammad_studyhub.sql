-- ==============================================================================
-- HAMMAD STUDYHUB — INITIAL DATABASE MIGRATION
-- Database: Supabase PostgreSQL
-- Platform Architect: Muhammad Hammad
-- Description: Complete schema, indexes, functions, triggers, and RLS policies
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- 2. ENUM / CHECK TYPES & TABLES

-- 2.1 User Profiles (Extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  role text not null default 'student' check (role in ('admin', 'cr', 'gr', 'student')),
  gender text check (gender in ('male', 'female')),
  phone text,
  roll_no text,
  program_name text,
  semester text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- 2.1.1 In-Platform Messages & Study Material Attachments
create table if not exists public.chat_messages (
  id text primary key,
  sender_id text not null,
  sender_name text not null,
  sender_role text not null,
  sender_gender text,
  receiver_id text not null,
  receiver_name text not null,
  receiver_role text not null,
  message text not null,
  attachment jsonb,
  created_at timestamptz default timezone('utc', now()) not null,
  read boolean default false
);

-- 2.2 Institutions (Supports multi-institution expansion)
create table if not exists public.institutions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- 2.3 Academic Programs (e.g. ADP Computer Science, BS English)
create table if not exists public.academic_programs (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- 2.4 Semesters
create table if not exists public.semesters (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references public.academic_programs(id) on delete cascade,
  name text not null,
  semester_number integer default 1 not null,
  academic_year text,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- 2.5 Subjects
create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions(id) on delete set null,
  program_id uuid references public.academic_programs(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  name text not null,
  slug text not null unique,
  code text not null,
  description text,
  instructor text,
  icon text default 'book-open' not null,
  color text default 'blue' not null,
  is_featured boolean default false not null,
  is_active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- 2.6 Resources (Daily-wise learning assets)
create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  title text not null,
  slug text not null,
  description text,
  resource_type text not null check (
    resource_type in ('pdf', 'video', 'whiteboard', 'assignment', 'presentation', 'past_paper', 'other')
  ),
  lesson_date date not null default current_date,
  source_provider text not null default 'google_drive' check (
    source_provider in ('google_drive', 'youtube', 'direct_url', 'supabase_storage')
  ),
  external_url text not null,
  embed_url text,
  topic text,
  chapter text,
  tags text[] default '{}'::text[] not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- 2.7 Announcements
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  category text default 'general' check (category in ('general', 'exam', 'assignment', 'schedule')),
  is_pinned boolean default false not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz default timezone('utc', now()) not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- 2.8 Feedback / Broken Link Reports
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  category text default 'general' check (
    category in ('general', 'broken_link', 'resource_request', 'correction', 'other')
  ),
  message text not null,
  contact_email text,
  resource_id uuid references public.resources(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz default timezone('utc', now()) not null
);

-- 2.9 Platform Settings
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- 3. INDEXES FOR HIGH-PERFORMANCE DISCOVERY
create index if not exists idx_subjects_slug on public.subjects(slug);
create index if not exists idx_subjects_program on public.subjects(program_id);
create index if not exists idx_subjects_active on public.subjects(is_active);
create index if not exists idx_subjects_featured on public.subjects(is_featured);

create index if not exists idx_resources_subject on public.resources(subject_id);
create index if not exists idx_resources_lesson_date on public.resources(lesson_date desc);
create index if not exists idx_resources_status on public.resources(status);
create index if not exists idx_resources_type on public.resources(resource_type);
create index if not exists idx_resources_published on public.resources(published_at desc);

-- Full text search indexes
create index if not exists idx_resources_search on public.resources using gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(topic, '') || ' ' || coalesce(chapter, ''))
);
create index if not exists idx_subjects_search on public.subjects using gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(code, '') || ' ' || coalesce(description, ''))
);

-- 4. HELPER FUNCTIONS & TRIGGERS

-- 4.1 Update timestamp trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger set_institutions_updated_at before update on public.institutions
  for each row execute procedure public.handle_updated_at();
create trigger set_academic_programs_updated_at before update on public.academic_programs
  for each row execute procedure public.handle_updated_at();
create trigger set_semesters_updated_at before update on public.semesters
  for each row execute procedure public.handle_updated_at();
create trigger set_subjects_updated_at before update on public.subjects
  for each row execute procedure public.handle_updated_at();
create trigger set_resources_updated_at before update on public.resources
  for each row execute procedure public.handle_updated_at();
create trigger set_announcements_updated_at before update on public.announcements
  for each row execute procedure public.handle_updated_at();

-- 4.2 Admin Check Helper Function (Security Definier)
create or replace function public.is_admin()
returns boolean as $$
declare
  current_role text;
begin
  if auth.uid() is null then
    return false;
  end if;
  
  select role into current_role
  from public.profiles
  where id = auth.uid();
  
  return coalesce(current_role = 'admin', false);
end;
$$ language plpgsql security definer;

-- 4.2.1 Study Manager Check Helper (Admin, CR, GR)
create or replace function public.is_study_manager()
returns boolean as $$
declare
  current_role text;
begin
  if auth.uid() is null then
    return false;
  end if;
  
  select role into current_role
  from public.profiles
  where id = auth.uid();
  
  return coalesce(current_role in ('admin', 'cr', 'gr'), false);
end;
$$ language plpgsql security definer;

-- 4.3 Automatically create profile entry on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'student' -- Default is student, first admin must be promoted via SQL or bootstrap
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.institutions enable row level security;
alter table public.academic_programs enable row level security;
alter table public.semesters enable row level security;
alter table public.subjects enable row level security;
alter table public.resources enable row level security;
alter table public.announcements enable row level security;
alter table public.feedback enable row level security;
alter table public.platform_settings enable row level security;
alter table public.chat_messages enable row level security;

-- 5.1 Profiles Policies
create policy "Users can view their own profile or Admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own display name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5.2 Public Read Policies (Anonymous and Authenticated can read published active data)
create policy "Anyone can view active institutions"
  on public.institutions for select
  using (is_active = true or public.is_admin());

create policy "Anyone can view active programs"
  on public.academic_programs for select
  using (is_active = true or public.is_admin());

create policy "Anyone can view active semesters"
  on public.semesters for select
  using (is_active = true or public.is_admin());

create policy "Anyone can view active subjects"
  on public.subjects for select
  using (is_active = true or public.is_admin());

create policy "Anyone can view published resources"
  on public.resources for select
  using (status = 'published' or public.is_admin());

create policy "Anyone can view published announcements"
  on public.announcements for select
  using (status = 'published' or public.is_admin());

create policy "Anyone can view public settings"
  on public.platform_settings for select
  using (true);

-- 5.3 Public Feedback Submission
create policy "Anyone can submit feedback or reports"
  on public.feedback for insert
  with check (true);

create policy "Only admins can view feedback"
  on public.feedback for select
  using (public.is_admin());

create policy "Only admins can update feedback status"
  on public.feedback for update
  using (public.is_admin());

-- 5.4 Administrator Full Access Policies (CRUD)
-- Institutions
create policy "Admins can insert institutions" on public.institutions for insert with check (public.is_admin());
create policy "Admins can update institutions" on public.institutions for update using (public.is_admin());
create policy "Admins can delete institutions" on public.institutions for delete using (public.is_admin());

-- Academic Programs
create policy "Admins can insert programs" on public.academic_programs for insert with check (public.is_admin());
create policy "Admins can update programs" on public.academic_programs for update using (public.is_admin());
create policy "Admins can delete programs" on public.academic_programs for delete using (public.is_admin());

-- Semesters
create policy "Admins can insert semesters" on public.semesters for insert with check (public.is_admin());
create policy "Admins can update semesters" on public.semesters for update using (public.is_admin());
create policy "Admins can delete semesters" on public.semesters for delete using (public.is_admin());

-- Subjects
create policy "Admins can insert subjects" on public.subjects for insert with check (public.is_admin());
create policy "Admins can update subjects" on public.subjects for update using (public.is_admin());
create policy "Admins can delete subjects" on public.subjects for delete using (public.is_admin());

-- Resources (Admins, CR, and GR can insert, update, and manage resources)
create policy "Managers can insert resources" on public.resources for insert with check (public.is_study_manager());
create policy "Managers can update resources" on public.resources for update using (public.is_study_manager());
create policy "Managers can delete resources" on public.resources for delete using (public.is_study_manager());

-- Announcements
create policy "Managers can insert announcements" on public.announcements for insert with check (public.is_study_manager());
create policy "Managers can update announcements" on public.announcements for update using (public.is_study_manager());
create policy "Managers can delete announcements" on public.announcements for delete using (public.is_study_manager());

-- In-Platform Chat Messages
create policy "Users can view chat messages" on public.chat_messages for select using (true);
create policy "Users can insert chat messages" on public.chat_messages for insert with check (true);

-- Platform Settings (Master Admin only)
create policy "Admins can manage platform settings" on public.platform_settings for all using (public.is_admin());
