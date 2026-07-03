-- Migration: Add is_compilation flag to albums and upload_queue
-- Date: 2026-07-03
--
-- Replaces the hardcoded "artist_id = 161 means Various Artists" special-casing
-- (previously duplicated across a migration, admin.ts merge logic, and Album.jsx)
-- with a real flag decoupled from any specific artist row.

ALTER TABLE albums ADD COLUMN IF NOT EXISTS is_compilation BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE upload_queue ADD COLUMN IF NOT EXISTS is_compilation BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN albums.is_compilation IS 'True for various-artists compilations/soundtracks — track artists are shown individually and secondary-artist display is suppressed. Decoupled from any specific artist row.';
COMMENT ON COLUMN upload_queue.is_compilation IS 'Set by the admin at upload time; when true, the worker resolves each track''s artist from its own ID3 tag instead of the batch-level artist pick.';

-- Backfill: preserve today's de facto behavior exactly. No other albums are
-- auto-flagged — anything else gets flagged manually via the admin UI.
UPDATE albums SET is_compilation = true WHERE artist_id = 161;
