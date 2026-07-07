import { Kysely, sql } from 'kysely'
import { db, Database } from '../db/database.js'

export function createCountsService(db: Kysely<Database>) {
  return {
    async trackCountsByAlbumIds(albumIds: number[]): Promise<Map<number, number>> {
      if (albumIds.length === 0) return new Map()

      const rows = await db
        .selectFrom('tracks')
        .select(['album_id', sql<string>`count(*)`.as('count')])
        .where('album_id', 'in', albumIds)
        .where('approved', '=', true)
        .groupBy('album_id')
        .execute()

      return new Map(rows.map((r) => [r.album_id as number, parseInt(r.count, 10)]))
    },

    async albumCountsByArtistIds(artistIds: number[]): Promise<Map<number, number>> {
      if (artistIds.length === 0) return new Map()

      const rows = await db
        .selectFrom('albums')
        .select(['artist_id', sql<string>`count(*)`.as('count')])
        .where('artist_id', 'in', artistIds)
        .groupBy('artist_id')
        .execute()

      return new Map(rows.map((r) => [r.artist_id as number, parseInt(r.count, 10)]))
    },
  }
}

export const countsService = createCountsService(db)
