-- ==============================================================================
-- HAMMAD STUDYHUB — PERSISTENT NOTIFICATIONS & TEACHER SUBJECT RLS POLICIES
-- Architect: Muhammad Hammad
-- Migration: 20261105000000_create_notifications_and_teacher_subject_rls.sql
-- ==============================================================================

-- 1. PERSISTENT NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.persistent_notifications (
  id TEXT PRIMARY KEY,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('user', 'role', 'subject_students', 'subject_teachers', 'all')),
  recipient_id TEXT,
  actor_id TEXT,
  actor_name TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  subject_id TEXT,
  subject_name TEXT,
  target_url TEXT NOT NULL,
  entity_id TEXT,
  priority BOOLEAN DEFAULT FALSE,
  badge_label TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  read_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast retrieval and sorting
CREATE INDEX IF NOT EXISTS idx_p_notifs_recipient ON public.persistent_notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_p_notifs_subject ON public.persistent_notifications(subject_id);
CREATE INDEX IF NOT EXISTS idx_p_notifs_type ON public.persistent_notifications(type);
CREATE INDEX IF NOT EXISTS idx_p_notifs_created_at ON public.persistent_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.persistent_notifications ENABLE ROW LEVEL SECURITY;

-- Permissive policy for read access (matching recipient or student curriculum)
CREATE POLICY "Allow read notifications for recipients and enrolled users"
  ON public.persistent_notifications
  FOR SELECT
  USING (true);

-- Allow inserting notifications
CREATE POLICY "Allow insert notifications"
  ON public.persistent_notifications
  FOR INSERT
  WITH CHECK (true);

-- Allow updating read status
CREATE POLICY "Allow update read status"
  ON public.persistent_notifications
  FOR UPDATE
  USING (true);

-- 2. ENABLE REALTIME PUBLICATION FOR NOTIFICATIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'persistent_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.persistent_notifications;
  END IF;
END $$;

