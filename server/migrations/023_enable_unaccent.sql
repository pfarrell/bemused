-- Migration: Enable unaccent so admin artist/album search is accent-insensitive
-- Date: 2026-07-02

CREATE EXTENSION IF NOT EXISTS unaccent;
