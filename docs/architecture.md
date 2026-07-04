# Architecture Notes

Durable reference notes on non-obvious structural decisions. Unlike `docs/superpowers/specs`/`docs/superpowers/plans` (ephemeral, gitignored, one per feature), this file is committed and meant to accumulate over time — update it in place rather than creating a new doc per topic.

## Album / artist data model

- `albums.artist_id` is `NOT NULL` and every album currently points at exactly one artist row. There is no way today for an album to have zero owning artists.
- `tracks.artist_id` is nullable and independent of `albums.artist_id` — a track can be credited to a different artist than its album (used for various-artists compilations; see below).
- Neither `albums.artist_id` nor `tracks.artist_id` has a foreign key constraint (confirmed via `pg_constraint`) — the database will not catch a dangling reference if an artist row is deleted without reassigning dependents first.
- `artist_albums` is a many-to-many join table (`artist_id`, `album_id`, `role`, `order`) used for secondary credits (`featured`/`guest`/`collaborator`/`compilation` roles) — distinct from `albums.artist_id`'s "primary owner" concept.

### Hidden trigger: `albums.artist_id` auto-syncs into `artist_albums`

Two DB triggers (`trigger_sync_artist_albums_insert` / `_update`, defined in `server/schema.sql`, originally from `server/migrations/004_create_artist_albums.sql`) fire on every INSERT/UPDATE of `albums` and write a `role='primary'` row into `artist_albums` keyed off `NEW.artist_id`. This keeps `artist_albums`'s primary-role row in sync with `albums.artist_id` automatically — but it's invisible from application code. Any future work that touches `albums.artist_id` (bulk updates, migrations, ORM changes) should check this trigger's behavior first; it is exactly the kind of thing that fails silently at the DB layer regardless of how careful the app code above it is.

`artist_albums.artist_id` is also `NOT NULL`, so if `albums.artist_id` were ever made nullable, the trigger would need to be rewritten to skip/delete the primary row on NULL rather than attempting to write a NULL into a NOT NULL column (which would hard-fail every album write path: admin create/update, merge/move routes, the upload worker's album insert).

## Various-artists / compilation albums

**Decision (2026-07-04): albums stay NOT NULL on `artist_id`. A various-artists album points at a single universal placeholder artist ("Various Artists", artist id 161) rather than being made ownerless.**

This was chosen over making `albums.artist_id` nullable after mapping the full blast radius of the nullable approach:
- ~10 backend files (every `INNER JOIN artists ON albums.artist_id` needs to become a `LEFT JOIN`, plus every response shape building `artist: {id, name}` needs a null-safe fallback) across `albums.ts`, `artists.ts`, `admin.ts`, `collections.ts`, `tags.ts`, `searchService.ts`, `albumsService.ts`, `playlists.ts`, and the upload worker.
- ~7 frontend files with unguarded `album.artist.name`/`.id` access that would throw outright on a null artist (`Search.jsx`, `Track.jsx`, `NowPlaying.jsx` are the highest-risk — direct property access, not optional chaining).
- The hidden trigger above, which would need a rewrite and is the single riskiest part since it fails silently at the DB layer.

Total: roughly 17-18 files plus a nontrivial trigger rewrite, for a change whose actual goal (correct per-track artist display, "appears on" credit, avoiding one-album-per-artist fragmentation) is already achievable with a placeholder artist and no schema change.

**One universal placeholder, not per-category** (not separate "Various Artists" vs "Original Soundtrack" placeholders) — the album's own title already conveys what kind of release it is; the placeholder is a structural stand-in, not something meant to be browsed as if it were a real artist.

### What already works (shipped 2026-07-03, migration `024_add_is_compilation.sql`)

- `albums.is_compilation` (boolean, decoupled from any specific artist row — replaced a prior hardcoded `artist_id === 161` convention that was duplicated across a migration, admin merge logic, and frontend display code).
- `tracks.artist_id` per-track attribution, independent of the album's artist — the upload worker resolves each track's artist from its own ID3 tag when a batch is flagged as a compilation, instead of a single batch-level pick overwriting every track.
- Track display shows `<title> — <artist>` when a track's artist differs from the album's own artist (`Track.jsx`, compares by id not name).
- "Appears On" (artist page) and full-text search both surface an artist via their track-level credits (`tracks.artist_id`), not just via being an album's primary artist.

### Known gap being redesigned (as of 2026-07-04)

Uploading a compilation batch with the "various artists" flag checked, but with no batch-level artist typed, currently still resolves the *album's own* artist per-file from each track's ID3 tag (only track-level resolution was made compilation-aware, not album-level) — this fragments one compilation into N separate albums, one per distinct ID3 artist tag. Real-world incident: a 10-track Easy Rider soundtrack upload created 8 separate "Easy Rider (Soundtrack)" album rows.

Fix in progress: checking "various artists compilation" in `AdminUpload` will auto-fill and lock the Artist field to the universal placeholder (artist id 161), removing the possibility of per-file fragmentation. The album detail page will also grow a header list of links to every distinct artist with a track credit on the album (derived from `tracks.artist_id`, not from `artist_albums`) — see the design spec for this work once written (`docs/superpowers/specs/`, not committed) for the full plan.
