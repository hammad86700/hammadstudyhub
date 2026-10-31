-- ==============================================================================
-- HAMMAD STUDYHUB — CLEAN DATABASE INITIALIZATION SEED
-- Platform Architect: Muhammad Hammad
-- Note: Zero dummy data. Academic subjects, study materials, and announcements
--       are created and published manually by the Administrator and CRs.
-- ==============================================================================

-- 1. Platform Settings (Branding & Feature Toggles)
insert into public.platform_settings (key, value)
values 
  ('general', '{"platform_name": "Hammad StudyHub", "tagline": "Learn. Revise. Grow.", "creator": "Muhammad Hammad", "contact_email": "hammadstudyhub@example.com"}'::jsonb),
  ('features', '{"allow_feedback": true, "enable_checklist": true, "default_view": "timeline"}'::jsonb)
on conflict (key) do nothing;
