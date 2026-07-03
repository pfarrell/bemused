import { Kysely } from 'kysely'
import type { Context } from 'hono'
import pg from 'pg'
import { db, Database } from '../db/database.js'
import { streamBase } from '../db/streamUrl.js'

// TODO: standalone pool, separate from the shared `db` instance above — known debt,
// tracked in follow-up issue "Consolidate search.ts's standalone pg.Pool into the shared db instance"
const pool = new pg.Pool({ connectionString: process.env.BEMUSED_DB })

export function createSearchService(db: Kysely<Database>) {
  return {
    async runUnionSearch(likeParam: string, filteredQ: string) {
      const searchSql = `
        SELECT q.model_type, q.id, q.similarity_score FROM (
          (SELECT DISTINCT ON (a.id) 'Album' AS model_type, a.id, 0.8 AS similarity_score
            FROM albums a
            INNER JOIN tracks t ON t.album_id = a.id AND t.approved = true
            WHERE f_unaccent(lower(a.title)) ILIKE lower($1)
            ORDER BY a.id)
          UNION ALL
          (SELECT model_type, id, similarity_score FROM (
            SELECT 'Album' AS model_type, a.id,
              similarity(f_unaccent(lower(a.title)), lower($2)) AS similarity_score,
              ROW_NUMBER() OVER(PARTITION BY a.id ORDER BY similarity(f_unaccent(lower(a.title)), lower($2)) DESC) AS rn
            FROM albums a
            INNER JOIN tracks t ON t.album_id = a.id AND t.approved = true
            WHERE similarity(f_unaccent(lower(a.title)), lower($2)) > 0.24
          ) ranked WHERE rn = 1 ORDER BY similarity_score DESC)
          UNION ALL
          (SELECT DISTINCT ON (a.id) 'Artist' AS model_type, a.id, 0.8 AS similarity_score
            FROM artists a
            INNER JOIN albums al ON al.artist_id = a.id
            INNER JOIN tracks t ON t.album_id = al.id AND t.approved = true
            WHERE f_unaccent(lower(a.name)) ILIKE lower($1)
            ORDER BY a.id)
          UNION ALL
          (SELECT DISTINCT ON (a.id) 'Artist' AS model_type, a.id, 0.8 AS similarity_score
            FROM artists a
            INNER JOIN tracks t ON t.artist_id = a.id AND t.approved = true
            WHERE f_unaccent(lower(a.name)) ILIKE lower($1)
            ORDER BY a.id)
          UNION ALL
          (SELECT model_type, id, similarity_score FROM (
            SELECT 'Artist' AS model_type, a.id,
              similarity(f_unaccent(lower(a.name)), lower($2)) AS similarity_score,
              ROW_NUMBER() OVER(PARTITION BY a.id ORDER BY similarity(f_unaccent(lower(a.name)), lower($2)) DESC) AS rn
            FROM artists a
            INNER JOIN albums al ON al.artist_id = a.id
            INNER JOIN tracks t ON t.album_id = al.id AND t.approved = true
            WHERE similarity(f_unaccent(lower(a.name)), lower($2)) > 0.24
          ) ranked WHERE rn = 1 ORDER BY similarity_score DESC LIMIT 50)
          UNION ALL
          (SELECT model_type, id, similarity_score FROM (
            SELECT 'Artist' AS model_type, a.id,
              similarity(f_unaccent(lower(a.name)), lower($2)) AS similarity_score,
              ROW_NUMBER() OVER(PARTITION BY a.id ORDER BY similarity(f_unaccent(lower(a.name)), lower($2)) DESC) AS rn
            FROM artists a
            INNER JOIN tracks t ON t.artist_id = a.id AND t.approved = true
            WHERE similarity(f_unaccent(lower(a.name)), lower($2)) > 0.24
          ) ranked WHERE rn = 1 ORDER BY similarity_score DESC LIMIT 50)
          UNION ALL
          (SELECT 'Playlist' AS model_type, id, -1.0 FROM playlists WHERE f_unaccent(lower(name)) ILIKE lower($1))
          UNION ALL
          (SELECT 'Track' AS model_type, id, -1.0 FROM tracks WHERE f_unaccent(lower(title)) ILIKE lower($1) AND approved = true)
        ) q ORDER BY q.similarity_score DESC
      `

      const { rows } = await pool.query<{ model_type: string; id: number; similarity_score: number }>(
        searchSql,
        [likeParam, filteredQ]
      )
      return rows
    },

    async fetchByIds(table: 'artists' | 'playlists', ids: number[]) {
      if (!ids?.length) return []
      const rows = await db.selectFrom(table).selectAll().where('id', 'in', ids).execute()
      const byId = new Map(rows.map((r: any) => [r.id, r]))
      return ids.map((id) => byId.get(id)).filter(Boolean)
    },

    async fetchArtistsWithCounts(ids: number[]) {
      if (!ids?.length) return []

      // Get artists with album and track counts
      const rows = await db
        .selectFrom('artists')
        .leftJoin('albums', 'albums.artist_id', 'artists.id')
        .leftJoin('tracks', 'tracks.artist_id', 'artists.id')
        .select((eb) => [
          'artists.id',
          'artists.name',
          'artists.image_path',
          'artists.wikipedia',
          'artists.created_at',
          'artists.updated_at',
          eb.fn.count<number>('albums.id').distinct().as('album_count'),
          eb.fn.count<number>('tracks.id').distinct().as('track_count'),
        ])
        .where('artists.id', 'in', ids)
        .where((eb) => eb.or([eb('tracks.approved', '=', true), eb('tracks.id', 'is', null)]))
        .groupBy(['artists.id', 'artists.name', 'artists.image_path', 'artists.wikipedia', 'artists.created_at', 'artists.updated_at'])
        .execute()

      const byId = new Map(rows.map((r: any) => [r.id, r]))
      return ids.map((id) => byId.get(id)).filter(Boolean)
    },

    async fetchAlbumsByIds(ids: number[]) {
      if (!ids?.length) return []
      const rows = await db
        .selectFrom('albums')
        .innerJoin('artists', 'artists.id', 'albums.artist_id')
        .leftJoin('tracks', 'tracks.album_id', 'albums.id')
        .select((eb) => [
          'albums.id', 'albums.title', 'albums.image_path', 'albums.release_year', 'albums.wikipedia',
          'artists.id as artist_id', 'artists.name as artist_name',
          eb.fn.count<number>('tracks.id').distinct().as('track_count'),
        ])
        .where('albums.id', 'in', ids)
        .where((eb) => eb.or([eb('tracks.approved', '=', true), eb('tracks.id', 'is', null)]))
        .groupBy(['albums.id', 'albums.title', 'albums.image_path', 'albums.release_year', 'albums.wikipedia', 'artists.id', 'artists.name'])
        .execute()
      const byId = new Map(rows.map((r) => [r.id, { ...r, artist: { id: r.artist_id, name: r.artist_name } }]))
      return ids.map((id) => byId.get(id)).filter(Boolean)
    },

    async fetchTracksByIds(ids: number[], c: Context) {
      if (!ids?.length) return []
      const rows = await db
        .selectFrom('tracks')
        .leftJoin('albums', 'albums.id', 'tracks.album_id')
        .leftJoin('artists as album_artist', 'album_artist.id', 'albums.artist_id')
        .leftJoin('artists as track_artist', 'track_artist.id', 'tracks.artist_id')
        .select([
          'tracks.id',
          'tracks.title',
          'tracks.track_number',
          'tracks.duration_sec',
          'albums.id as album_id',
          'albums.title as album_title',
          'albums.image_path as album_image_path',
          'album_artist.id as album_artist_id',
          'album_artist.name as album_artist_name',
          'track_artist.id as track_artist_id',
          'track_artist.name as track_artist_name',
        ])
        .where('tracks.id', 'in', ids)
        .where('tracks.approved', '=', true)
        .execute()

      return rows.map((t) => ({
        id: t.id,
        title: t.title,
        track_number: t.track_number,
        duration: t.duration_sec,
        album: t.album_id ? { id: t.album_id, title: t.album_title, artist: { id: t.album_artist_id, name: t.album_artist_name } } : null,
        artist: { id: t.track_artist_id ?? t.album_artist_id, name: t.track_artist_name ?? t.album_artist_name },
        image_path: t.album_image_path,
        url: `${streamBase(c)}/stream/${t.id}`,
        download_url: `${streamBase(c)}/download/${t.id}`,
      }))
    },
  }
}

export const searchService = createSearchService(db)
