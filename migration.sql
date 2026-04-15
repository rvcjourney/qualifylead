-- ============================================================
-- Migration: Run this if you already set up the database
-- with the original database-setup.sql.
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================

-- Add custom scoring thresholds per company
ALTER TABLE lead_qualify_companies
  ADD COLUMN IF NOT EXISTS threshold_hot  INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS threshold_warm INTEGER DEFAULT 60;

-- Add mandatory flag per field (default: required)
ALTER TABLE lead_qualify_fields
  ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT TRUE;
