-- Migration: Add default_tag to users table
-- Date: 2026-06-02

ALTER TABLE users ADD COLUMN IF NOT EXISTS default_tag VARCHAR(255) DEFAULT NULL;

COMMENT ON COLUMN users.default_tag IS 'Default tag filter for the home feed';
