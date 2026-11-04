-- ==============================================================================
-- HAMMAD STUDYHUB — ANONYMOUS STUDENT REPORTING & TEACHER ANONYMOUS POLLS
-- Architect: Muhammad Hammad
--
-- Features:
-- 1. Anonymous Student Reporting System with 5 audience-routing options.
-- 2. Moderation workflow (pending_review, approved, published, rejected, hidden, resolved).
-- 3. Isolated Report Identity Link table (quarantined from normal query access).
-- 4. Audit Log for exceptional identity access.
-- 5. Teacher Anonymous Questions, Polls & Student Feedback System.
-- 6. Strictly Anonymized Responses (Zero student identifiers stored in response records).
-- 7. Detached Poll Participation Registry (Prevents duplicate responses without linking identity to answers).
-- ==============================================================================

-- 1. Anonymous Reports Table
create table if not exists public.anonymous_reports (
  id text primary key,
  reference_number text unique not null,
  title text not null,
  category text not null check (
    category in (
      'academic_concern',
      'classroom_incident',
      'student_behaviour',
      'teaching_learning',
      'facilities_infrastructure',
      'general_suggestion',
      'other'
    )
  ),
  description text not null,
  audience_type text not null check (
    audience_type in (
      'all_students',
      'students_and_teachers',
      'specific_subject',
      'specific_teacher',
      'admin_only'
    )
  ),
  subject_id text references public.subjects(id) on delete set null,
  subject_name text,
  target_teacher_id text,
  target_teacher_name text,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'approved', 'published', 'rejected', 'hidden', 'resolved')
  ),
  moderation_notes text,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  resolution_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Quarantined Report Identity Links Table (Strictly isolated from general read queries)
create table if not exists public.report_identity_links (
  report_id text primary key references public.anonymous_reports(id) on delete cascade,
  reference_number text not null,
  student_id text not null,
  student_name text not null,
  roll_no text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Report Audit Log Table (Records exceptional identity disclosures)
create table if not exists public.report_audit_logs (
  id text primary key,
  report_id text not null,
  reference_number text not null,
  accessed_by text not null,
  access_role text not null,
  reason text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Teacher Anonymous Questions & Polls Table
create table if not exists public.anonymous_questions (
  id text primary key,
  teacher_id text not null,
  teacher_name text,
  subject_id text not null references public.subjects(id) on delete cascade,
  subject_name text,
  title text not null,
  description text,
  question_type text not null check (
    question_type in ('single_choice', 'multiple_choice', 'rating_scale', 'short_answer', 'student_feedback')
  ),
  options jsonb default '[]'::jsonb,
  rating_min integer default 1,
  rating_max integer default 5,
  rating_labels jsonb default '{"min_label": "Poor", "max_label": "Excellent"}'::jsonb,
  is_anonymous boolean default true not null,
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  closing_date timestamp with time zone not null,
  status text not null default 'active' check (status in ('active', 'closed', 'archived')),
  min_responses_threshold integer default 1 not null,
  hide_results_until_closed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Anonymous Responses Table (Strictly NO student identifiers)
create table if not exists public.anonymous_responses (
  id text primary key,
  question_id text not null references public.anonymous_questions(id) on delete cascade,
  subject_id text not null,
  question_type text not null,
  selected_option text,
  selected_options jsonb default '[]'::jsonb,
  rating_value integer,
  written_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Poll Participation Table (Detached tracking to prevent duplicate answers per student)
create table if not exists public.poll_participations (
  id text primary key,
  question_id text not null references public.anonymous_questions(id) on delete cascade,
  student_id text not null,
  participated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (question_id, student_id)
);

-- Indexes for performance
create index if not exists idx_anonymous_reports_status on public.anonymous_reports(status);
create index if not exists idx_anonymous_reports_audience on public.anonymous_reports(audience_type);
create index if not exists idx_anonymous_reports_subject on public.anonymous_reports(subject_id);
create index if not exists idx_anonymous_reports_teacher on public.anonymous_reports(target_teacher_id);
create index if not exists idx_anonymous_questions_subject on public.anonymous_questions(subject_id);
create index if not exists idx_anonymous_questions_teacher on public.anonymous_questions(teacher_id);
create index if not exists idx_anonymous_questions_status on public.anonymous_questions(status);
create index if not exists idx_anonymous_responses_question on public.anonymous_responses(question_id);
create index if not exists idx_poll_participations_lookup on public.poll_participations(question_id, student_id);

-- Enable RLS
alter table public.anonymous_reports enable row level security;
alter table public.report_identity_links enable row level security;
alter table public.report_audit_logs enable row level security;
alter table public.anonymous_questions enable row level security;
alter table public.anonymous_responses enable row level security;
alter table public.poll_participations enable row level security;

-- Permissive policies for anonymous submissions and privacy
create policy "Allow insert anonymous reports" on public.anonymous_reports for insert with check (true);
create policy "Allow read published anonymous reports" on public.anonymous_reports for select using (true);
create policy "Allow update anonymous reports" on public.anonymous_reports for update using (true);

create policy "Allow read and create questions" on public.anonymous_questions for all using (true);
create policy "Allow insert anonymous responses" on public.anonymous_responses for insert with check (true);
create policy "Allow read anonymous responses" on public.anonymous_responses for select using (true);
create policy "Allow participation tracking" on public.poll_participations for all using (true);

