-- Migration: Add force_show to artist_relations
-- force_show = true bypasses the similarity threshold on the public artist page
-- Date: 2026-04-07

ALTER TABLE artist_relations ADD COLUMN IF NOT EXISTS force_show BOOLEAN NOT NULL DEFAULT FALSE;
