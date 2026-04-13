-- Migration: Add is_hidden to artist_relations for soft-delete of unwanted relations
-- Date: 2026-04-07

ALTER TABLE artist_relations ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_artist_relations_is_hidden ON artist_relations(is_hidden) WHERE is_hidden = TRUE;
