-- Migration: Cascade upload_queue deletion when its track is deleted
-- Date: 2026-07-03
--
-- upload_queue.track_id was the only foreign key referencing tracks/albums
-- without an ON DELETE cascade action (artist_albums, collection_albums, and
-- images all already cascade). This made DELETE /admin/album/:id, DELETE
-- /admin/artist/:id, and DELETE /admin/track/:id fail with a foreign key
-- violation whenever the track being deleted still had its original
-- upload_queue row (which is nearly always, since queue rows aren't cleaned
-- up after processing completes).

ALTER TABLE upload_queue DROP CONSTRAINT upload_queue_track_id_fkey;
ALTER TABLE upload_queue ADD CONSTRAINT upload_queue_track_id_fkey
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE;
