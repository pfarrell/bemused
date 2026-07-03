import { Kysely } from 'kysely'
import { db, Database } from '../db/database.js'

export function createStreamsService(db: Kysely<Database>) {
  return {
    async findTrackPath(id: number) {
      return db
        .selectFrom('tracks')
        .leftJoin('media_files', 'media_files.id', 'tracks.media_file_id')
        .select(['media_files.absolute_path'])
        .where('tracks.id', '=', id)
        .where('tracks.approved', '=', true)
        .executeTakeFirst()
    },

    async findTrackForDownload(id: number) {
      const row = await db
        .selectFrom('tracks')
        .leftJoin('media_files', 'media_files.id', 'tracks.media_file_id')
        .leftJoin('albums', 'albums.id', 'tracks.album_id')
        .leftJoin('artists as track_artist', 'track_artist.id', 'tracks.artist_id')
        .leftJoin('artists as album_artist', 'album_artist.id', 'albums.artist_id')
        .select([
          'media_files.absolute_path as absolute_path',
          'media_files.file_type as file_type',
          'tracks.title as title',
          'track_artist.name as track_artist_name',
          'album_artist.name as album_artist_name',
        ])
        .where('tracks.id', '=', id)
        .where('tracks.approved', '=', true)
        .executeTakeFirst()

      if (!row?.absolute_path) return null

      const rawFileType = row.file_type?.trim()
      const fileType = rawFileType ? (rawFileType.startsWith('.') ? rawFileType : `.${rawFileType}`) : '.mp3'

      return {
        absolutePath: row.absolute_path,
        fileType,
        title: row.title,
        artistName: row.track_artist_name || row.album_artist_name || 'Unknown Artist',
      }
    },
  }
}

export const streamsService = createStreamsService(db)
