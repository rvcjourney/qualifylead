-- ============================================================
-- Dynamic Lead Qualification System — Database Setup
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- TABLE 1: lead_qualify_companies
-- Stores each company's form definition + custom scoring thresholds
CREATE TABLE IF NOT EXISTS lead_qualify_companies (
  id             BIGSERIAL PRIMARY KEY,
  company_id     TEXT UNIQUE NOT NULL,
  company_name   TEXT NOT NULL,
  threshold_hot  INTEGER DEFAULT 80,   -- min pts for Hot Lead
  threshold_warm INTEGER DEFAULT 60,   -- min pts for Warm Lead
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 2: lead_qualify_fields
-- Stores dynamic fields created by admin per company
CREATE TABLE IF NOT EXISTS lead_qualify_fields (
  id           BIGSERIAL PRIMARY KEY,
  company_id   TEXT NOT NULL REFERENCES lead_qualify_companies(company_id) ON DELETE CASCADE,
  field_name   TEXT NOT NULL,
  field_type   TEXT NOT NULL CHECK (field_type IN ('text', 'dropdown', 'yes_no', 'number')),
  is_mandatory BOOLEAN DEFAULT TRUE,   -- if false, field is optional for users
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 3: lead_qualify_options
-- Stores dropdown/yes_no options with score per field
CREATE TABLE IF NOT EXISTS lead_qualify_options (
  id           BIGSERIAL PRIMARY KEY,
  field_id     BIGINT NOT NULL REFERENCES lead_qualify_fields(id) ON DELETE CASCADE,
  option_value TEXT NOT NULL,
  score        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 4: lead_qualify_responses
-- Stores individual field responses per submission
CREATE TABLE IF NOT EXISTS lead_qualify_responses (
  id                BIGSERIAL PRIMARY KEY,
  submission_id     UUID NOT NULL,
  lead_company_name TEXT,
  company_id        TEXT NOT NULL,
  field_id          BIGINT NOT NULL,
  field_name        TEXT,
  value             TEXT,
  score             INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 5: lead_qualify_lead_scores
-- Stores final calculated score and category per submission
CREATE TABLE IF NOT EXISTS lead_qualify_lead_scores (
  id                BIGSERIAL PRIMARY KEY,
  submission_id     UUID NOT NULL UNIQUE,
  lead_company_name TEXT,
  company_id        TEXT NOT NULL,
  total_score       INTEGER NOT NULL,
  category          TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lq_fields_company_id       ON lead_qualify_fields(company_id);
CREATE INDEX IF NOT EXISTS idx_lq_options_field_id        ON lead_qualify_options(field_id);
CREATE INDEX IF NOT EXISTS idx_lq_responses_submission_id ON lead_qualify_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_lq_responses_company_id    ON lead_qualify_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_lq_lead_scores_company_id  ON lead_qualify_lead_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_lq_lead_scores_created_at  ON lead_qualify_lead_scores(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- Enables RLS and allows public read/write via anon key.
-- Adjust these policies for production (e.g. restrict admin
-- write operations to authenticated users only).
-- ============================================================
ALTER TABLE lead_qualify_companies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualify_fields      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualify_options     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualify_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualify_lead_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON lead_qualify_companies   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON lead_qualify_fields      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON lead_qualify_options     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON lead_qualify_responses   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON lead_qualify_lead_scores FOR ALL TO anon USING (true) WITH CHECK (true);
