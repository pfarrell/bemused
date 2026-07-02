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
  }
}

export const streamsService = createStreamsService(db)
