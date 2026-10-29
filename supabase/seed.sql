-- ==============================================================================
-- HAMMAD STUDYHUB — SEED DATA SCRIPT
-- Creator: Muhammad Hammad
-- Note: Safe sample data for initial setup and testing.
-- ==============================================================================

-- 1. Initial Platform Settings
insert into public.platform_settings (key, value)
values 
  ('general', '{"platform_name": "Hammad StudyHub", "tagline": "Learn. Revise. Grow.", "creator": "Muhammad Hammad", "contact_email": "hammadstudyhub@example.com"}'::jsonb),
  ('features', '{"allow_feedback": true, "enable_checklist": true, "default_view": "timeline"}'::jsonb)
on conflict (key) do nothing;

-- 2. Sample Institution
insert into public.institutions (id, name, slug, description, is_active)
values (
  '11111111-1111-1111-1111-111111111111',
  'City College of Higher Education',
  'city-college',
  'Premier regional academic institution offering associate degree programs.',
  true
) on conflict (slug) do nothing;

-- 3. Academic Program
insert into public.academic_programs (id, institution_id, name, slug, description, is_active)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Associate Degree in Computer Science (ADP CS)',
  'adp-computer-science',
  'Two-year comprehensive foundation covering computer architecture, programming, logic design, and natural sciences.',
  true
) on conflict (slug) do nothing;

-- 4. Semesters
insert into public.semesters (id, program_id, name, semester_number, academic_year, is_active)
values 
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'Semester 1', 1, '2026-2027', true),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'Semester 2', 2, '2026-2027', true)
on conflict do nothing;

-- 5. Subjects
insert into public.subjects (id, institution_id, program_id, semester_id, name, slug, code, description, instructor, icon, color, is_featured, is_active, sort_order)
values
  (
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'Computer Programming',
    'computer-programming',
    'CS-101',
    'Fundamentals of structured programming, control flows, functions, arrays, and algorithms in C++.',
    'Engr. Muhammad Hammad',
    'code',
    'blue',
    true,
    true,
    1
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'Digital Logic Design',
    'digital-logic-design',
    'CS-102',
    'Boolean algebra, logic gates, combinational and sequential circuit analysis, Karnaugh maps, and flip-flops.',
    'Prof. Tariq Mahmood',
    'cpu',
    'indigo',
    true,
    true,
    2
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'Functional English',
    'functional-english',
    'ENG-101',
    'Academic reading, professional communication, technical writing, grammar mechanics, and active listening skills.',
    'Ms. Ayesha Khan',
    'book-open',
    'emerald',
    false,
    true,
    3
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'Natural Sciences',
    'natural-sciences',
    'NS-101',
    'Exploration of scientific inquiry, physics principles, biological systems, and scientific thinking in technology.',
    'Dr. Bilal Ahmed',
    'atom',
    'teal',
    false,
    true,
    4
  ),
  (
    '44444444-4444-4444-4444-444444444445',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'Social Science',
    'social-science',
    'SS-101',
    'Contemporary society, human behavior, societal ethics, civic engagement, and community development.',
    'Dr. Farooq Ali',
    'users',
    'rose',
    false,
    true,
    5
  )
on conflict (slug) do nothing;

