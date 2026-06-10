-- Migration: Create discovery_sources table and extend upload_queue
-- Date: 2026-06-10

CREATE TABLE IF NOT EXISTS discovery_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  kind VARCHAR(100) NOT NULL,
  url_pattern TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discovery_sources_kind ON discovery_sources(kind);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_enabled ON discovery_sources(enabled);

COMMENT ON TABLE discovery_sources IS 'Sources from which tracks are automatically discovered (e.g. RSS feeds, playlists)';
COMMENT ON COLUMN discovery_sources.kind IS 'Type of discovery source (e.g. rss, spotify, youtube, manual)';
COMMENT ON COLUMN discovery_sources.url_pattern IS 'URL or pattern used to fetch content from this source';
COMMENT ON COLUMN discovery_sources.enabled IS 'Whether this source is actively polled for new tracks';

-- Add discovery tracking columns to upload_queue
ALTER TABLE upload_queue ADD COLUMN IF NOT EXISTS discovery_source_id INTEGER REFERENCES discovery_sources(id);
ALTER TABLE upload_queue ADD COLUMN IF NOT EXISTS source_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_upload_queue_source_url ON upload_queue(source_url);

COMMENT ON COLUMN upload_queue.discovery_source_id IS 'Discovery source that produced this upload, if any';
COMMENT ON COLUMN upload_queue.source_url IS 'Original URL of the discovered track; unique to prevent duplicate ingestion';
