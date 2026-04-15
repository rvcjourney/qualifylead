-- ============================================================
-- Migration: Add user_email to submissions tables
-- Safe to run multiple times.
-- ============================================================

ALTER TABLE lead_qualify_responses
  ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE lead_qualify_lead_scores
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Optional index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_lq_lead_scores_user_email ON lead_qualify_lead_scores(user_email);
