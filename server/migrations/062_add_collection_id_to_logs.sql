-- server/migrations/062_add_collection_id_to_logs.sql
-- Mirrors 057 (playlist_id): set by GET /log/:id when the queue's source was a
-- collection, so Jukebox Mode can show recently played collections.
ALTER TABLE logs ADD COLUMN collection_id integer;

CREATE INDEX logs_collection_id_created_at_idx
  ON logs (collection_id, created_at DESC)
  WHERE collection_id IS NOT NULL;
