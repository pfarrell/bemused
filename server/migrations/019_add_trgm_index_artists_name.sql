-- Migration: Add pg_trgm GIN index on artists.name for fast similarity and LIKE searches
-- Date: 2026-04-07

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_artists_name_trgm ON artists USING GIN (lower(name) gin_trgm_ops);
