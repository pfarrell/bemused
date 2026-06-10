-- Migration: Add approval gate to tracks
-- Date: 2026-06-10

ALTER TABLE tracks ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN tracks.approved IS 'Whether this track has been approved for playback; defaults true for existing tracks, may be set false for auto-discovered tracks pending review';
