-- server/migrations/061_create_external_links.sql
-- Generic links from albums/artists to outside data sources (Discogs,
-- Wikidata, Bandcamp, ...). MusicBrainz and Wikipedia keep their dedicated
-- columns on albums/artists; this table is for everything else.
-- No FK on entity_id (polymorphic), same as the rest of the schema; callers
-- that delete or merge albums/artists clean these rows up.
CREATE TABLE IF NOT EXISTS external_links (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('album', 'artist')),
  entity_id INTEGER NOT NULL,
  source VARCHAR(30) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  external_id TEXT NOT NULL,
  url TEXT NOT NULL,
  matched_by VARCHAR(10) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, source, kind, external_id)
);

CREATE INDEX IF NOT EXISTS idx_external_links_entity
  ON external_links (entity_type, entity_id);