-- 6. Sample Resources (Organized daily-wise)
insert into public.resources (
  subject_id, title, slug, description, resource_type, lesson_date, source_provider, external_url, embed_url, topic, chapter, tags, status, published_at
) values
  -- Computer Programming Resources
  (
    '44444444-4444-4444-4444-444444444441',
    'Lesson 01: Introduction to Algorithms & Pseudocode',
    'lesson-01-algorithms-pseudocode',
    'Complete lecture notes covering flowchart symbols, algorithmic reasoning, and problem formulation.',
    'pdf',
    '2026-10-20',
    'google_drive',
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OGvE2upms/view',
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OGvE2upms/preview',
    'Algorithms & Logic',
    'Chapter 1',
    array['algorithms', 'flowchart', 'c++'],
    'published',
    '2026-10-20T10:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444441',
    'Lesson 02: Variables, Data Types & Memory Allocation',
    'lesson-02-variables-data-types',
    'Video walkthrough explaining primitive types, sizeof operator, and memory stack layout.',
    'video',
    '2026-10-22',
    'youtube',
    'https://www.youtube.com/watch?v=zOjov-2OZ0E',
    'https://www.youtube.com/embed/zOjov-2OZ0E',
    'Data Representation',
    'Chapter 2',
    array['variables', 'memory', 'types'],
    'published',
    '2026-10-22T10:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444441',
    'Lesson 03: Control Structures & Nested Loops Practice',
    'lesson-03-control-structures',
    'High-resolution classroom whiteboard snapshot demonstrating switch-case versus nested if-else ladders.',
    'whiteboard',
    '2026-10-25',
    'google_drive',
    'https://drive.google.com/file/d/1sample_whiteboard_loop_structures/view',
    'https://drive.google.com/file/d/1sample_whiteboard_loop_structures/preview',
    'Control Flow',
    'Chapter 3',
    array['loops', 'if-else', 'whiteboard'],
    'published',
    '2026-10-25T11:30:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444441',
    'Assignment 01: Number Theory & Loop Patterns',
    'assignment-01-number-theory',
    'Practice worksheet containing 10 algorithmic problems on Fibonacci sequences, prime number detection, and inverted pyramid patterns.',
    'assignment',
    '2026-10-26',
    'google_drive',
    'https://drive.google.com/file/d/1sample_assignment_cxx_loops/view',
    'https://drive.google.com/file/d/1sample_assignment_cxx_loops/preview',
    'Practical Homework',
    'Chapter 3',
    array['homework', 'patterns', 'practice'],
    'published',
    '2026-10-26T14:00:00Z'
  ),
  -- Digital Logic Design Resources
  (
    '44444444-4444-4444-4444-444444444442',
    'Lesson 01: Number Systems & Conversions (Binary, Hex, Octal)',
    'lesson-01-number-systems-conversions',
    'Step-by-step conversion handbook with 2s complement arithmetic and signed representation examples.',
    'pdf',
    '2026-10-21',
    'google_drive',
    'https://drive.google.com/file/d/1sample_dld_number_systems/view',
    'https://drive.google.com/file/d/1sample_dld_number_systems/preview',
    'Number Systems',
    'Unit 1',
    array['binary', 'hex', 'complements'],
    'published',
    '2026-10-21T09:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    'Lesson 02: Boolean Axioms & De Morgans Laws',
    'lesson-02-boolean-axioms-de-morgan',
    'Whiteboard diagrams showing circuit duality theorems and schematic simplifications.',
    'whiteboard',
    '2026-10-24',
    'google_drive',
    'https://drive.google.com/file/d/1sample_dld_de_morgans/view',
    'https://drive.google.com/file/d/1sample_dld_de_morgans/preview',
    'Boolean Algebra',
    'Unit 2',
    array['boolean', 'gates', 'theorems'],
    'published',
    '2026-10-24T12:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    'Mid-Term Past Papers & Solved Model Solutions (2024-2025)',
    'midterm-past-papers-dld-2024-2025',
    'Compiled past examination questions with step-by-step K-Map minimizations and timing diagrams.',
    'past_paper',
    '2026-10-28',
    'google_drive',
    'https://drive.google.com/file/d/1sample_dld_past_papers/view',
    'https://drive.google.com/file/d/1sample_dld_past_papers/preview',
    'Exam Preparation',
    'All Units',
    array['past-papers', 'midterms', 'solutions'],
    'published',
    '2026-10-28T16:00:00Z'
  ),
  -- Functional English Resources
  (
    '44444444-4444-4444-4444-444444444443',
    'Academic Writing: Thesis Statements & Cohesion',
    'academic-writing-thesis-statements',
    'Comprehensive lecture slides on structuring academic argumentative essays and paragraph transitions.',
    'presentation',
    '2026-10-23',
    'google_drive',
    'https://drive.google.com/file/d/1sample_english_academic_writing/view',
    'https://drive.google.com/file/d/1sample_english_academic_writing/preview',
    'Writing Skills',
    'Module 2',
    array['essay', 'grammar', 'presentation'],
    'published',
    '2026-10-23T08:30:00Z'
  )
on conflict do nothing;

-- 7. Announcements
insert into public.announcements (title, body, subject_id, category, is_pinned, status, published_at)
values
  (
    'Welcome to Hammad StudyHub Fall 2026!',
    'Welcome students to the official learning and resource management hub created by Muhammad Hammad. All daily notes, whiteboard photos, and assignments are updated right after every class.',
    null,
    'general',
    true,
    'published',
    '2026-10-15T08:00:00Z'
  ),
  (
    'Mid-Term Examination Schedule Announced',
    'The mid-term exams for ADP CS Semester 1 begin on November 15, 2026. Please check the Past Papers tab under Computer Programming and Digital Logic Design for revision material.',
    null,
    'exam',
    true,
    'published',
    '2026-10-27T10:00:00Z'
  ),
  (
    'CS-101 Programming Lab 02 Submission Deadline',
    'Please submit your Assignment 01 code files before Friday 11:59 PM via Google Classroom or direct email to your instructor.',
    '44444444-4444-4444-4444-444444444441',
    'assignment',
    false,
    'published',
    '2026-10-28T14:00:00Z'
  )
on conflict do nothing;

-- 8. First Admin Promotion Reminder
-- When your admin user signs up through Supabase Auth with their email, promote them by running:
-- UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com');
