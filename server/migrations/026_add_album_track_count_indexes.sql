-- Migration: Add indexes to support per-album track counts and per-artist album counts
-- Date: 2026-07-06
--
-- Neither tracks(album_id) nor albums(artist_id) has an index today. Both are
-- needed to keep the new grid-count queries (server/src/services/countsService.ts)
-- fast, and both also speed up existing eligibility joins that filter on the
-- same columns (albumsService.randomAll/randomByTag's
-- "INNER JOIN tracks t ON t.album_id = al.id AND t.approved = true", and
-- /artists/random's "INNER JOIN albums al ON al.artist_id = a.id").

CREATE INDEX idx_tracks_album_id_approved ON tracks(album_id) WHERE approved = true;
CREATE INDEX idx_albums_artist_id ON albums(artist_id);
