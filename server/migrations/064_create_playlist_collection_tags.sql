-- Migration: Tag playlists and collections so a profile filter can apply to them
-- Date: 2026-10-18
--
-- Until now playlists/collections had no tag concept and were deliberately
-- never profile-filtered. With a profile active, a playlist now matches only
-- if it carries one of the profile's tags directly; a collection matches if it
-- carries one directly OR contains an album that matches the existing album
-- rule (album or its artist tagged).
--
-- Also adds the (owner, tag) indexes albums_tags/artists_tags never had —
-- every profile-filter EXISTS probe against them (search, random, recent,
-- and now the collection album check) was a sequential scan.

CREATE TABLE playlists_tags (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE (playlist_id, tag_id)
);
CREATE INDEX idx_playlists_tags_tag_id ON playlists_tags (tag_id);

CREATE TABLE collections_tags (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE (collection_id, tag_id)
);
CREATE INDEX idx_collections_tags_tag_id ON collections_tags (tag_id);

CREATE INDEX IF NOT EXISTS idx_albums_tags_album_id_tag_id ON albums_tags (album_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_artists_tags_artist_id_tag_id ON artists_tags (artist_id, tag_id);
